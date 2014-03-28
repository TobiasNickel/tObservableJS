# tObservableJS

tObservableJS will make programming much more enjoyable. 

###The big plus points are:
  1. Learning even less vocabulary
  2. Keeping the whole flexibility of Javascript
  3. Getting the comfort as you might love in MVC-frameworks
  4. 100% debug-friendly
  5. Writing less code to manipulate the DOM
  6. nodeJS available
  7. Ready to use your favorit support framework. i.e.: jQuery, bootstrap, Underscore,...
  8. Recursive HTML-View-System, able to display any structured javascript-data.

## Description

### Model

You have a Model, it is The Window-Object as you know it, the global scope.
The motivation to devlelop tObservableJS, was to make all data observable to keep them everywhere in sync. 

| **the user-interface**  | **⇐⇒** | **the client-application**  | **⇐⇒**  |**database at the webserver**|
| :---------------------- |:-------:|:---------------------------:|:--------:| ---------------------------:|

### Controller - tobserver
To do so an MVC framework always need to know when the data get changed. Sadly there is to way in JS to register at any point in the data-objects. Thats the point where tObservableJS cames into the game. It defines the **tobserver**-object. It is the only Javascript object, you need to learn new, to use tObservableJS. tObservableJS now needs your help. If you manipilate some information in your data-Objects, you do it through the tobserver. To do so, it provides some Metods. So here is the complete methodlist of the tobserver-object, that you will need during the work.

* **.set(** *string* **path,** *mixed* **value):** to update the information and notify all observer that belong to the given information
  * path: descripts is the data you want to set, beginning from the window-object, using dot-notation also for arrays.
  * value: any object that should be stored on the discribed position.
* **.run(** *string* **path,** *array* **parameter):** to aplly the method discribed, and notify the observer that belong to the data.
  * path:descripts the method to apply. in the same way as the path-Parameter in .set
  * parameter: is an Array, with the parameter of the function that is called, the parameter are in the same order as they would be written in a usual functioncall.
* **.notify(** *string* **path):** updates the views, should be seldem nessasary to use.
  * path: same path as before, you do not update the data.
* **.registerObserver(** *object with update-method* **observer,** *string* **path):**
  * observer: an observer, as discribed in the next passage
  * path: the path, where the observer wants to be notified.
* **.removeObserver(** *string* **path):**
  * path:path parameter is as known, where the last element is the name-property of the observer-object.

### Observer
Observer get notified when the data is updated through the tobserver. They are used as classic views, to update the UI. But they are also usefull to sync data with the Server. Observer have a very simple structure. They are JS-Objects with a simple .update()-method. Optional they can have a name, the name can be used to remove the observer later from the object.

```JS
// example observer
observer={
  name:'string',
  update:function(){}
}
// or 
observer= new function(){
  this.name='string';
  this.update=function(){};
}()
// or you can have a class that is prototyped with an update-method. 
// It is only important that you can call observer.update()
```
In that way, you manage by yourselve, what kind of observer you program. One for everything, seperate for UI and communication or use them to store, restore information to local storage or implementing your businesslogic. 

With this thinks in your hand, you should be able to structure your Web-Appliacation. The first Web-Apps, that have been using tObservableJS, only has used the basic tobserver and impletmenten all UI Views by itself.

### on Node
On node you can't need the HTML-Views so all the stuff is removed. using var tobserver = require('nodeTobserver.js'); you get the tobserver as it is on the browser. It has a Property .data, that is an empty object. It is the root-Object, but can be changed. 

### HTML Views
But tObservableJS framework, provides a smarter way, to write HTML-themplates that will get compiled automaticly by using the data they belong too. When the data get updated through the tobserver, the views will also keeped up to date. I will describe the view-System on a simple example, with a Page, that is displaying a list of image-Galleries. The steps from this documentation are available as files unter "/tutorial". We create an .html-file, write some put all our app-Data to a new object, within a script-tag in the head.
```HTML
<!-- step 1 -->
<!DOCTYPE html>
<html>
  <head>
    <script src="tobserver.js"></script>
    <script></scipt>
  </head>
  <body></body>
</html>
```
Then We add an aditional scrip-Tag to the head, loading the tobserver.js and we use the previously created script-Area, to initialise out app.
```JS
// step 2
//initialisation of the app-data in global scope
var app={title:"Imagegalleries"};
```
In the HTML-body we want to dispalay the a headline with the name.
```HTML
<!-- step 2 -->
<h1 tobserver="path:'app.title'"></h1>
```
The tObservableJS will now compile the HTML. The attribute 'tobserver' is marking an observer-Element. The attribute contains information in a JSON-like format, without the outher braces. Path is a string discribing witch data to display to at innerHTML of h1-element. Before we go deeper into the View-System and lets try out the System and update some data. Execute the following command at the Javascript console.
```JS
tobserver.set("app.title","My Favorite Gallerie");
```
As you see, you manipulated the data and the UI is in sync. Next we want to display the data as attibute of the element.
```HTML
<!-- step 3 -->
<input tobserver="path:'app.title',type:'value'" />
```
Next we want to use a filter, to manipulate the way, how the data get displayed. We try it, by showing the the headline in capital letters. 
```HTML
<!-- step 4 -->
<h1 tobserver="path:'app.title',filter:function(org){return org.toUpperCase();}"></h1>
```
The filter-property have to be a method, that is returning the data to display to make it more flexible, it get the original data, but be careful not to manipulate them. 

