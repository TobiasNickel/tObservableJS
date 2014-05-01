/**
 * @fileOverview
 * @author Tobias Nickel
 * @bersion 0.1
 */

/**
 * @class
 * tobservable Class that handle the data
 * @param {mixed} pData the data to observe
 * @param {tobservable} pObserverTree the root observertree (used internally)
 * @param {String} pPath the path of the data that is the current observer is careing about
 */
export =( function(){
	function Tobservable(pData, pObserverTree, pPath) {
		"use strict";
		if (!pData) 
			pData = undefined;
		if (!pObserverTree) 
			pObserverTree = new this.ObserverTree();
		if (!pPath) 
			pPath = '';

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
	Tobservable.prototype.get = function(pPath) {
		var pathParts = (pPath + '').split('.');
		if (pathParts.length === 0)
			return this;
		else{
			var name = pathParts[0];
			if (pathParts.length === 1) {
				return new Tobservable(
					this.data===undefined ? undefined : this.data[name],
					this.observer,
					this.addNameToPath(this.path, name)
				);
			} else {
				pathParts.splice(0, 1);
				return new Tobservable(this.data[name], this.observer, this.addNameToPath(this.path, name), this.rootTobservable).get(mergeToPath(pathParts));
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
	Tobservable.prototype.set = function(pPath, value, run) {
		var pathParts = (pPath + '').split('.');
		var name = pPath;
		if (pathParts.length === 0)
			return null;
		if (pathParts.length === 1) {
			if (run) {
				var out = this.data[name].apply(this.data, value);
				this.notify();
				return out;
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
	Tobservable.prototype.run = function(pPath, value) {
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
	Tobservable.prototype.addNameToPath=function (path, name) {
		return path===''?name:path+'.'+name;
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
	Tobservable.prototype.on = function(pPath,tObserver) {
		if(tObserver===undefined)return;
		tObserver=typeof tObserver == 'function' ? {update:tObserver}:tObserver;
		this.observer.addListener(tObserver, pPath);
	};
	
	/**
	 * remove the described observer
	 * @param {type} path
	 *      tha data-path to the observer, where the last part is the name
	 * @returns {void}
	 */
	Tobservable.prototype.off = function(path,tObserver) {
		this.observer.removeListener(path,tObserver);
	};

	/**
	 * used to tell all observer on the given path to update there view
	 * @param {type} path
	 * @returns {undefined}
	 */
	Tobservable.prototype.notify = function(path,round) {
		if(round===undefined)round=new Date().getTime()+""+Math.random();
		this.observer.runUpdate(this.addNameToPath(this.path, path),round);
	};

	
	/**
	 * @class
	 * @private
	 * Only used by the Tobservable to manage the observer
	 * @param {tobserbable} pObserver
	 * @param {String} pNextPath
	 * @returns {tobservable.observerTree}
	 */
	Tobservable.prototype.ObserverTree=(function(){
		function ObserverTree(pObserver, pNextPath) {
			this.$listener = [];
			
			//run initialisation of observertree
			if (pNextPath === undefined) 
				pNextPath = '';
			
			if (pObserver !== undefined)
				if (pNextPath === '') 
					this.$listener.push(pObserver);
				else 
					this.addListener(pObserver, pNextPath);
		}
		//to add a Listener to the tree
		ObserverTree.prototype.addListener = function(pListener, pPath) {
			var pathParts = pPath.split('.');
			pathParts = this.removeEmptyStrings(pathParts);
			if (pathParts.length > 0) {
				var prop = this.toProertyname(pathParts[0]);
				pathParts.shift();
				if (this[prop] === undefined)
					this[prop] = new ObserverTree(pListener, mergeToPath(pathParts));
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
		ObserverTree.prototype.runUpdate = function runUpdate(pPath,round) {
			if(round===undefined)round=new Date().getTime()+""+Math.random();
			if (pPath === undefined)
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
				if (this[PropName] !== undefined) {
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
		ObserverTree.prototype.removeListener = function removeListener(pPath,tObserver) {
			if (typeof(pPath) === "undefined") 
				pPath = '';
			var pathParts = pPath.split('.');
			pathParts = this.removeEmptyStrings(pathParts);
      var PropName = this.toProertyname(pathParts[0]);
			if (pathParts.length > 1||(tObserver!==undefined && pathParts.length > 0)) {
			
				pathParts.shift();
				if (typeof(this[PropName]) !== 'undefined')
					this[PropName].removeListener( mergeToPath(pathParts),tObserver);
			} else 
				if (pathParts.length === 1 && this[pathParts[0]] !== undefined) {
					for (var i in this.$listener) 
						if (typeof this.$listener[i].name === 'string' && this.$listener[i].name === PropName) 
							this.$listener.splice(i, 1);
				}else
					if(tObserver!==undefined)
						for (var ii=0;ii<this.$listener.length;ii++) 
							if (this.$listener[ii]===tObserver || this.$listener[ii].update === tObserver) 
								this.$listener.splice(ii, 1);
				
		};
		//remove all "" strings
		ObserverTree.prototype.removeEmptyStrings=function removeEmptyStrings(array) {
			while (array.indexOf('') !== -1) 
				array.splice(array.indexOf(''), 1);
			return array;
		};
		//remove all "" strings
		ObserverTree.prototype.removeEmptyStrings=function removeEmptyStrings(array) {
			while (array.indexOf('') !== -1) 
				array.splice(array.indexOf(''), 1);
			return array;
		};
		
		ObserverTree.prototype.toProertyname=function toProertyname(name) {
			return '_t_' + name;
		};
		return ObserverTree;
	})();

	Tobservable.prototype.utils={
		stdViewBehavior:function(){
			var emptyFunction=function(){},
				callSecoundF=function(e,f){f(e);};
			return{
				beforeAdd:emptyFunction,
				afterAdd:emptyFunction,
				beforeRemove:callSecoundF,
				afterRemove:emptyFunction,
				beforeUpdate:callSecoundF,
				afterUpdate:emptyFunction
			};
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
			};
		},
		LinkToArrayView:function LinkToArrayView(elementPath,arrayPath){
			this.update=function updateLinkView(round){
				var sourceData=tobserver.get(elementPath).data;
				var array=tobserver.get(arrayPath).data;
				tobserver.notify(arrayPath+"."+array.indexOf(sourceData ),round);
			};
		},
		LinkFromArrayView:function LinkFromArrayView(elementPath,arrayPath){
			this.update=function updateLinkView(round,pathParts){
				var sourceData=tobserver.get(elementPath).data;
				var array=tobserver.get(arrayPath).data;
				if(pathParts[0]!==undefined){
					if(array[pathParts[0]]!==sourceData){
						tobserver.notify(elementPath,round);
					}
				}else tobserver.notify(elementPath,round);
			};
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
			out+=(out===''?'':'.')+array[ii];
		return out;
	};
	
	return new tobservable({});
})();
