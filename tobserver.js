/**
 * @fileOverview
 * @author Tobias Nickel
 * @bersion 0.03
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
			pData = {};
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
					this.data[name],
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
				return out;
			} else {
				this.data[name] = value;
				this.notify(name);
				return this;
			}
		} else {
			name = pathParts.pop();
			this.get(mergeToPath(pathParts)).set(name, value, run);
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
	 * remove the described observer
	 * @param {type} path
	 *      tha data-path to the observer, where the last part is the name
	 * @returns {void}
	 */
	tobservable.prototype.removeObserver = function(path) {
		this.observer.removeListener(path);
	};

	/**
	 * used to tell all observer on the given path to update there view
	 * @param {type} path
	 * @returns {undefined}
	 */
	tobservable.prototype.notify = function(path) {
		this.observer.runUpdate(this.addNameToPath(this.path, path));
	};
	
	/**
	 * used to register a opserver on the described path
	 * (it is not calling the update merthod.)
	 * @param {Observer} tObserver
	 *      an object like: {name:"someName",update:function(){}}
	 * @param {type} pPath
	 *      describes the path wherer the observer should be registered
	 * @returns {void}
	 */
	tobservable.prototype.registerObserver = function(tObserver, pPath) {
		this.observer.addListener(tObserver, pPath);
	};
	
	
	/**
	 * the name of the HTML-class for the elements that are going to became updated by std views
	 * @type String
	 */
	tobservable.prototype.stdClassName="TobserverView";
	
	/**
	 * get all HTML objects with the given klass, and makes a view with them.
	 * if also register observer ther on the DOM to create StdViews for the elements that are new Created
	 * @returns {undefined}
	 */
	tobservable.prototype.initDomViews=function(){
		var elements=document.getElementsByClassName(tobserver.stdClassName);
		for(var i=0; i < elements.length; i++)
			new this.stdElementView(elements[i],this);
		// liveupdate in the dom
		document.addEventListener('DOMNodeInserted',function(ev){
			var node=ev.srcElement;
			if(hasClass(node, tobserver.stdClassName) && typeof node._tName==="undefined" )
				new tobserver.stdElementView(node,tobserver);
		});
		document.addEventListener('DOMNodeRemoved',function(ev){
			var node=ev.srcElement;
			if(hasClass(node, this.stdClassName) && typeof node._tName!=="undefined"){
				//console.log(node,"removed");
				var tPath=node.getAttribute("tPath");
				tPath=tPath!==null?tPath:"";
				tobserver.removeObserver(tPath+"."+node._tName);
			}
		});			
	}; 
	/**
	 * the stdView, that is used for document-nodes
	 * @param {dom-node} e
	 * @param {tobservable} tobserver
	 * @returns {tobservable.stdElementView}
	 */
	tobservable.prototype.stdElementView=function (e,tobserver){
		var tProp=e.getAttribute("tprop");
		var tPath=e.getAttribute("tpath");
		tPath=tPath!==null?tPath:"";
		var tFilter=e.getAttribute("tfilter");
		var defaultValue="";
		if(tProp===null)
			defaultValue=e.innerHTML;
		else 
			defaultValue=e.getAttribute(tProp);
		var name="tObserverName"+Math.random()*10000000000000000;
		this.name=name;
		e._tName=name;
		this.update=function(){
			var v=tobserver.get(tPath).data;
			v= typeof v === "number"?v+"":v;
			v= typeof v==="string"?v:defaultValue;
			if(tFilter!==null)
				v=eval('('+tFilter+'('+v+'))');
			if(tProp===null)
				e.innerHTML=v;
			else
				e.setAttribute(tProp,v);
		};
		tobserver.registerObserver(this,tPath);
		this.update();
	}
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
		//***********
		// code here for observerTree
		//***********
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
		 * @param {type} pPath
		 * @returns {undefined}
		 */
		observerTree.prototype.runUpdate = function(pPath) {
			if (typeof(pPath) === "undefined")
				pPath = '';
			for (var ii in this.$listener) 
				this.$listener[ii].update();
			var pathParts = this.removeEmptyStrings(pPath.split('.'));
			if (pathParts.length > 0) {
				var PropName = this.toProertyname(pathParts[0]);
				if (typeof(this[PropName]) !== 'undefined') {
					pathParts.splice(0, 1);//TODO
					this[PropName].runUpdate( mergeToPath(pathParts));
				}
			}else
				for(var index in this) if(index.indexOf('_t_')===0)
					this[index].runUpdate("");
		};
		
		/**
		 * is removing the described Listener
		 * @param {type} pPath
		 *      the path to the lsitener, where the last part is the name
		 * @returns {void}
		 */
		observerTree.prototype.removeListener = function(pPath) {
			if (typeof(pPath) === "undefined") 
				pPath = '';
			var pathParts = pPath.split('.');
			pathParts = this.removeEmptyStrings(pathParts);
			if (pathParts.length > 1) {
				var PropName = this.toProertyname(pathParts[0]);
				pathParts.shift();
				if (typeof(this[PropName]) !== 'undefined')
					this[PropName].removeListener( mergeToPath(pathParts));
			} else 
				if (pathParts.length === 1 && typeof(this[pathParts[0]]) !== 'undefined') 
					for (var ii in this.$listener) 
						if (typeof this.$listener[ii].name === 'string' && this.$listener[ii].name === PropName) 
							this.$listener.splice(this.$listener[ii], 1);
		};
		//remove all "" strings
		observerTree.prototype.removeEmptyStrings=function(array) {
			while (array.indexOf('') !== -1) 
				array.splice(array.indexOf(''), 1);
			return array;
		}
		//remove all "" strings
		observerTree.prototype.removeEmptyStrings=function(array) {
			while (array.indexOf('') !== -1) 
				array.splice(array.indexOf(''), 1);
			return array;
		}
		
		observerTree.prototype.toProertyname=function(name) {
			return '_t_' + name;
		}
		return observerTree;
	})();

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
window.addEventListener("load",function(){
	tobserver.initDomViews();
});