In this Step, we want to list up the names of galleries. So first we create our data, in this case we simple define them as we did before with the app.title. 
```JS
// step 5
app.galleries=[
    {gName:"fh-stralsund"},
    {gName:"carweels"}
];
```
First we need a container that sais, here should be displayed a list of information. Inside that container we write the description how to display one element. It is important to notice, that we have now inside of the container one of the galleries as root. So we put an h2-Element to show the Name each gallery.
```HTML
<!-- step 5 -->	
<div tObserver="path:'app.galleries',type:'htmlList'">
	<h2 tobserver="path:'gName'"></h2>
</div>
```
Because that was working so well, we repeat that and add some pictures to our galleries. First, each gellery get some images, via an Array:
```JS
// step 6
app.galleries=[
	{
		gName:"fh-stralsund",
			images:[
				{iName:"Library",       iPath:"static/Bibo.jpg"     },
				{iName:"Haus 5",        iPath:"static/haus5.jpg"    },
				{iName:"Mensa",         iPath:"static/mensa.jpg"    }
			]
		},
		{
		gName:"carweels",
		images:[
			{iName:"Korean",      iPath:"static/koreaner.jpg" },
			{iName:"Toyota",        iPath:"static/toyota.jpg"   },
			{iName:"Volvoreifen",   iPath:"static/Volvo.jpg"    },
			{iName:"Skoda",         iPath:"static/Skoda.jpg"    },
			{iName:"Kleinwagen",    iPath:"static/kleinwagen.jpg"},
			{iName:"VW eins",       iPath:"static/VW01.jpg"     }
		]
	}
];
```
To show all photos, we add a list-View into the list-View of step5, that displays the galleries add some css-classes and optional we load the style.css.
```HTML
<!-- step 6 -->	
<div tObserver="path:'app.galleries',type:'htmlList'" class="gallerieList">
	<div class="gallery">
		<h2 tobserver="path:'gName'"></h2>
		<div tObserver="path:'images',type:'htmlList'">
			<div class="image">
				<img tobserver="path:'iPath',type:'src'" />
				<p tobserver="path:'iName'"></p>
			</div>
		</div>
	</div>
</div>
```
In Step 7 we want to add some animation. Therefor we include jQuery and jQuery UI to the head, in this case, simple from the google-CDN.  
```HTML
<!-- step 7 -->	
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js"></script>
<link rel="stylesheet" href="//ajax.googleapis.com/ajax/libs/jqueryui/1.10.4/themes/smoothness/jquery-ui.css" />
<script src="//ajax.googleapis.com/ajax/libs/jqueryui/1.10.4/jquery-ui.min.js"></script>
```
In a List, allways when an element is added, updated or removed, you get the chance to react on that. But first we need some functionality to test this. Let us add some buttons with a few functions.
```JS
// step7
function addLibrary(){
	tobserver.run("app.galleries.0.images.push",[{iName:"Sporthalle",iPath:"static/Sporthalle.jpg"}]);
}
function sortWeels(){
	tobserver.run("app.galleries.1.images.sort",[function(a,b){if(a.iName<b.iName)return -1; else return 1;}]);
}
```
```HTML
<!-- step 7 - in body-->	
<input type="button" value="add Sportshall" onclick="addLibrary()">
<input type="button" value="sort weels" onclick="sortWeels()">
```
Now I want to introduce 6 events, with them it is possible to edit the elements when they get added, updated or removed and you have allways a method the chance to manipulate it before and after the event. so the 6 events are:
```JS
// step7
	beforeAdd:	function(element){} 
	afterAdd:	function(element){}
	beforeRemove:	function(element,complete){}
	afterRemove:	function(element){}
	beforeUpdate:	function(element,complete){complete()}
	afterUpdate:	function(element){}
	// the element is allways the node-in the DOM
	// and complete is always a method, so that the framework knows when it is going on.
```
The methods get registered at in the HTML in the tobserver-attribute. To test it, let us make an animation, when a new picture is added to a gallery.
```HTML
<!-- step 7 -->	
<div tObserver="path:'app.galleries',type:'htmlList'" class="gallerieList">
	<div class="gallery">
		<h2 tobserver="path:'gName'"></h2>
		<div tObserver="path:'images',type:'htmlList',afterAdd:function(element){
				element.style.width='0px';
				$element=jQuery(element); 
				$element.animate({width:'300px'},{duration :500,easing:'linear'})
			}">
			<div class="image">
				<img tobserver="path:'iPath',type:'src'" />
				<p tobserver="path:'iName'"></p>
			</div>
		</div>
	</div>
</div>
```
As you see, we simple added a JavaScript-function to the afterAdd propertie. You could also write a function and hand it over by its name. In fact, the tobserver-attribute is interpreted with the standard JS function eval(). 

