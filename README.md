tobservablejs
=============

the TobservableJS is supporting the coding in the MVC pattern. You just hand over your DataObject to a new tobservable. 
then you can add some observer to the module.
an observer should have this basic structure
```
{
  name:'some_name', // used to remove the observer
  update:function(){ //your code. } called then the data get touched
}
```
<p>
The observer are used for the Views. they get notified with the Update-method, when the data changed or get touched.
but also the observer can send an update to the server.
</p>
<p>
and finally, when you change the data, you do it via the set or run Methods.<br> 

the set or run methods take as there first argument a string that contans the access as you would write it in source code.
If you have a Array in your data, just use '.index' to access (where index is the index number).<br>
- In <b>.set</b> the secound argument is the new value.<br>
- in <b>.run</b> the secound argument is an Array, that contains the arguments for the method discribed by the path.
</p>
<p>
the tobservableTest.html demonstrate how well the html is keeped in sync with the data.
</p>
<p>
during the next time I wand to make it more comfortable to play around with some basic observers.
</p>
<p>
feel free to read the source of the tobservable.js and the tobservableTest.html it is not that much.
</p>
