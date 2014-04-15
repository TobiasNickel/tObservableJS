/**
 * @fileOverview
 * @author Tobias Nickel
 * @version 0.04
 */

/**
 * @class
 * tobservable Class that handle the data
 * @param {mixed} pData the data to observe
 * @param {tobservable} pObserverTree the root observertree (used internally)
 * @param {String} pPath the path of the data that is the current observer is careing about
 */
 var tobservable=( function(){
	 function tobservable(pData, pObserverTree, pPath) {
		"use strict";
		if (!pData) 
			pData = undefined;
		if (!pObserverTree) 
			pObserverTree = new this.observerTree();
		if (!pPath) 
			pPath = '';

		var that = this;
		this.data = pData; // the ProgrammData
		this.observer = pObserverTree;
		this.path = pPath;
	}
	/**
	 * will return a tObservable, that observes the given path
	 * 
	 * @param {type} pPath 
	 *      identifies the path, that you want to have
	 * @returns {tobservable}
	 */
	tobservable.prototype.get = function(pPath) {
		var pathParts = (pPath + '').split('.');
		if (pathParts.length === 0)
			return this;
		else{
			var name = pathParts[0];
			if (pathParts.length === 1) {
				return new tobservable(
					this.data==undefined ? undefined : this.data[name],
					this.observer,
					this.addNameToPath(this.path, name)
				);
			} else {
				pathParts.splice(0, 1);
				return new tobservable(this.data[name], this.observer, this.addNameToPath(this.path, name), this.rootTobservable).get(mergeToPath(pathParts));
			}
		}
	};
	
	
	/**
	 * used to set a value on the data, it will notify the observer
	 * @param {String} pPath
	 *      identifing the data to update
	 * @param {Mixed} value
	 *      the new value of the described data
	 * @param {Boolean} run
	 *      
	 * @returns {void}
	 */
	tobservable.prototype.set = function(pPath, value, run) {
		var pathParts = (pPath + '').split('.');
		var name = pPath;
		if (pathParts.length === 0)
			return null;
		if (pathParts.length === 1) {
			if (run) {
				var out = this.data[name].apply(this.data, value);
				this.notify(name);
				return this;
			} else {
				this.data[name] = value;
				this.notify(name);
				return this;
			}
		} else {
			name = pathParts.pop();
			return this.get(mergeToPath(pathParts)).set(name, value, run);
		}
	};
	
	/**
	 * will apply a function described with the path,
	 * @param {String} pPath
	 *      describs the Data-Path
	 * @param {Array} value
	 *      the Parameterlist for the given function 
	 * @returns {void}
	 */
	tobservable.prototype.run = function(pPath, value) {
		this.set(pPath, value, true);
	};
	/**
	 * @private
	 * @param {String} path
	 *      data Path as known
	 * @param {type} name
	 *      the name to add
	 * @returns {String}
	 */
	tobservable.prototype.addNameToPath=function (path, name) {
		return path===''?name:path+'.'+name;
	}
	
	/**
	 * used to register a opserver on the described path
	 * (it is not calling the update merthod.)
	 * @param {Observer} tObserver
	 *      an object like: {name:"someName",update:function(){}}
	 * @param {type} pPath
	 *      describes the path wherer the observer should be registered
	 * @returns {void}
	 */
	tobservable.prototype.on = function(pPath,tObserver) {
		if(tObserver==undefined)return;
		tObserver=typeof tObserver == 'function' ? {update:tObserver}:tObserver
		this.observer.addListener(tObserver, pPath);
	};
	
	/**
	 * remove the described observer
	 * @param {type} path
	 *      tha data-path to the observer, where the last part is the name
	 * @returns {void}
	 */
	tobservable.prototype.off = function(path,tObserver) {
		this.observer.removeListener(path,tObserver);
	};

	/**
	 * used to tell all observer on the given path to update there view
	 * @param {type} path
	 * @returns {undefined}
	 */
	tobservable.prototype.notify = function(path,round) {
		if(round==undefined)round=new Date().getTime()+""+Math.random();
		this.observer.runUpdate(this.addNameToPath(this.path, path),round);
	};

	
	/**
	 * @class
	 * @private
	 * Only used by the tobservable to manage the observer
	 * @param {tobserbable} pObserver
	 * @param {String} pNextPath
	 * @returns {tobservable.observerTree}
	 */
	tobservable.prototype.observerTree=(function(){
		function observerTree(pObserver, pNextPath) {
			var that = this;
			this.$listener = [];
			
			//run initialisation of observertree
			if (typeof(pNextPath) === "undefined") 
				pNextPath = '';
			
			if (typeof(pObserver) !== "undefined")
				if (pNextPath === '') 
					this.$listener.push(pObserver);
				else 
					this.addListener(pObserver, pNextPath);
		}
		//to add a Listener to the tree
		observerTree.prototype.addListener = function(pListener, pPath) {
			var pathParts = pPath.split('.');
			pathParts = this.removeEmptyStrings(pathParts);
			if (pathParts.length > 0) {
				var prop = this.toProertyname(pathParts[0]);
				pathParts.shift();
				if (typeof(this[prop]) === "undefined")
					this[prop] = new observerTree(pListener, mergeToPath(pathParts));
				else 
					this[prop].addListener(pListener, mergeToPath(pathParts));
			} else
				this.$listener.push(pListener);
		};
		
		/**
		 * one of the magic functions. it is executing the updatefuntion of all 
		 * relevant listeners. so, all listener that are registered along the path,
		 * and all Listeners under the Path.
		 * @param {string} pPath
		 * @param {int} round, used, not to repeat updating the same observer. (optional)
		 * @returns {undefined}
		 */
		observerTree.prototype.runUpdate = function runUpdate(pPath,round) {
			if(round==undefined)round=new Date().getTime()+""+Math.random();
			if (typeof(pPath) === "undefined")
				pPath = '';
			//update the listener on the current node
			for (var ii in this.$listener)
				if(this.$listener[ii].tNotificationRoundNumber!=round){
					this.$listener[ii].tNotificationRoundNumber=round;
					this.$listener[ii].update(round);
				}
			//go through the path
			var pathParts = this.removeEmptyStrings(pPath.split('.'));
			if (pathParts.length > 0) {
				var PropName = this.toProertyname(pathParts[0]);
				if (typeof(this[PropName]) !== 'undefined') {
					pathParts.splice(0, 1);//TODO
					this[PropName].runUpdate( mergeToPath(pathParts),round);
				}
			}else
				for(var index in this) if(index.indexOf('_t_')===0)
					this[index].runUpdate("",round);
		};
		
		/**
		 * is removing the described Listener
		 * @param {type} pPath
		 *      the path to the lsitener, where the last part is the name
		 * @returns {void}
		 */
		observerTree.prototype.removeListener = function removeListener(pPath,tObserver) {
			if (typeof(pPath) === "undefined") 
				pPath = '';
			var pathParts = pPath.split('.');
			pathParts = this.removeEmptyStrings(pathParts);
			if (pathParts.length > 1||(tObserver!=undefined && pathParts.length > 0)) {
				var PropName = this.toProertyname(pathParts[0]);
				pathParts.shift();
				if (typeof(this[PropName]) !== 'undefined')
					this[PropName].removeListener( mergeToPath(pathParts),tObserver);
			} else 
				if (pathParts.length === 1 && this[pathParts[0]] != undefined) {
					for (var ii in this.$listener) 
						if (typeof this.$listener[ii].name === 'string' && this.$listener[ii].name === PropName) 
							this.$listener.splice(ii, 1);
				}else
					if(tObserver!=undefined)
						for (var ii=0;ii<this.$listener.length;ii++) 
							if (this.$listener[ii]===tObserver || this.$listener[ii].update === tObserver) 
								this.$listener.splice(ii, 1);
				
		};
		//remove all "" strings
		observerTree.prototype.removeEmptyStrings=function removeEmptyStrings(array) {
			while (array.indexOf('') !== -1) 
				array.splice(array.indexOf(''), 1);
			return array;
		}
		//remove all "" strings
		observerTree.prototype.removeEmptyStrings=function removeEmptyStrings(array) {
			while (array.indexOf('') !== -1) 
				array.splice(array.indexOf(''), 1);
			return array;
		}
		
		observerTree.prototype.toProertyname=function toProertyname(name) {
			return '_t_' + name;
		}
		return observerTree;
	})();

	/**
	 * the name of the HTML-class for the elements that are going to became updated by std views
	 * @type String
	 */
	tobservable.prototype.stdClassName="tObserver";
	
	/**
	 * get all HTML objects with the given klass, and makes a view with them.
	 * if also register observer ther on the DOM to create StdViews for the elements that are new Created
	 * @returns {undefined}
	 */
	tobservable.prototype.initDomViews=function(){
		// liveupdate in the dom
		window.bindEvent(document,'DOMNodeInserted',function(ev){
			var element=ev.srcElement;
			new tobserver.findTObserver(element);
		});
		//document.addEventListener('DOMNodeInserted',);
		window.bindEvent(document,'DOMNodeRemoved',function(ev){
			if(ev.srcElement!=undefined&& ev.srcElement.getAttribute!=undefined)
				setTimeout(function(){
					//var element=ev.srcElement;
					var attr=ev.srcElement.getAttribute("tObserver");
					if(attr!=undefined && ev.srcElement._tName!=undefined){
						var tPath=attr.path;
						tPath=tPath!=undefined?tPath:"";
						tobserver.off(tPath+"."+ev.srcElement._tName);
					}
				},1000)
		})
		this.findTObserver();
	};
	tobservable.prototype.findTObserver=function(element){
		if(element==undefined){ element=document.getElementsByTagName("html")[0];}
		var attr=element.getAttribute==undefined?undefined:element.getAttribute("tObserver");
		var kids = element.children;
		if(attr==null)
			for(var s in kids)
				tobserver.findTObserver(kids[s])
		else 
			new tobserver.StdElementView(element,this);
	}; 
	
	/**
	 * the stdView, that is used for document-nodes
	 * @param {dom-node} e
	 * @param {tobservable} tobserver
	 * @returns {tobservable.StdElementView}
	 */
	tobservable.prototype.StdElementView=function(){
		/**
		 *	Contstructor for a StdElementView
		 * 	it can be a simple view, or a htmlList-View. 
		 */
		function StdElementView(element,tobserver){
			//todo: parse the tobserver-attr as {JSON}
			var attr=element.getAttribute("tObserver")
			if(attr==null)return;
			if(element._tName!=undefined)return;
			attr=eval("({"+attr+"})");
			attr.path=attr.path != undefined ? attr.path : "";
			attr.outer=attr.outer != undefined ? attr.outer : "div";
			attr.path=attr.path[attr.path.length-1]=='.'?
				attr.path.slice(0,attr.path.length-1):attr.path;
			attr.path=attr.path==''?'window':attr.path;
			
			this.element=element;
			
			if(attr.type=="htmlList"||attr.type=="htmlOption"){
				attr.defaultValue=element.innerHTML;
				attr.preview=this.element.innerHTML;
				this.element.innerHTML="";
			}else{
				attr.defaultValue=element.getAttribute(attr.type);
			}
			attr.beforeAdd		=attr.beforeAdd!=undefined		?attr.beforeAdd		:tobserver.utils.stdViewBehavior.beforeAdd;
			attr.afterAdd		=attr.afterAdd!=undefined		?attr.afterAdd		:tobserver.utils.stdViewBehavior.afterAdd;
			attr.beforeRemove	=attr.beforeRemove!=undefined	?attr.beforeRemove	:tobserver.utils.stdViewBehavior.beforeRemove;
			attr.afterRemove	=attr.afterRemove!=undefined	?attr.afterRemove	:tobserver.utils.stdViewBehavior.afterRemove;
			attr.beforeUpdate	=attr.beforeUpdate!=undefined	?attr.beforeUpdate	:tobserver.utils.stdViewBehavior.beforeUpdate;
			attr.afterUpdate	=attr.afterUpdate!=undefined	?attr.afterUpdate	:tobserver.utils.stdViewBehavior.afterUpdate;
			
			var name="tObserverName"+Math.random()*10000000000000000;
			this.name=name;
			this.element._tName=name;
			this.element._tObserver=this;
			this.element.attr=attr;
			this.attr=attr;
			tobserver.on(attr.path,this);
			this.update();
		}
		/**
		 *	the standard updatemethod, called by the tObserver
		 */
		StdElementView.prototype.update=function(){
			var v=tobserver.get(this.attr.path).data;
			v= typeof v === "number"?v+"":v;
			var orgData=v;
			if(this.attr.filter!=undefined)
				v=this.attr.filter(v);
			v= v!==undefined?v:this.attr.defaultValue;
			switch(this.attr.type){
				case undefined:
					if(this.element.innerHTML!=v){
						this.element.innerHTML=v;
						this.attr.afterUpdate(this.element);
					}
				break;
				case 'htmlList':this.updateList(v,orgData); break;
				case 'htmlOption':this.updateOption(v,orgData); break;
				default: this.element.setAttribute(this.attr.type,v);
			}
		};
		StdElementView.prototype.updateOption=function updateList(data,orgData){
			if(data==false){
				this.element.innerHTML="";
				this.element.display="none";
			}else{
				this.element.display="";
				if(this.element.innerHTML==""){
					var newElement=document.createElement("div");
					newElement.innerHTML=this.attr.preview;
					this.findAndUpdatePath(newElement,this.attr.path);
					while( newElement.children[0]!=null)
						this.element.appendChild(newElement.children[0]);
				}
			}
		};
		
		/**
		 *	the speaciel bevavior of the htmlList-Views
		 */
		StdElementView.prototype.updateList=function updateList(data,orgData){
						
			var kids=this.element.children;
			var displayedData=[];
			var displayedElements=[];
			//remove deleted Elements and saving the position on the kids
			while(kids[0]!=undefined){
				var newPosition=data.indexOf(kids[0].item);
				if(newPosition==-1){
					kids[0].innerHTML=kids[0].innerHTML.replace("tobserver","removedtObserver").trim();
					this.attr.beforeRemove(kids[0],function(e){
						if(e!=undefined)e.remove();
					});
				}else{
					displayedData.push(kids[0].item);
					if(kids[0].tagName=="TOBSERVERLISTITEM"){
						if(newPosition!=kids[0].position){
							this.updateRootPath(kids[0],this.attr.path+"."+newPosition,this.attr.path+"."+kids[0].position);
						}
						kids[0].position=newPosition;
						displayedElements.push(kids[0]);
					}
				}
			}
			displayedElements.sort(function(a,b){return a.position-b.position});
			for(var i=0;i<displayedElements.length;i++){
				this.element.appendChild(displayedElements[i]);
			}
			
			//appendNewElements
			var listIndex=0;
			for(var i=0;i<data.length;i++){
				
				if(displayedElements[listIndex]!=undefined&&data[i]==displayedElements[listIndex].item)
					listIndex++;
				else{
					//create new insertBefore
					var orgIndex=orgData.indexOf(data[i]);
					var kid=document.createElement(this.attr.outer);
					kid.setAttribute("class","tobserverlistitem");
					
					kid.innerHTML=this.attr.preview;
					this.findAndUpdatePath(kid,this.attr.path+"."+orgIndex);
					kid.position=i;
					kid.item=data[i];
					if(displayedElements[listIndex]!=undefined)
						displayedElements[listIndex].parentNode.insertBefore(kid, displayedElements[listIndex] );
					else this.element.appendChild(kid);
					
					tobserver.findTObserver(kid);
					this.attr.beforeAdd(kid,data[i]);
					this.attr.afterAdd(kid,data[i]);
				}	
			}
			
			kids=this.element.children;
		};
		/**
		 *	if the Path for the a List-Item has changed, this function will update the childs
		 */
		StdElementView.prototype.findAndUpdatePath=function findAndUpdatePath(element,root){
			var attr=element.getAttribute==undefined?undefined:element.getAttribute("tObserver");
			var kids = element.children;
			if(attr==null)
				for(var s in kids)
					this.findAndUpdatePath(kids[s],root)
			else 
				this.setRoot(element,root);
			
		};
		/**
		 *	simulat to findAndUpdatePath, but findAndUpdatePath, only can be used for the initialisation of the object.
		 */
		StdElementView.prototype.updateRootPath=function updateRootPath(element,newRootPath,oldRootPath){
			if(element==undefined)return;
			if(newRootPath==undefined)return;
			if(oldRootPath==undefined)return;
			var kids=element.children;
			for(var i in kids){
				if(kids[i].attr!=undefined){
					var realOrgPath=kids[i].attr.path.replace(oldRootPath+'.','')
					if(kids[i].attr.type=='htmlList'){
						this.updateRootPath(kids[i],realOrgPath+"."+realOrgPath,oldRootPath+"."+realOrgPath)
					}
					tobserver.off(kids[i].attr.path+"."+kids[i]._tName);
					tobserver.on(newRootPath+'.'+realOrgPath,kids[i]._tObserver);
					kids[i].attr.path=newRootPath+'.'+realOrgPath;
				}else{
					this.updateRootPath(kids[i],newRootPath,oldRootPath)
				}
			}
		}
		/**
		 *	set the rootPath, for a new created List-View-Element
		 */
		StdElementView.prototype.setRoot=function setRoot(element,root){
			var attr=element.getAttribute("tObserver");
			attr=attr.replace("path:","path:'"+root+".'+");
			element.setAttribute("tObserver",attr);
		};
		return StdElementView;
	}()
	
	tobservable.prototype.utils={
		stdViewBehavior:function(){
			var emptyFunction=function(){},
				callSecoundF=function(e,f){f(e)};
			return{
				beforeAdd:emptyFunction,
				afterAdd:emptyFunction,
				beforeRemove:callSecoundF,
				afterRemove:emptyFunction,
				beforeUpdate:callSecoundF,
				afterUpdate:emptyFunction
			}
		}(),
		linkView:function(linkPath){
			this.update=function updateLinkView(round){
				tobserver.notify(linkPath,round);
			}
		}
	};
	
	return tobservable;
})();
/**
 * a helper function that checks if the nodeelement has a given class
 * @param {type} elem
 *      the dom-Element
 * @param {String} klass
 *      name of the class
 * @returns {Boolean}
 */
function hasClass( elem, klass ) {
     return (" " + elem.className + " " ).indexOf( " "+klass+" " ) > -1;
}


/**
 * merges a array of names to a path
 * @private
 * @param {Array} array
 *      an array containing strings with the names
 * @returns {String}
 */
var mergeToPath=function(array) {
	var out = '';
	for (var ii = 0; ii < array.length; ii++) 
		if (out === '') 
			out += array[ii];
		else 
			out += '.' + array[ii];
	return out;
}
var tobserver = new tobservable(window); ;
//window.addEventListener("load",function(){
//	tobserver.initDomViews();
//});
function bindEvent(el, eventName, eventHandler) {
  if (el.addEventListener){
    el.addEventListener(eventName, eventHandler, false); 
  } else if (el.attachEvent){
    el.attachEvent('on'+eventName, eventHandler);
  }
}
// ...
bindEvent(window, 'load', function(){
	var style=document.createElement("style");
	style.innerHTML=".tobserverlistitem{margin:0px;	padding:0px;}";
	document.getElementsByTagName("head")[0].appendChild(style);
	tobserver.initDomViews();
});