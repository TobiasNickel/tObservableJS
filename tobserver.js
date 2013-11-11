function tobservable(pData, pObserverTree, pPath) {
	"use strict";
	if (!pData) 
		pData = {};
	if (!pObserverTree) 
		pObserverTree = new observerTree();
	if (!pPath) 
		pPath = '';

	var that = this;
	this.data = pData; // the ProgrammData
	this.observer = pObserverTree;
	this.path = pPath;

	this.get = function(pPath) {
		var pathParts = (pPath + '').split('.');
		if (pathParts.length === 0)
			return this;
		else{
			var name = pathParts[0];
			if (pathParts.length === 1) {
				return new tobservable(
					that.data[name],
					that.observer,
					addNameToPath(that.path, name)
				);
			} else {
				pathParts.splice(0, 1);
				return new tobservable(that.data[name], that.observer, addNameToPath(that.path, name), that.rootTobservable).get(mergeToPath(pathParts));
			}
		}
	};
	this.set = function(pPath, value, run) {
		var pathParts = (pPath + '').split('.');
		var name = pPath;
		if (pathParts.length === 0)
			return null;
		if (pathParts.length === 1) {
			if (run) {
				var out = that.data[name].apply(that.data, value);
				that.notify(name);
				return out;
			} else {
				that.data[name] = value;
				that.notify(name);
				return this;
			}
		} else {
			name = pathParts.pop();
			that.get(mergeToPath(pathParts)).set(name, value, run);
		}
	};
	this.run = function(pPath, value) {
		that.set(pPath, value, true);
	};
	this.registerObserver = function(tObserver, pPath) {
		that.observer.addListener(tObserver, pPath);
	};
	//remove the listener on the given path, where the last value is the name property of the observable, 
	//if it is not existing, it nothing will get removed.
	this.removeObserver = function(path) {
		that.observer.removeListener(that.observer, path);
	};

	this.notify = function(path) {
		that.observer.runUpdate(addNameToPath(that.path, path));
	};
 
	function addNameToPath(path, name) {
		return path===''?name:path+'.'+name;
	}

	// merges a array of names to a path
	function mergeToPath(array) {
		var out = '';
		for (var ii = 0; ii < array.length; ii++) 
			if (out === '') 
				out += array[ii];
			else 
				out += '.' + array[ii];
		return out;
	}
	//---------------------------------------
	// subclass observerTree
	//---------------------------------------
	function observerTree(pObserver, pNextPath) {
		var that = this;
		this.$listener = [];
		//to add a Listener to the tree
		this.addListener = function(pListener, pPath) {
			var pathParts = pPath.split('.');
			pathParts = removeEmptyStrings(pathParts);
			if (pathParts.length > 0) {
				var prop = toProertyname(pathParts[0]);
				pathParts.shift();
				if (typeof(that[prop]) === "undefined")
					that[prop] = new observerTree(pListener, mergeToPath(pathParts));
				else 
					that[prop].addListener(pListener, mergeToPath(pathParts));
			} else
				that.$listener.push(pListener);
		};
		// remove the Listener, that 
		this.removeListener = function(pListener, pPath) {
			if (typeof(pPath) === "undefined") {
				pPath = '';
			}
			var pathParts = pPath.split('.');
			pathParts = removeEmptyStrings(pathParts);
			if (pathParts.length > 1) {
				var PropName = toProertyname(pathParts[0]);
				pathParts.shift();
				if (typeof(that[PropName]) !== 'undefined')
					that[PropName].runUpdate( mergeToPath(pathParts));
			} else 
				if (pathParts.length === 1) 
					if (typeof(that[pathParts[0]]) !== 'undefined') 
						for (var ii in that.$listener) 
							if (typeof that.$listener[ii].name === 'string' && that.$listener[ii].name === PropName) 
								that.$listener.splice(that.$listener[ii], 1);
		};

		this.runUpdate = function( pPath) {
			if (typeof(pPath) === "undefined")
				pPath = '';
			for (var ii in that.$listener) 
				that.$listener[ii].update();
			var pathParts = removeEmptyStrings(pPath.split('.'));
			if (pathParts.length > 0) {
				var PropName = toProertyname(pathParts[0]);
				if (typeof(that[PropName]) !== 'undefined') {
					pathParts.splice(0, 1);//TODO
					that[PropName].runUpdate( mergeToPath(pathParts));
				}
			}else
				for(var index in that) if(index.indexOf('_t_')==0)
					that[index].runUpdate("");
		};
		// merges a array of names to a path
		function mergeToPath(array) {
			var out = '';
			for (var ii = 0; ii < array.length; ii++) 
				out += out === '' ? array[ii] : '.'+array[ii];
			return out;
		}
		//remove all "" strings
		function removeEmptyStrings(array) {
			while (array.indexOf('') !== -1) 
				array.splice(array.indexOf(''), 1);
			return array;
		}
		function toProertyname(name) {
			return '_t_' + name;
		}
		//run initialisation of observertree
		if (typeof(pNextPath) === "undefined") 
			pNextPath = '';
		
		if (typeof(pObserver) !== "undefined")
			if (pNextPath === '') 
				this.$listener.push(pObserver);
			else 
				this.addListener(pObserver, pNextPath);
	}
	this.initDomViews=function(){
		var stdname="TobservableView";
		var round=0;
		var classname=stdname;
		var elements=document.getElementsByClassName(classname);
		do{
			for(var i=0; i < elements.length; i++)
				new stdElementView(elements[i],that);			
			round++;
			classname=stdname+round;
			elements=document.getElementsByClassName(classname);
		}while(elements.length>0);
	};
	function stdElementView(e,model){
		var tProp=e.getAttribute("tProp");
		var tPath=e.getAttribute("tPath");
		tPath=tPath!=null?tPath:"";
		var tFilter=e.getAttribute("tFilter");
		var defaultValue="";
		if(tProp==null)
			defaultValue=e.innerHTML;
		else 
			defaultValue=e.getAttribute(tProp);
			
		this.update=function(){
			var v=model.get(tPath).data;
			v= v!=null?v:defaultValue;
			if(tFilter!==null)
				v=eval('('+tFilter+'('+v+'))');
			if(tProp==null)
				e.innerHTML=v;
			else
				e.setAttribute(tProp,v);
		};
		model.registerObserver(this,tPath);
	}
}
