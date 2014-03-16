tobservablejs
=============
<p>
the TobservableJS is supporting the JS-coding with the MVC pattern. 
A "var tobserver" object is created. it will help you to manage the Views and notify them when the data has changed. Therefore it is nessasary to update all values in the data through tobserver.  
</p>
<p>
with an observer you can be notified when the data might change. Using the <b>tobserver.registerObserver( view, path );</b> mothod you will register the Observer. the Observer needs the following structure. The path is a string, discribing path from globalscope. Array-Indexes are also written in dot-notation.
</p>
```js
{
  name:'some_name', // used to remove the observer
  update:function(){ //your code. } called then the data get touched
}
```

<p>
The observer are used for the Views. They get notified with the Update-method, when the data changed or get touched.
but also the observer can send updates to the server.
</p>
<p>
and finally, when you change the data, you do it via the set or run Methods on the predefined tobserver-Object.<br> 

the set or run methods take as there first argument a string that contans the access as you would write it in source code.
If you have a Array in your data, just use '.index' to access (where index is the index number).<br>
- In <b>.set</b> the secound argument is the new value.<br>
- in <b>.run</b> the secound argument is an Array, that contains the arguments for the method discribed by the path.
</p>
<p>
the tobservableTest.html demonstrate how well the html is keeped in sync with the data.
</p>
<p>
In the latest version I added a feature called "pure HTML-views" simple add some attributes to a HTML element and it will be a basic observer.
</p>
<h3 background-color="red">
In this update I just make a huge announcement: the HTML-ViewSystem is rebuild and will support in near future recursive reproduction ! ! ! it will became owesome
</h3>
```HTML
<div class="TobserverView" tPath="nextWord.text">[next word]</div>
     a simple view, displaying the current value of data.nextWord.text.

<input class="TobserverView" tPath="nextWord.text" tprop="value" />
     a input element where the value need to be displayed in the "value"-attribute.

 <span class="TobserverView" tPath="some.time.in.ms" tfilter="function(b){return b/1000+' s';}"></span>
     a view that uses the Filter to display the value devided by 1000 and adding an s.
```
<p>
Feel free to read the source of the tobservable.js and the tobservableTest.html it is not that much.
</p>