beforeAdd takes the element, before it is attached to the DOM. If you set an inital values or add event-listener there, you save to renter one frame. before- and afterUpdate are simple for animation. beforeUpdate takes an callback, to say, when its animation is over. beforeRemove, gets an Element, that has a copy of the original content, otherwise they would update to a different element. After remove can be used to cache the HTML-Element, to reuse it later.

Step 8 introduces a feature, for optional displaying. The html-View-type "**htmlOption**" uses the filter to decide if the result should get displayed or not. the filter-method will have to return true or false. The element cares about the childs Path. So, if you set a path the child elements will be restricted to that data. For a demonstration, we want do display a mixed list of galleries and posts. Therefore we extend our data with a type and add an element with the post.
```JS
// step 8
app.galleries=[
	{	type:"gallery",
		gName:"fh-stralsund",
		images:[
			{iName:"Library",    iPath:"static/Bibo.jpg"     },
			{iName:"Haus 5",        iPath:"static/haus5.jpg"    },
			{iName:"Mensa",         iPath:"static/mensa.jpg"    }
		]
	},
	{	type:"post",
		headline:"lorem ipsum",
		text:"Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet."
	},
	{	type:'gallery',
		gName:"carweels",
		images:[
			{iName:"Korean",      iPath:"static/koreaner.jpg" },
			{iName:"Toyota",        iPath:"static/toyota.jpg"   },
			{iName:"Volvoreifen",   iPath:"static/Volvo.jpg"    },
			{iName:"Skoda",         iPath:"static/Skoda.jpg"    },
			{iName:"Kleinwagen",    iPath:"static/kleinwagen.jpg"},
			{iName:"VW eins",       iPath:"static/VW01.jpg"     }
		]
	}
];
```
The ListView will now look like that:
```HTML
<!-- step 8 -->
<div tObserver="path:'app.galleries',type:'htmlList'" class="gallerieList">
	<div tobserver="path:'',type:'htmlOption',filter:function(v){return (v.type=='gallery');}">
		<div class="gallery">
			<h2 tobserver="path:'gName'"></h2>
			<div tObserver="path:'images',type:'htmlList',afterAdd:function(element){
				element.style.width='0px';
				$element=jQuery(element); 
				$element.animate({width:'300px'},{duration :500,easing:'linear'});
			}">
				<div class="image">
					<img tobserver="path:'iPath',type:'src'" />
					<p tobserver="path:'iName'"></p>
				</div>
			</div>
		</div>
	</div>
	<div tobserver="path:'',type:'htmlOption',filter:function(v){return (v.type=='post');}">
		<div class="gallery">
			<h2 tobserver="path:'headline'"></h2>
			<p tobserver="path:'text'"></p>
		</div>
	</div>
</div>
```
In the the outher list, now contains two htmlOption elements, which only get displayed if the type of the element is right. As you see, the filterMethod simple test the type-property. In more complex scenarios, it will be useful to analyse the element via *instanceof*. 
##Thanks + Inspiration
This framework is developed by Tobias Nickel, a student at the university of applied science in Stralsund/Germany. During a internship at avandeo in Shanghai, a teammember told me to look at angular.js. While studying the documentation, I feld, that I do would not write an Javascript-Application, I would write a Angular-application. I thought, there is a lot of overhead to learn to use it properly and not being cut at my creativity. 

But I learned what is an MVC framework in Javascript. Then I also took a look at knockout and backbone. Both frameworks need also a long overhead to learn and need to fit the application into there framework. tObservable can be added to a project during the work, while having the wish to have the advantage of an MVC.

Thanks for looking at tObservableJS please leave a comment, for further development.
