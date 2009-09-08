// ==========================================================================
// Project:   SproutCore - JavaScript Application Framework
// Copyright: ©2006-2009 Apple Inc. and contributors.
// License:   Licened under MIT license (see license.js)
// ==========================================================================
/*globals module ok equals same test MyApp */

// test core array-mapping methods for RecordArray with RecordAttribute
var storeKeys, rec, rec2, bar, bar2 ;

module("SC.RecordAttribute core methods", {
  setup: function() {

    MyApp = SC.Object.create({
      store: SC.Store.create()
    });
    
    MyApp.Foo = SC.Record.extend({
      
      // test toOne relationships
      relatedTo: SC.Record.toOne('MyApp.Foo'),
      
      // test toOne relationship with computed type
      relatedToComputed: SC.Record.toOne(function() {
        // not using .get() to avoid another transform which will 
        // trigger an infinite loop
        return (this.readAttribute('relatedToComputed').indexOf("foo")===0) ? MyApp.Foo : MyApp.Bar;
      }),
      
      bar: SC.Record.toOne('MyApp.Bar', { inverse: 'foo' })
      
    });
    
    MyApp.Bar = SC.Record.extend({
      foo: SC.Record.toOne('MyApp.Foo', { inverse: 'bar' })
    });
    
    SC.RunLoop.begin();
    storeKeys = MyApp.store.loadRecords(MyApp.Foo, [
      { 
        guid: 'foo1', 
        firstName: "John", 
        lastName: "Doe", 
        date: "2009-03-01T20:30-08:00",
        anArray: ['one', 'two', 'three'],
        anObject: { 'key1': 'value1', 'key2': 'value2' },
        bar: "bar1"
      },
      
      { 
        guid: 'foo2', 
        firstName: "Jane", 
        lastName: "Doe", 
        relatedTo: 'foo1',
        anArray: 'notAnArray',
        anObject: 'notAnObject',
        nonIsoDate: "2009/06/10 8:55:50 +0000"
      },
      
      { 
        guid: 'foo3', 
        firstName: "Alex", 
        lastName: "Doe", 
        relatedToComputed: 'bar1',
        anArray: ['one', 'two', 'three'],
        anObject: { 'key1': 'value1', 'key2': 'value2' },
        bar: "bar2"
      }
      
    ]);
    
    MyApp.store.loadRecords(MyApp.Bar, [
      { guid: 'bar1', city: "Chicago", foo: "foo1" },
      { guid: "bar2", city: "New York", foo: 'foo3' }
    ]);
    
    SC.RunLoop.end();
    
    rec = MyApp.store.find(MyApp.Foo, 'foo1');
    rec2 = MyApp.store.find(MyApp.Foo, 'foo2');
    
    bar = MyApp.store.find(MyApp.Bar, 'bar1');
    bar2 = MyApp.store.find(MyApp.Bar, 'bar2');
    
    equals(rec.storeKey, storeKeys[0], 'should find record');
    
  }
});

// ..........................................................
// READING
// 

test("getting toOne relationship should map guid to a real record", function() {
  var rec2 = MyApp.store.find(MyApp.Foo, 'foo2');
  equals(rec2.get('id'), 'foo2', 'precond - should find record 2');
  equals(rec2.get('relatedTo'), rec, 'should get rec1 instance for rec2.relatedTo');
});

test("getting toOne relationship from computed attribute should map guid to a real record", function() {
  var rec3 = MyApp.store.find(MyApp.Foo, 'foo3');
  equals(rec3.get('id'), 'foo3', 'precond - should find record 3');
  equals(rec3.get('relatedToComputed'), bar, 'should get bar1 instance for rec3.relatedToComputed');
});

test("reading an inverse relationship", function() {
  equals(rec.get('bar'), bar, 'foo1.bar should == bar');
  equals(bar.get('foo'), rec, 'bar.foo should == foo1');  
});

// ..........................................................
// WRITING
// 

test("writing to a to-one relationship should update set guid", function() {
  var rec2 = MyApp.store.find(MyApp.Foo, 'foo2');
  equals(rec2.get('id'), 'foo2', 'precond - should find record 2');

  equals(rec2.get('relatedTo'), rec, 'precond - should get rec1 instance for rec2.relatedTo');

  rec2.set('relatedTo', rec2);

  equals(rec2.readAttribute('relatedTo'), 'foo2', 'should write ID for set record to relatedTo attribute');
  
  equals(rec2.get('relatedTo'), rec2, 'should get foo record that was just set');

});

test("writing to a to-one computed relationship should update set guid", function() {
  var rec3 = MyApp.store.find(MyApp.Foo, 'foo3');
  equals(rec3.get('id'), 'foo3', 'precond - should find record 2');
  equals(rec3.get('relatedToComputed'), bar, 'precond - should get bar1 instance for rec3.relatedToComputed');
  
  rec3.set('relatedToComputed', rec);
  equals(rec3.readAttribute('relatedToComputed'), 'foo1', 'should write ID for set record to relatedTo attribute');
});

test("clearing a toOne relationship", function() {
  ok(rec2.get('relatedTo') !== null, 'precond - rec.relatedTo should have a value');
  
  rec2.set('relatedTo', null);
  equals(rec2.get('relatedTo'), null, 'rec.relatedTo should be null');
  equals(rec2.readAttribute('relatedTo'), null, 'rec.relatedTo attribute should be null');
});

test("clearing a toOne relationship with an inverse", function() {
  equals(rec.get('bar'), bar, 'precond - foo1.bar should eq bar');
  equals(bar.get('foo'), rec, 'precond - bar.foo should eq foo1');
  
  rec.set('bar', null);
  
  equals(rec.get('bar'), null, 'foo1.bar should be null after change');
  equals(bar.get('foo'), null, 'bar.foo should also be null after change');
});

test("modifying a toOne relationship with an inverse from null", function() {
  equals(rec.get('bar'), bar, 'precond - foo1.bar should eq bar');
  equals(bar.get('foo'), rec, 'precond - bar.foo should eq foo1');
  equals(rec2.get('bar'), null, 'precond - foo2.bar should eq null');
  
  bar.set('foo', rec2);
  
  equals(rec.get('bar'), null, 'foo1.bar should be null after change');
  equals(bar.get('foo'), rec2, 'bar.foo should eq foo2 after change');
  equals(rec2.get('bar'), bar, 'foo2.bar should eq bar after change');
});

test("modifying a toOne relationship with an inverse from other", function() {
  
  var foo1 = rec, 
      foo3 = MyApp.store.find(MyApp.Foo, 'foo3'),
      bar1 = bar;
  
  equals(foo1.get('bar'), bar1, 'precond - foo1.bar should eq bar1');
  equals(bar1.get('foo'), foo1, 'precond - bar.foo should eq foo1');
  
  equals(foo3.get('bar'), bar2, 'precond - foo3.bar should eq null');
  equals(bar2.get('foo'), foo3, 'precond - bar2.foo should eq foo3');
  
  bar1.set('foo', foo3);
  
  equals(foo1.get('bar'), null, 'foo1.bar should be null after change');
  equals(bar1.get('foo'), foo3, 'bar.foo should eq foo3 after change');

  equals(foo3.get('bar'), bar1, 'foo3.bar should be bar after change');
  equals(bar2.get('foo'), null, 'bar2.foo should eq null after change');
});

