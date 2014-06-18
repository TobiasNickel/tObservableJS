# tObservableJS

tObservableJS is not just two way binding, it is All-Way-Binding ! ! 

tObservableJS observes not the objects directly, but a path from the global scope. So if you push new data to the graph, the observer will keep untouched. They just update there views (like UI or representation on the servers DB). There is also an history module that can follow the URL and a route module to register operations based on a URL call. Not to forget the htmlView-system, that help you to keep presentation and logic separated. It only updates the changed elements asynchronously.

![alt logo](https://raw.githubusercontent.com/TobiasNickel/tObservableJS/master/logo.png "Logo")


### The big plus points are:
  1. Learning even less vocabulary
  2. Keeping the whole flexibility of Javascript
  3. Getting the comfort as you might love in MVC-frameworks
  4. 100% debug-friendly
  5. Writing less code to manipulate the DOM
  6. nodeJS available
  7. Ready to use your favorit support framework. i.e.: jQuery, bootstrap, Underscore,...
  8. Recursive HTML-View-System, able to display any structured javascript-data.
  9. let you focus your application, not just a frameworks-app

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

## Additional Stuff
With this thinks in your hand so far, you should be able to structure and build Web-Appliacations. The first Web-Apps, that have been using tObservableJS, only has used the basic tobserver and impletmenten all UI Views by itself.

### on Node
On node you can't need the HTML-Views so all the stuff is removed. using var tobserver = require('nodeTobserver.js'); you get the tobserver as it is on the browser. It has a Property .data, that is an empty object. It is the root-Object, but can be changed. 

### utils
Under tobserver.utils.* you will find some helpful stuf. Here is a list of the things, that are interesting to use for your Application. The behavior of tobservable.js is that it basicly only handles hierarchic data on the model. But if you want to store some data on multiple points in the tree and update the objects we also want to have the other modules updated. For that, there are 3 view-classes given:

* **new LinkView (path)** Creates a view, that is updating the given path. can be used for a single object that is stored on multiple points.
* **new LinkToArrayView(elementPath,arrayPath)** on updating the object, given by the elementPath, the Array under arrayPath will be updated, so that only the array only the element from the elementPath is updated, not every single element in the array.
* **LinkFromArrayView(elementPath,arrayPath)** updates the views for the ElementPath when there are changes in the Array, it also only updates the element, when the particular element on the array was manipulated. 

Usualy you will need to register two views to have bidirectional updates. To make that more comfortable there are two methods given in the utilis.
* ** linkViews(sourcePath,destPath)** creates two LinkViews for bidirectional updates.
* ** linkToArrayViews(elementPath,arrayPath)** creates a LinkToArrayView and a LinkFromArrayView for bidirectional updates, between an Object and an Array.

### history modul
There is taken a good part from Backbone and reworked it to support the work with TobservableJS. Under tobserver.utils.history the new modul. It has a start method to follow changes on the URL. So, write a link to your side, the page will not reload, but the tobservable-path givenoptions for the start will be updated by the tobserver. The default is just **"url"**, so register a view, to this path, and you can reload some parts of your page. The modul supports the functions of the browser to navigate back. Because the user now can share the new link on the address-line in the browser, you should make sure that your server can deliver the same content as your JS-View. 

This Modul was designed to create the behavior as you can find on http://usatoday.com/

### router modul
Now there is a Router under tobserver.utils.router. This router has an **on** method. It takes two prameter. The first is a string, discribing how the URL looks like and the second is the callback, getting the eventOpject, with params that are named on the url-description. for the format look at https://github.com/EngineeringMode/Grapnel.js
To let the Router follow the URL, simple start the history-module. 

### HTML Views
tObservableJS provide an htmlView-System, that rely on your data. https://github.com/TobiasNickel/tObservableJS/blob/master/htmlView.md

### Sockets / ServerSockets
You can set a socket to tobserber.notifyee.socket. The Socket will net an emit-Method, that will be called with two params (name and message). the name is will be a just a short string containing "tOmand". the second is the a command-object as JSON-string. This can be used to send all changes on the data to the server. This mechanism was developed to support the double tObservableServer (based on node with socket.io). but it can be used with a socket, that send all data via HTTP. Such a Socket is under tobserver.utils.JQUerySocket. this socket can be created with a file-path on the server. 

A Socket can be set using tobserver.utils.setSocket(socket) to register the socket and resieve messages from thes server.

##Thanks + Inspiration
This framework is developed by Tobias Nickel, a student at the university of applied science in Stralsund/Germany. During a internship at avandeo in Shanghai, a teammember told me to look at angular.js. While studying the documentation, I feld, that I would no longer write an Javascript-Application. I would write an Angular-Application. I thought, there is a lot of overhead to learn, to use it properly and not being cut with my creativity.


But I learned what is an MVC framework in Javascript. Then I also took a look at knockout and backbone. Both frameworks need also a long overhead to learn and need to fit the application into there framework. tObservable can be added to a project during the work, while having the wish to have the advantage of an MVC.

An additional thanks need to go to two sources where took some code from. Backbone, where the History-Modul is used from and Grapnel.js, witch is used as router, but stringly simplified. 

Thanks for looking at tObservableJS please leave a comment, for further development.

Tobias Nickel  ![alt text](https://avatars1.githubusercontent.com/u/4189801?s=150) 
