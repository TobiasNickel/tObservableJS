# tObservableJS

tObservableJS will make programming much more enjoyable. The Final version fitting to this Documentation, will be released during this week.

##The big plus points are:
  1. Learning even less vocabulary
  2. Keeping the whole flexibility of Javascript
  3. Getting the comfort as you might love in MVC-frameworks
  4. Writing less code to manipulate the DOM
  5. Use the same Framework for Client- and Serverside-Javascript
  6. Ready to use your favorit support framework. i.e.: jQuery, bootstrap, Underscore,...
  7. Recursive HTML-View-System, able to display any structured javascript-data.

## Description

### Model

You have a Model, it is The Window-Object as you know it, the global scope.
The motivation to devlelop tObservableJS, was to make all data observable to keep them everywhere in sync. 


| **the user-interface**  | **⇐⇒** | **the client-application**  | **⇐⇒**  |**database at the webserver**|
| :---------------------- |:-------:|:---------------------------:|:--------:| ---------------------------:|

### Controller - tobserver
To do so an MVC framework always need to know when the data get changed. Sadly there is to way in JS to register at any point in the data-objects. Thats the point where tObservableJS cames into the game. It defines the *tobserver**-object, it is the only Javascript object, you need to learn new, to use tObservableJS. 

tObservableJS new needs your help. If you manipilate some information in your data-Objects, you do it through the tobserver. To do so, it provides two Metods. So here is the complete methodlist of the tobserver-object, that you will need during the work.

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
Observer get notified when the data is updated through the tobserver. They are used as classic views, to update the UI. But they are also usefull to sync data with the Server.

Observer have a very simple structure. They are JS-Objects with a simple .update()-method. Optional they can have a name, the name can be used to remove the observer later from the object.

In that way, you manage by yourselve, what kind of observer you program. one for everything, seperate for UI and communication or use them to store and restore information to local storage. 
