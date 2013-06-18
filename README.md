tobservablejs
=============

the TobservableJS is supporting the coding in the MVC pattern. You just hand over your DataObject to a new tobservable. 
then you can add some observer to the module.
an observer should have this basic structure
{
  name:'some_name',
  update:function(){//your code.}
}

The observer are used for the Views. they get notified with the Update-method, when the data changed or get touched.
but also the observer can send an update to the server.

and finaly, when you change the data, you do it via the set or run Methods. 

the set or run methods take as there first argument a string that contans the access as you would write it in source code.
If you have a Array in your data, just use '.index' to access (where index is the index number).
In .set the secound argument is the new value.
in .run the secound argument is an Array, that contains the arguments for the method discribed by the path.

the tobservableTest.html demonstrate how well the html is keeped in sync with the data.

during the next time I wand to make it more comfortable to play around with some basic observers.
