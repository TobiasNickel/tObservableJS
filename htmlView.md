# HTML Views
The tObservableJS framework, provides a smarter way, to write HTML-templates that will get compiled automaticly by using the data they belong too. When the data get updated through the tobserver, the views will also keeped up to date. I will describe the view-System on a simple example, with a Page, that is displaying a list of image-Galleries. The steps in this documentation are available as files under "/tutorial". For training we create an .html-file, write some put all our app-Data to a new object, within a script-tag in the head.
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
Then we add an aditional scrip-Tag to the head, loading the tobserver.js and we use the previously created script-Area, to initialise out app.
```JS
// step 2
// initialisation of the app-data in global scope
var app={title:"Imagegalleries"};
```
In the HTML-body we want to dispalay the a headline with the name.
```HTML
<!-- step 2 -->
<h1 tobserver="path:'app.title'"></h1>
```
The tObservableJS will now compile the HTML. The attribute 'tobserver' is marking an observer-Element. The attribute contains information in a JSON-like format, without the outher braces. "path" is a string discribing which data to display to at innerHTML of h1-element. Before we go deeper into the View-System and lets try out the System and update some data. Execute the following command at the Javascript console.
```JS
tobserver.set("app.title","My Favorite Gallerie");
```
As you see, you manipulated the data and the UI is in sync. Next we want to display the data as attibute of the element.
```HTML
<!-- step 3 -->
<input tobserver="path:'app.title',type:'value'" />
```
Next we want to use a filter, to manipulate the way, how the data get displayed. We try it, by showing the headline in capital letters. 
```HTML
<!-- step 4 -->
<h1 tobserver="path:'app.title',filter:function(org){return org.toUpperCase();}"></h1>
```
The filter-property have to be a method, that is returning the data to display to make it more flexible, it get the original data, but be careful not to manipulate them. 

In this step, we want to list up the names of galleries. So first we create our data, in this case we simple define them as we did before with the "app.title". 
```JS
// step 5
app.galleries=[
    {gName:"fh-stralsund"},
    {gName:"carweels"}
];
```
First we need a container that sais: "here should be displayed a list of information". Inside that container we write the description how to display one element. It is important to notice, that we are now inside of the container of the galleries as root. So we put an h2-Element to show the Name each gallery.
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
			{iName:"Korean",        iPath:"static/koreaner.jpg" },
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
				jQuery(element).animate({width:'300px'},{duration :500,easing:'linear'})
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

beforeAdd takes the element, before it is attached to the DOM. If you set an inital values or add event-listener there, you save to render one frame. before- and afterUpdate are simple for animation. beforeUpdate takes an callback, to say, when its animation is over. beforeRemove, gets an Element, that has a copy of the original content, otherwise they would update to a different element. After remove can be used to cache the HTML-Element, to reuse it later, the method is almost there, just to be complete.

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

The latest changes, let you set multiple path's as an array. multiple Types and filter. That makes it possible to change the content, its backroundcolor and the size of a single tobserver-element. It is clear, that the order in the "path"-Array need to match the order of the type and the filter array. an example will follow in near future.
