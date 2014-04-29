/**
 * @fileOverview
 * @author Tobias Nickel
 * @version 0.3
 */

/**
 * @class
 * tobservable Class that handle the data
 * @param {mixed} pData the data to observe
 * @param {tobservable} pObserverTree the root observertree (used internally)
 * @param {String} pPath the path of the data that is the current observer is careing about
 */
 var tobserver=( function(window,document,undefined){
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
				this.notify();
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
			var pathParts = this.removeEmptyStrings(pPath.split('.'));
			//update the listener on the current node
			for (var ii in this.$listener)
				if(this.$listener[ii].tNotificationRoundNumber!=round){
					this.$listener[ii].tNotificationRoundNumber=round;
					this.$listener[ii].update(round,pathParts);
				}
			//go through the path
			
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
		tobserver.utils.bindEvent(document,'DOMNodeInserted',function(ev){
			var element=ev.srcElement;
			tobserver.findTObserver(element);
		});
		//document.addEventListener('DOMNodeInserted',);
		tobserver.utils.bindEvent(document,'DOMNodeRemoved',function(ev){
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
				case 'value':
					if(this.element.value=v)
						return;
					this.element.value=v;
				default: 
					if(this.element.getAttribute(this.attr.type)==v)
						return;
					this.element.setAttribute(this.attr.type,v);
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
					while( newElement.children[0]!=null){
						this.attr.beforeAdd(newElement.children[0],orgData);
						this.element.appendChild(newElement.children[0]);
						this.attr.afterAdd(newElement.children[0],orgData);
					}
				}
			}
		};
		
		/**
		 *	the speaciel bevavior of the htmlList-Views
		 */
		StdElementView.prototype.updateList=function updateList(data,orgData){
			if(this.displayedOrdData!=orgData)
				this.element.innerHTML="";
			this.displayedOrdData=orgData;
			var kids=this.element.children;
			var displayedData=[];
			var displayedElements=[];
			//remove deleted Elements and saving the position on the kids
			for(var i =0;i<kids.length;i++){
				var newPosition=data.indexOf(kids[i].item);
				if(newPosition==-1){
					kids[i].innerHTML=kids[i].innerHTML.replace("tobserver","removedtObserver").trim();
					this.attr.beforeRemove(kids[i],function(e){
						if(e!=undefined){
							e.remove();
							i--;
						}
					});
				}else{
					this.attr.beforeUpdate(kids[i],function(){});
					displayedData.push(kids[i].item);
					if(kids[i].className=="tobserverlistitem"){
						if(newPosition!=kids[i].position){
							this.updateRootPath(kids[i],this.attr.path+"."+newPosition,this.attr.path+"."+kids[i].position);
						}
						kids[i].position=newPosition;
						displayedElements.push(kids[i]);
					}
				}
			}
			displayedElements.sort(function(a,b){return a.position-b.position});
			for(var i=0;i<displayedElements.length;i++){
				this.element.appendChild(displayedElements[i]);
			}
			
			//appendNewElements
			var listIndex=0;
			if(orgData==undefined)return;
			for(var i=0;i<data.length;i++){
				
				if(displayedElements[listIndex]!=undefined&&data[i]==displayedElements[listIndex].item)
					listIndex++;
				else{
					if(displayedData.indexOf(data[i])==-1){
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
			}
			
			kids=this.element.children;
		};
		/**
		 *	if the Path for the a List-Item has changed, this function will update the childs
		 */
		StdElementView.prototype.findAndUpdatePath=function findAndUpdatePath(element,root){
			var attr=element.getAttribute==undefined?undefined:element.getAttribute("tObserver");
			var kids = element.children;
			if(attr==undefined)
				for(var s in kids)
					this.findAndUpdatePath(kids[s],root)
			else 
				this.setRoot(element,root);
			
		};
		/**
		 *	set the rootPath, for a new created List-View-Element
		 */
		StdElementView.prototype.setRoot=function setRoot(element,root){
			var attr=element.getAttribute("tObserver");
			var inputString="path:'"+root+".'+";
			if(attr.indexOf(inputString)==-1)
				attr=attr.replace("path:",inputString);
			element.setAttribute("tObserver",attr);
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
		return StdElementView;
	}();
	
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
		linkViews:function(sourcePath,destPath){
			tobserver.on(sourcePath	,new this.LinkView(destPath));
			tobserver.on(destPath	,new this.LinkView(sourcePath));
			
		},
		linkToArrayViews:function(elementPath,arrayPath){
			tobserver.on(elementPath,new this.LinkToArrayView(elementPath,arrayPath));
			tobserver.on(arrayPath,new this.LinkFromArrayView(elementPath,arrayPath));
		},
		LinkView:function LinkView(destPath){
			this.update=function updateLinkView(round){
				tobserver.notify(destPath,round);
			}
		},
		LinkToArrayView:function LinkToArrayView(elementPath,arrayPath){
			this.update=function updateLinkView(round){
				var sourceData=tobserver.get(elementPath).data;
				var array=tobserver.get(arrayPath).data;
				tobserver.notify(arrayPath+"."+array.indexOf(sourceData ),round);
			}
		},
		LinkFromArrayView:function LinkFromArrayView(elementPath,arrayPath){
			this.update=function updateLinkView(round,pathParts){
				var sourceData=tobserver.get(elementPath).data;
				var array=tobserver.get(arrayPath).data;
				if(pathParts[0]!=undefined){
					if(array[pathParts[0]]!==sourceData){
						tobserver.notify(elementPath,round);
					}
				}else tobserver.notify(elementPath,round);
			}
		},
		history:function(){
			//NEEDED PARTS OF UNDERSCORE
			var _ = {};
			var	slice = Array.prototype.slice,
				hasOwnProperty = Object.prototype.hasOwnProperty;

			// All **ECMAScript 5** native function implementations that we hope to use
			// are declared here.
			var	nativeSome = Array.prototype.some,
				nativeForEach = Array.prototype.forEach,
				nativeBind = Function.prototype.bind;

			// Create a function bound to a given object (assigning `this`, and arguments,
			// optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
			// available.
			_.bind = function (func, context) {
				var args, bound;
				if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
				if (!_.isFunction(func)) throw new TypeError;
				args = slice.call(arguments, 2);
				return bound = function () {
					if (!(this instanceof bound)) 
						return func.apply(context, args.concat(slice.call(arguments)));
					ctor.prototype = func.prototype;
					var self = new ctor;
					ctor.prototype = null;
					var result = func.apply(self, args.concat(slice.call(arguments)));
					if (Object(result) === result) return result;
					return self;
				};
			};
			// Bind a number of an object's methods to that object. Remaining arguments
			// are the method names to be bound. Useful for ensuring that all callbacks
			// defined on an object belong to it.
			_.bindAll = function (obj) {
				var funcs = slice.call(arguments, 1);
				if (funcs.length === 0) throw new Error('bindAll must be passed function names');
				each(funcs, function (f) {
					obj[f] = _.bind(obj[f], obj);
				});
				return obj;
			};
			// The cornerstone, an `each` implementation, aka `forEach`.
			// Handles objects with the built-in `forEach`, arrays, and raw objects.
			// Delegates to **ECMAScript 5**'s native `forEach` if available.
			var each = _.each = _.forEach = function (obj, iterator, context) {
				if (obj == null) return obj;
				if (nativeForEach && obj.forEach === nativeForEach) {
					obj.forEach(iterator, context);
				} else if (obj.length === +obj.length) {
					for (var i = 0, length = obj.length; i < length; i++) {
						if (iterator.call(context, obj[i], i, obj) === breaker) return;
					}
				} else {
					var keys = _.keys(obj);
					for (var i = 0, length = keys.length; i < length; i++) {
						if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
					}
				}
				return obj;
			};

			// Determine if at least one element in the object matches a truth test.
			// Delegates to **ECMAScript 5**'s native `some` if available.
			// Aliased as `any`.
			var any = _.some = _.any = function (obj, predicate, context) {
				predicate || (predicate = _.identity);
				var result = false;
				if (obj == null) return result;
				if (nativeSome && obj.some === nativeSome) return obj.some(predicate, context);
				each(obj, function (value, index, list) {
					if (result || (result = predicate.call(context, value, index, list))) return breaker;
				});
				return !!result;
			};
			//UNDERSCORE ENDE

			// Backbone.History
			// ----------------

			// Handles cross-browser history management, based on either
			// [pushState](http://diveintohtml5.info/history.html) and real URLs, or
			// [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
			// and URL fragments. If the browser supports neither (old IE, natch),
			// falls back to polling.
			var History = function () {
				//this.handlers = [];
				_.bindAll(this, 'checkUrl');

				// Ensure that `History` can be used outside of the browser.
				if (typeof window !== 'undefined') {
					this.location = window.location;
					this.history = window.history;
				}
			};

			// Cached regex for stripping a leading hash/slash and trailing space.
			var routeStripper = /^[#\/]|\s+$/g;
			// Cached regex for stripping leading and trailing slashes.
			var rootStripper = /^\/+|\/+$/g;
			// Cached regex for detecting MSIE.
			var isExplorer = /msie [\w.]+/;
			// Cached regex for removing a trailing slash.
			var trailingSlash = /\/$/;
			// Cached regex for stripping urls of hash.
			var pathStripper = /#.*$/;

			// Has the history handling already been started?
			History.started = false;

			// Set up all inheritable **Backbone.History** properties and methods.
			//History.prototype

			// The default interval to poll for hash changes, if necessary, is
			// twenty times a second.
			History.prototype.interval = 50;

			// Are we at the app root?
			History.prototype.atRoot = function () {
				return this.location.pathname.replace(/[^\/]$/, '$&/') === this.root;
			};

			// Gets the true hash value. Cannot use location.hash directly due to bug
			// in Firefox where location.hash will always be decoded.
			History.prototype.getHash = function (window) {
				var match = (window || this).location.href.match(/#(.*)$/);
				return match ? match[1] : '';
			};

			// Get the cross-browser normalized URL fragment, either from the URL,
			// the hash, or the override.
			History.prototype.getFragment = function (fragment, forcePushState) {
				if (fragment == null) {
					if (this._hasPushState || !this._wantsHashChange || forcePushState) {
						fragment = decodeURI(this.location.pathname + this.location.search);
						var root = this.root.replace(trailingSlash, '');
						if (!fragment.indexOf(root)) fragment = fragment.slice(root.length);
					} else {
						fragment = this.getHash();
					}
				}
				return fragment.replace(routeStripper, '');
			};

			// Start the hash change handling, returning `true` if the current URL matches
			// an existing route, and `false` otherwise.
			History.prototype.start = function (options) {
				if (History.started) throw new Error("history has already been started");
				History.started = true;

				// Figure out the initial configuration. Do we need an iframe?
				// Is pushState desired ... is it available?
				this.options = options == undefined ? {} : options;
				this.options.root = "/";

				this.path = this.options.path == undefined ? "url" : path;
				// _.extend({root: '/'}, this.options, options);
				this.root = this.options.root;
				this._wantsHashChange = this.options.hashChange !== false;
				this._wantsPushState = !! this.options.pushState;
				this._hasPushState = !! (this.options.pushState && this.history && this.history.pushState);
				var fragment = this.getFragment();
				var docMode = document.documentMode;
				var oldIE = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));

				// Normalize root to always include a leading and trailing slash.
				this.root = ('/' + this.root + '/').replace(rootStripper, '/');

				if (oldIE && this._wantsHashChange) {
					var frame = $('<iframe src="javascript:0" tabindex="-1">');
					this.iframe = frame.hide().appendTo('body')[0].contentWindow;
					this.navigate(fragment);
				}

				// Depending on whether we're using pushState or hashes, and whether
				// 'onhashchange' is supported, determine how we check the URL state.
				if (this._hasPushState) {
					$(window).on('popstate', this.checkUrl);
				} else if (this._wantsHashChange && ('onhashchange' in window) && !oldIE) {
					$(window).on('hashchange', this.checkUrl);
				} else if (this._wantsHashChange) {
					this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
				}

				// Determine if we need to change the base url, for a pushState link
				// opened by a non-pushState browser.
				this.fragment = fragment;
				var loc = this.location;

				// Transition from hashChange to pushState or vice versa if both are
				// requested.
				if (this._wantsHashChange && this._wantsPushState) {

					// If we've started off with a route from a `pushState`-enabled
					// browser, but we're currently in a browser that doesn't support it...
					if (!this._hasPushState && !this.atRoot()) {
						this.fragment = this.getFragment(null, true);
						this.location.replace(this.root + '#' + this.fragment);
						// Return immediately as browser will do redirect to new url
						return true;

						// Or if we've started out with a hash-based route, but we're currently
						// in a browser where it could be `pushState`-based instead...
					} else if (this._hasPushState && this.atRoot() && loc.hash) {
						this.fragment = this.getHash().replace(routeStripper, '');
						this.history.replaceState({}, document.title, this.root + this.fragment);
					}

				}
				// my extension to the startMethod to update the Links, 
				// and let them not navigate, 
				// but update the the history
				$(document).on("click", "a[href^='/']", function(event){
					var href = $(event.currentTarget).attr('href')

					//# chain 'or's for other black list routes
					passThrough = href.indexOf('sign_out') >= 0
					//# Allow shift+click for new tabs, etc.
					if(!passThrough && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey){
							event.preventDefault()
							//# Remove leading slashes and hash bangs (backward compatablility)
							url = href.replace(/^\//,'').replace('\#\!\/','')
							//# Instruct Backbone to trigger routing events
							 tobserver.utils.history.navigate(url, { trigger: true });
							return false;
						}
					}
				);
				
				if (!this.options.silent) return this.loadUrl();
			}

			// Disable Backbone.history, perhaps temporarily. Not useful in a real app,
			// but possibly useful for unit testing Routers.
			History.prototype.stop = function () {
				$(window).off('popstate', this.checkUrl).off('hashchange', this.checkUrl);
				if (this._checkUrlInterval) clearInterval(this._checkUrlInterval);
				History.started = false;
			};

			// Add a route to be tested when the fragment changes. Routes added later
			// may override previous routes.
			History.prototype.route = function (route, callback) {
				this.handlers.unshift({
					route: route,
					callback: callback
				});
			};

			// Checks the current URL to see if it has changed, and if it has,
			// calls `loadUrl`, normalizing across the hidden iframe.
			History.prototype.checkUrl = function (e) {
				var current = this.getFragment();
				if (current === this.fragment && this.iframe) {
					current = this.getFragment(this.getHash(this.iframe));
				}
				if (current === this.fragment) return false;
				this.navigate(current);
				if (this.iframe) this.navigate(current);
				this.loadUrl();
			};

			// Attempt to load the current URL fragment. If a route succeeds with a
			// match, returns `true`. If no defined routes matches the fragment,
			// returns `false`.
			History.prototype.loadUrl = function (fragment) {
				fragment = this.fragment = this.getFragment(fragment);
				tobserver.set(this.path, fragment);
			};
			
			// Save a fragment into the hash history, or replace the URL state if the
			// 'replace' option is passed. You are responsible for properly URL-encoding
			// the fragment in advance.
			//
			// The options object can contain `trigger: true` if you wish to have the
			// route callback be fired (not usually desirable), or `replace: true`, if
			// you wish to modify the current URL without adding an entry to the history.
			History.prototype.navigate = function (fragment, options) {
				if (!History.started) return false;
				if (!options || options === true) options = {trigger: !! options};

				var url = this.root + (fragment = this.getFragment(fragment || ''));
				// Strip the hash for matching.
				fragment = fragment.replace(pathStripper, '');
				if (this.fragment === fragment) return;
				this.fragment = fragment;
				// Don't include a trailing slash on the root.
				if (fragment === '' && url !== '/') url = url.slice(0, -1);
				// If pushState is available, we use it to set the fragment as a real URL.
				if (this._hasPushState) {
					this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);
					// If hash changes haven't been explicitly disabled, update the hash
					// fragment to store history.
				} else if (this._wantsHashChange) {
					this._updateHash(this.location, fragment, options.replace);
					if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
						// Opening and closing the iframe tricks IE7 and earlier to push a
						// history entry on hash-tag change.  When replace is true, we don't
						// want this.
						if (!options.replace) this.iframe.document.open().close();
						this._updateHash(this.iframe.location, fragment, options.replace);
					}
					// If you've told us that you explicitly don't want fallback hashchange-
					// based history, then `navigate` becomes a page refresh.
				}else
					return this.location.assign(url);
				if (options.trigger) return this.loadUrl(fragment);
			};

			// Update the hash location, either replacing the current entry, or adding
			// a new one to the browser history.
			History.prototype._updateHash = function (location, fragment, replace) {
				if (replace) {
					var href = location.href.replace(/(javascript:|#).*$/, '');
					location.replace(href + '#' + fragment);
				} else {
					// Some browsers require that `hash` contains a leading #.
					location.hash = '#' + fragment;
				}
			}
		// Create the default Backbone.history.
			return new History();
		}(),
		bindEvent:function bindEvent(el, eventName, eventHandler) {
			if (el.addEventListener)
				el.addEventListener(eventName, eventHandler, false); 
			else if (el.attachEvent)
				el.attachEvent('on'+eventName, eventHandler);
		}
	};
	
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

	return new tobservable(window);
})(window,document);

tobserver.utils.bindEvent(window, 'load', function(){
	var style=document.createElement("style");
	style.innerHTML=".tobserverlistitem{margin:0px;	padding:0px;}";
	document.getElementsByTagName("head")[0].appendChild(style);
	tobserver.initDomViews();
});