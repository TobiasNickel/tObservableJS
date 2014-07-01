/**
 * @fileOverview
 * @author Tobias Nickel
 * @version 0.12
 */

/**
 * Object, that contains methods, that can not run in StrictMode
 */
var tObserverNoStricts=(function(){  
    //for shorter htmlArrStrings so they don't need to be handed over as a string
    var styleKeys=(function(){
        var hOption="htmloption",
            hList="htmllist",
            iHtml="innerhtml",
            v="value",
            disabled="disables";
        var out={
            option:hOption,OPTION:hOption,Option:hOption,
            htmlOption:hOption,htmlOPTION:hOption,htmloption:hOption,
            list:hList,List:hList,LIST:hList,
            htmlList:hList,htmllist:hList,htmlLIST:hList,
            html:iHtml,Html:iHtml,HTML:iHtml,
            innerHTML:iHtml,innerhtml:iHtml,innerHtml:iHtml,
            value:v,Value:v,VALUE:v,
            disabled:disabled,DISABLED:disabled,Disabled:disabled
        };
        var style = document.createElement('div').style;
        for(var i in style){
            out[i]=i;
            out[i.toUpperCase()]=i;
            out[i.toLowerCase()]=i;
        }
        return out;
    })();
    
    /**
     *  gets and interpreted the attr attribute from the element, caches the value and returns the value.
     *  @parem element the dom node
     */
    function getAttr_sloppy(element) {
        if (element.attr) return element.attr;

        var attr = element.getAttribute === undefined ? null : element.getAttribute("tObserver");
        if (attr === null) return null;
        with(styleKeys){
            try {
                attr = eval("({" + attr + "})"); // default case without breaces
            } catch (e) {
                try {
                    attr = eval("(" + attr + ")");// optional breaces
                } catch (e) {
                    attr={ path: attr };// hand over a string, containing a path
                }
            }
        }
        if (!attr.path) attr.path = [""];
        if (!Array.isArray(attr.path)) attr.path = [attr.path];
        for (var i in attr.path) {
            attr.path[i] = attr.path[i][attr.path[i].length - 1] == '.' ?
                attr.path[i].slice(0, attr.path[i].length - 1) : attr.path[i];
            attr.path[i] = attr.path[i] === '' ? '' : attr.path[i];
        }
        attr.type = (!attr.type)?"innerhtml":attr.type;
        if (!Array.isArray(attr.type)) attr.type = [attr.type];
        if (!Array.isArray(attr.filter)) attr.filter = [attr.filter];
        element.attr = attr;
        return attr;
    }
    return {getAttr:getAttr_sloppy};
})();


// the only global Tobservable caring about the window object
var tobserver = (function (window, document, undefined) {
	"use strict";
	/**
	 * @class
	 * Tobservable Class that handle the data
	 * @param {mixed} pData the data to observe
	 * @param {tobservable} pObserverTree the root observertree (used internally)
	 * @param {String} pPath the path of the data that is the current observer is careing about
	 */
	function Tobservable(pData, pObserverTree, pPath) {
		if (!pObserverTree)
			pObserverTree = new this.ObserverTree();
		if (!pPath)
			pPath = '';

		this.data = pData; // the ProgrammData
		this.observer = pObserverTree;
		this.path = pPath;
	}
    //Helper Begin
    // the helper are private methods, used within the framework.
	/**
	 * @param {String} path
	 *      data Path as known
	 * @param {type} name
	 *      the name to add
	 * @returns {String}
	 */
    function addNameToPath(path, name) {
		if(!name)return path;
        var p = path === "" ? name : path + '.' + name;
		return p;
	};
	//two short helper
	var returnFirst=function(e){return e;},
		emptyFunction = function () {},
		callSecoundF = function (e, f) {
			f(e);
		},
		escapeHTML = (function () {
			var chr = {
				'"': '&quot;', '&': '&amp;', "'": '&#39;',
				'/': '&#47;',  '<': '&lt;',  '>': '&gt;'
			};
			return function (text) {
				if(typeof text !== "string") return text;
				return text.replace(/[\"&'\/<>]/g, function (a) { return chr[a]; });
			};
		}()),
		//remove all "" strings
		removeEmptyStrings=function removeEmptyStrings(array) {
			while (array.indexOf('') !== -1)
				array.splice(array.indexOf(''), 1);
			return array;
		};
    var tobserver;
	/**
	 *  creates an ObjectUpdateView and binds it to the path.
	 *  @private
	 *  @param {String} path
	 *  @param {Object} updateObject
	 */
	function updateUpdateObjectComplete(path, updateObject) {
		var data = tobserver.getData(path);
		for (var i in data) 
			if (updateObject[i] !== undefined && data)
				updateObject[i](path, data);
	}
	/**
	 *  merges a array of names to a path
	 *  @private
	 *  @param {Array} array
	 *      an array containing strings with the names
	 *  @returns {String}
	 */
	function mergeToPath(array) {
		var out = '';
		for (var ii = 0; ii < array.length; ii++)
			out += (out === '' ? '' : '.') + array[ii];
		return out;
	};
    //Helper END
	/**
	 * will return a tObservable, that observes the given path
	 *
	 * @param {type} pPath
	 *      identifies the path, that you want to have
	 * @returns {tobservable}
	 */
	Tobservable.prototype.get = function (pPath) {
		var pathParts = (pPath + '').split('.');
		if (pathParts.length === 0)
			return this;
		else {
			var name = pathParts[0];
			if (name === "") return this;
			if (pathParts.length === 1) {
				return new Tobservable(
					this.data === undefined ? undefined : this.data[name],
					this.observer,
					addNameToPath(this.path, name)
				);
			} else {
				pathParts.splice(0, 1);
				return new Tobservable(this.data[name], this.observer, addNameToPath(this.path, name)).get(mergeToPath(pathParts));
			}
		}
	};
	/**
	 * shortcut for if tobserver.get(somePath).data
	 *	if works much faster !!
	 * @param {type} pPath
	 *      identifies the path, that you want to have
	 * @returns {tobservable}
	 */ 
	Tobservable.prototype.getData = function (pPath) {
		var pathParts = (pPath + '').split('.');
		pathParts = removeEmptyStrings(pathParts);
		var data=this.data;
		for(var i in pathParts){
			if(data[pathParts[i]]!==undefined && data[pathParts[i]]!==null){
				data=data[pathParts[i]];
			}else return undefined;
		}
		return data;
	};

    /**
	 * used to set a value or execute a method on the data, 
	 *	it will notify the observer
	 * @param {String} pPath
	 *      identifing the data to update
	 * @param {Mixed} value
	 *      the new value of the described data
	 * @param {Boolean} run
	 *
	 * @returns {void}
	 */
	Tobservable.prototype.innerSet = function (pPath, value, run) {
		var pathParts = (pPath + '').split('.');
		var name = pPath;
		if (pathParts.length === 0)
			return null;
		if (pathParts.length === 1) {
			if (run) {
				return this.data[name].apply(this.data, value);
			} else {
				if (this.data[name] !== value) {
					this.data[name] = value;
				}
				return this;
			}
		} else {
			name = pathParts.pop();
			return this.get(mergeToPath(pathParts)).innerSet(name, value, run);
		}
	};
    /**
	 * used to set a value or execute a method on the data, 
	 *	it will notify the observer
	 * @param {String} pPath
	 *      identifing the data to update
	 * @param {Mixed} value
	 *      the new value of the described data
	 * @param {Boolean} run
	 *     bool, run sais the path describes a method to execute, not  value to set.
	 * @param {Boolean} online
	 *     an option, to avoid sending the command to the server.
	 * @param {Onject} socket
	 *     an object, that has an emit(name, string), method, that will send the command to the server
	 * 
	 * @returns {void}
	 */
	Tobservable.prototype.set = function (pPath, value, run,online,socket) {
		//console.log(socket);
		if(!run)run=false;
		if(online===undefined)online=true;
		
		var data=tobserver.getData(pPath);
		if(!run && data===value)return;
		
		this.notify(pPath,value,run,online,socket);
		return this.innerSet(pPath, value, run);
	};
	/**
	 * will apply a function described with the path,
	 * @param {String} pPath
	 *      describs the Data-Path
	 * @param {Array} value
	 *      the Parameterlist for the given function
	 * @returns {void}
	 */
	Tobservable.prototype.exec =
	Tobservable.prototype.run = function (pPath, value) {
			this.set(pPath, value, true);
	};
	

	/**
	 * used to register a opserver on the described path
	 * (it is not calling the update merthod.)
	 * @param {Observer} tObserver
	 *      a function 
 	 * 		or an object like: {name:"someName",update:function(){}}
	 * @param {type} pPath
	 *      describes the path wherer the observer should be registered
	 */
	Tobservable.prototype.on = function (pPath, tObserver) {
		if (!tObserver) return;
		tObserver = typeof tObserver == 'function' ? {
			update: tObserver
		} : tObserver;
		this.observer.addListener(tObserver, pPath);
	};

	/**
	 * remove the described observer
	 * @param {type} path
	 *      tha data-path to the observer, where the last part is the name
	 * @param {view} tObserver
	 *      the tObserver to remove. can be a simple method or a view-object
	 */
	Tobservable.prototype.off = function (path, tObserver) {
		this.observer.removeListener(path, tObserver);
	};

	/**
	 * used to tell all observer on the given path to update there view
	 *     if fact it is adding commands to the notifiee.path.
	 * @param {String} pPath
	 *      identifing the data to update
	 * @param {Mixed} value
	 *      the new value of the described data
	 * @param {Boolean} run
	 *     bool, run sais the path describes a method to execute, not  value to set.
	 * @param {Boolean} online
	 *     an option, to avoid sending the command to the server.
	 * @param {Onject} socket
	 *     an object, that has an emit(name, string), method, that will send the command to the server
	 * 
	 * @returns {void}
	 */
	Tobservable.prototype.notify = function (path, data, run, online, socket, round) {
		if (path === undefined) path = "";
		if (round === undefined) round = new Date().getTime() + "" + Math.random();
		path = addNameToPath(this.path, path);
		var index=this.notifyee.commands.indexOfIn(path,"path");
		if (run || (data!==tobserver.getData(path)) && (index === -1 || !this.notifyee.commands[index].run )){ 
			this.notifyee.commands.push({
				path:path,
				data:data,
				run:run,
				online:tobserver.notifyee.onlineMode?online:false,
				socket:socket
			});
			clearTimeout(tobserver.notifyee.timeout);
			tobserver.notifyee.timeout =
				setTimeout(function () {
					tobserver.notifyee.notify(round);
				}, tobserver.notifyee.speed);
		}																									
	};
	Array.prototype.indexOfIn=function(needle,propName){
		for(var i in this){
			if(this[i][propName]===needle)return i;
		}
		return -1;
	};
	Object.defineProperty(Array.prototype, "indexOfIn", { enumerable: false });
	
	/**
	 * used by .notify to cache the update-Paths
	 * @param {type} path
	 * @returns {undefined}
	 */
	Tobservable.prototype.notifyee = {
        /**
         * THE notify method, that is starting the update on the ObserverTree
         * round will be used, if avoide infinit loops.
         */
		notify: function (round) {
			var commands = this.commands;
			this.commands = [];
			this.onlineMode=this.onlineLiveMode;
			for (var i in commands){
				tobserver.observer.runUpdate(commands[i].path, round);
				if( this.socket && commands[i].online && !this.isLocal(commands[i].path) ){
					//console.log("sharePath: ",commands[i].path,JSON.stringify(commands[i].data));
					if(!commands[i].socket){
						this.socket.emit("tOmand",JSON.stringify({path:commands[i].path,data:commands[i].data,run:commands[i].run}));
					} else {
						commands[i].socket.broadcast.emit('tOmand', JSON.stringify({path:commands[i].path,data:commands[i].data,run:commands[i].run}));
					}
				}
			}
			this.onlineMode=true;
		},
		/**
		 * if onlineMode is false, the actions are not send live to the server.
		 * this is used internally, to avoid sending changes to the server, 
		 * that are triggert by the views
		 */
		onlineMode:true,
		/**
		 * livemode, during an update-Round, the onlineMode is by default set to false. 
		 * and reactivated afterwards. if the live mode is true, 
		 * the changes made in the views are also send to the server.
		 * but this is not nessasary, if all clients use the same data-Views.
		 */
		onlineLiveMode:false, 
        /**
         * list of notify-orders
         * {path:path,data:data,run:bool,online:bool,socket:Socket(.io)}
         */
		commands: [],// 
        /**
         * path that whould not be 
         */
		locals:[],
        /**
         * Method, that checks, if the update-order need to be send to the server.
         */
		isLocal:function(path){
			var locals=this.locals
			for(var i in locals){
				if(path.indexOf(locals[i])===0)return true;
			}
			return false;
		},
        /**
         * the socket is a socket.io, socket or namespace
         * or an jQuery, socket from the utils.
         */
		socket:undefined,
        /**
         * id of the timeout, for the next notification.
         * if there are new updates, the cur timeout will be cleared and a new set.
         */
		timeout: 0,
        /**
         * async rendering, 0 millisecond are enought, you might with that to be a bit slower
         */
		speed: 1
	};
 	
	/**
	 * @class
	 * @private
	 * Only used by the Tobservable to manage the observer
	 * @param {tobserbable} pObserver
	 * @param {String} pNextPath
	 * @returns {tobservable.observerTree}
	 */
	Tobservable.prototype.ObserverTree = (function () {
		function ObserverTree(pObserver, pNextPath) {
			this.$listener = [];
			//run initialisation of observertree
			if (!pNextPath)
				pNextPath = '';
			if (pObserver !== undefined)
				if (pNextPath === '')
					this.$listener.push(pObserver);
				else
					this.addListener(pObserver, pNextPath);
		}
        /**
         * creates a Propertyname, that will hopefilly never match a name, 
         * used by the application developed using tobservable
         * so, currently the problem will be, when the developer uses propertynames like
         * _t__t_name and _t_name what is quite improbable
         */
		function toProertyname(name) {
			return '_t_' + name;
		};
		/**
		 * Only used by the Tobservable to manage the observer
		 * @param {tobserbable} pObserver
		 * @param {String} pNextPath
		 * @returns {tobservable.observerTree}
		 */
		ObserverTree.prototype.addListener = function (pListener, pPath) {
			var pathParts = pPath.split('.');
			pathParts = removeEmptyStrings(pathParts);
			if (pathParts.length > 0) {
				var prop = toProertyname(pathParts[0]);
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
		ObserverTree.prototype.runUpdate = function runUpdate(pPath, round) {
			if (!round) round = new Date().getTime() + "" + Math.random();
			if (!pPath)
				pPath = '';
			var pathParts = removeEmptyStrings(pPath.split('.'));
			//update the listener on the current node
			for (var ii in this.$listener)
				if (this.$listener[ii].tNotificationRoundNumber != round) {
					this.$listener[ii].tNotificationRoundNumber = round;
					this.$listener[ii].update(round, pathParts);
				}
			//go through the path
			if (pathParts.length > 0) {
				var propName = toProertyname(pathParts[0]);
				if (this[propName] !== undefined) {
					pathParts.splice(0, 1); 
					this[propName].runUpdate(mergeToPath(pathParts), round);
				}
			} else
				for (var index in this)
					if (index.indexOf('_t_') === 0)
						this[index].runUpdate("", round);
		};

		/**
		 * is removing the described Listener
		 * @param {type} pPath
		 *      the path to the lsitener, where the last part is the name
		 * @returns {void}
		 */
		ObserverTree.prototype.removeListener = function removeListener(pPath, tObserver) {
			if (!pPath)
				pPath = '';
			var pathParts = pPath.split('.');
			pathParts = removeEmptyStrings(pathParts);
			var PropName = toProertyname(pathParts[0]);
			if (pathParts.length > 1 || (tObserver && pathParts.length > 0)) {
				pathParts.shift();
				if (this[PropName] !== undefined)
					this[PropName].removeListener(mergeToPath(pathParts), tObserver);
			} else if (pathParts.length === 1 && this[pathParts[0]] !== undefined) {
				for (var i in this.$listener)
					if (typeof this.$listener[i].name === 'string' && this.$listener[i].name === PropName)
						this.$listener.splice(i, 1);
			} else if (tObserver)
				for (var ii = 0; ii < this.$listener.length; ii++)
					if (this.$listener[ii] === tObserver || this.$listener[ii].update === tObserver)
						this.$listener.splice(ii, 1);

		};
		return ObserverTree;
	})();



    
	/**
	 * the stdView, that is used for document-nodes
	 * @class
	 * @param {dom-node} e
	 * @param {tobservable} tobserver
	 * @returns {tobservable.StdElementView}
	 */
	Tobservable.prototype.StdElementView = function () {
		/**
		 *	Contstructor for a StdElementView
		 *	it can be a simple view, or a htmlList-View.
		 */
		function StdElementView(element, tobserver) {
			var attr = getAttr(element);
			if (attr === null) return;
			if (element._tName !== undefined) return;
			attr.outer = attr.outer !== undefined ? attr.outer : "div";
			attr.path = attr.path === '' ? 'window' : attr.path;

			this.element = element;
			attr.defaultValue = [];
			attr.preview = [];
			for (var i in attr.type) {
				if (attr.type[i].toLowerCase() === "htmllist" || attr.type[i].toLowerCase() === "htmloption" || attr.type[i].toLowerCase() === "innerhtml" ) {
					attr.defaultValue[i] = element.innerHTML;
					attr.preview[i] = this.element.innerHTML;
					this.element.innerHTML = "";
				} else {
					attr.defaultValue[i] = element.getAttribute(attr.type);
				}
				if (attr.type[i] === "value") {
					this.folowElement(element);
				}
			}
			attr.beforeAdd = attr.beforeAdd !== undefined ? attr.beforeAdd : tobserver.utils.stdViewBehavior.beforeAdd;
			attr.afterAdd = attr.afterAdd !== undefined ? attr.afterAdd : tobserver.utils.stdViewBehavior.afterAdd;
			attr.beforeRemove = attr.beforeRemove !== undefined ? attr.beforeRemove : tobserver.utils.stdViewBehavior.beforeRemove;
			attr.afterRemove = attr.afterRemove !== undefined ? attr.afterRemove : tobserver.utils.stdViewBehavior.afterRemove;
			attr.beforeUpdate = attr.beforeUpdate !== undefined ? attr.beforeUpdate : tobserver.utils.stdViewBehavior.beforeUpdate;
			attr.afterUpdate = attr.afterUpdate !== undefined ? attr.afterUpdate : tobserver.utils.stdViewBehavior.afterUpdate;

			var name = "tObserverName" + Math.random() * 10000000000000000;
			this.name = name;
			this.element._tName = name;
			this.element._tObserver = this;
			this.element.attr = attr;
			this.attr = attr;
			for (i in attr.path)
				tobserver.on(attr.path[i], this);
			this.update();
		}
        
        var getAttr=tObserverNoStricts.getAttr;
		/**
		 *	the standard updatemethod, called by the tObserver
		 */
		StdElementView.prototype.update = function () {
			var type;
			var filter=returnFirst;
			var maxLen = this.attr.path.length;
			if (maxLen < this.attr.type.length) maxLen = this.attr.type.length;
			for (var i = 0; i < maxLen; i++) {
				var path = this.attr.path[i] === undefined ? path : this.attr.path[i];
				type = !this.attr.type[i] ? type : this.attr.type[i];
				filter=(type==="value"||type==="data") ? returnFirst : escapeHTML;
				var v = tobserver.getData(path);
				v = typeof v === "number" ? v + "" : v;
				var orgData = v;

				filter = this.attr.filter[i] ? this.attr.filter[i] : filter ;
				v = filter(v);
				v = v!==undefined ? v : this.attr.defaultValue[i];
				type = !this.attr.type[i] ? type : this.attr.type[i];
				switch (type) {
				case 'innerhtml':
				case 'innerHtml':
				case 'innerHTML':
				case undefined:
                    if(!v)v=this.attr.defaultValue[i];
					this.attr.beforeUpdate(this.element, function (element) {
						if (element.innerHTML != v) {
							element.innerHTML = v;
							element.attr.afterUpdate(element);
						}
						element.attr.afterUpdate(element);
					});
					break;
				case 'data':
					this.element.data=v;
					break;
				case 'htmllist':
				case 'htmlList':
					this.updateList(v, orgData);
					break;
				case 'htmloption':
				case 'htmlOption':
					this.updateOption(v, orgData);
					break;
				case 'value':
					this.attr.beforeUpdate(this.element, function (element) {
						if (element.value == v)
							return;
						element.value = v;
						element.attr.afterUpdate(element);
					});
					break;
				default:
					this.attr.beforeUpdate(this.element, function (element) {
                        if(type == "disabled"){
                            element.disabled=v;
                        } else if (!(element.style[type] === undefined)  || type == "src" || type == "class") {
							if (element.getAttribute(type) == v)
								return;
							element.setAttribute(type, v);
						} else {
							if (element.style[type] == v)
								return;
							element.style[type] = v;
						}
						element.attr.afterUpdate(element);
					});
				}
			}
		};
		StdElementView.prototype.updateOption = function(data, orgData) {
			if (data == false || data==undefined ||data==null) {
				this.element.innerHTML = "";
				this.element.display = "none";
			} else {
				this.element.display = "";
				if (this.element.innerHTML === "") {
					var newElement = document.createElement("div");
					newElement.innerHTML = this.attr.preview;
					this.findAndUpdatePath(newElement, this.attr.path);
					while (newElement.children[0] !== undefined) {
						this.attr.beforeAdd(newElement.children[0], orgData);
						this.element.appendChild(newElement.children[0]);
						this.attr.afterAdd(newElement.children[0], orgData);
					}
				}
			}
		};

		/**
		 *	the speaciel bevavior of the htmlList-Views
		 */
		StdElementView.prototype.updateList = function(data, orgData) {
			if (this.displayedOrdData != orgData)
				this.element.innerHTML = "";
			var i = 0;
			this.displayedOrdData = orgData;
			var kids = this.element.children;
			var displayedData = [];
			var displayedElements = [];
			//remove deleted Elements and saving the position on the kids
			for (i = 0; i < kids.length; i++) {
				var newPosition = data.indexOf(kids[i].item);
				if (newPosition == -1) {
					kids[i].innerHTML = kids[i].innerHTML.replace("tobserver", "removedtObserver").trim();
					this.attr.beforeRemove(kids[i], function (e) {
						if (e) {
							e.remove();
							i--;
						}
					});
				} else {
					this.attr.beforeUpdate(kids[i], emptyFunction);
					displayedData.push(kids[i].item);
					if (kids[i].className == "tobserverlistitem") {
						if (newPosition != kids[i].position) {
							this.updateRootPath(kids[i], this.attr.path + "." + newPosition, this.attr.path + "." + kids[i].position);
						}
						kids[i].position = newPosition;
						displayedElements.push(kids[i]);
					}
				}
			}
			var focussedElement = document.activeElement;
			displayedElements.sort(function (a, b) {
				return a.position - b.position;
			});
			for (i = 0; i < displayedElements.length; i++) {
				this.element.appendChild(displayedElements[i]);
			}
			focussedElement.focus();

			//appendNewElements
			var listIndex = 0;
			if (!orgData) return;
			for (i = 0; i < data.length; i++) {

				if (displayedElements[listIndex] !== undefined && data[i] == displayedElements[listIndex].item)
					listIndex++;
				else {
					if (displayedData.indexOf(data[i]) == -1) {
						//create new insertBefore
						var orgIndex = orgData.indexOf(data[i]);
						var kid = document.createElement(this.attr.outer);
						kid.setAttribute("class", "tobserverlistitem");

						kid.innerHTML = this.attr.preview;
						this.findAndUpdatePath(kid, this.attr.path + "." + orgIndex);
						kid.position = i;
						kid.item = data[i];
						if (displayedElements[listIndex] !== undefined)
							displayedElements[listIndex].parentNode.insertBefore(kid, displayedElements[listIndex]);
						else this.element.appendChild(kid);

						tobserver.StdElementView.findTObserver(kid);
						this.attr.beforeAdd(kid, data[i]);
						this.attr.afterAdd(kid, data[i]);
					}
				}
			}

			kids = this.element.children;
		};
		/**
		 *	if the Path for the a List-Item has changed, this function will update the childs
		 */
		StdElementView.prototype.findAndUpdatePath = function(element, root) {
			var attr = getAttr(element);
			var kids = element.children;
			if (attr === null)
				for (var s in kids)
					this.findAndUpdatePath(kids[s], root);
			else
				this.setRoot(element, root);

		};
		/**
		 *	set the rootPath, for a new created List-View-Element
		 */
		StdElementView.prototype.setRoot = function setRoot(element, root) {
			var attr = getAttr(element);
			if (!attr.path) attr.path = [""];
			for (var i in attr.path) {
				if (attr.path[i].indexOf(root) == -1)
					attr.path[i] = root + "." + attr.path[i];
			}

		};
		/**
		 *	similar	to findAndUpdatePath, but findAndUpdatePath, only can be used for the initialisation of the object.
		 */
		StdElementView.prototype.updateRootPath = function(element, newRootPath, oldRootPath) {
			if (!element) return;
			if (!newRootPath) return;
			if (!oldRootPath) return;
			var kids = element.children;
			for (var i in kids) {
				if (kids[i].attr) {
					for (var ii in kids[i].attr.path) {
						var realOrgPath = kids[i].attr.path[ii].replace(oldRootPath + '.', '');
						if (kids[i].attr.type[ii].toLowerCase() == 'htmllist') {
							this.updateRootPath(kids[i], realOrgPath + "." + realOrgPath, oldRootPath + "." + realOrgPath);
						}
						tobserver.off(kids[i].attr.path[ii] + "." + kids[i]._tName);
						tobserver.on(newRootPath + '.' + realOrgPath, kids[i]._tObserver);
						kids[i].attr.path[ii] = newRootPath + '.' + realOrgPath;
					}
				} else {
					this.updateRootPath(kids[i], newRootPath, oldRootPath);
				}
			}
		};
		StdElementView.prototype.folowElement = function (element) {
			var change = function () {
				var attr = element.attr;
				for (var i in attr.path) {
					if (attr.type[i] === "value") {
						var value = element.value;
						var type = element.getAttribute("type");
						if (type !== null && type.toLocaleLowerCase().trim() === "number")
							value = parseFloat(value);
						if (type !== null && type.toLocaleLowerCase().trim() === "checkbox")
							value = element.checked;
						tobserver.set(attr.path[i], value);
					}
				}
			};
			element.addEventListener("change", change);
			element.addEventListener("keyup", change);
		};
		
		/**
		 * get all HTML objects with the given klass, and makes a view with them.
		 * if also register observer ther on the DOM to create StdViews for the elements that are new Created
		 */
		StdElementView.initDomViews = function() {
			var html=document.getElementsByTagName("html")[0];
			// liveupdate in the dom
			tobserver.utils.bindEvent(html, 'DOMNodeInserted', function (ev) {
				var element = ev.srcElement?ev.srcElement:ev.target;
				StdElementView.findTObserver(element);
			});
			//document.addEventListener('DOMNodeInserted',);
			tobserver.utils.bindEvent(html, 'DOMNodeRemoved', function (ev) {
				var element = ev.srcElement?ev.srcElement:ev.target;
				if (element !== undefined && element.getAttribute !== undefined)
					setTimeout(function () {
						var attr = getAttr(element);
						if (attr !== undefined && element._tName !== undefined) {
							var tPath = attr.path;
							tPath = tPath !== undefined ? tPath : "";
							tobserver.off(tPath + "." + element._tName);
						}
					}, 1000);
			});
			this.findTObserver();
		};
        /**
         * searches for tobserver on the HTML.
         * tObserver are html-elements that have an tobserver-Attribute, 
         * with a structure described on the docu.
         * 
         * @param {htmlNode} element    
         *      the Element where to analyse all childs. 
         *      if undefined the html-node is taken.
         */
		StdElementView.findTObserver = function (element) {
			if (element === undefined) {
				element = document.getElementsByTagName("html")[0];
			}
			var attr = getAttr(element);
			var kids = element.children;
			if (attr === null)
				for (var s in kids)
					StdElementView.findTObserver(kids[s]);
			else {
				element.attr = attr;
				new tobserver.StdElementView(element, tobserver);

			}
		};

		return StdElementView;
	}();

	Tobservable.prototype.utils = {
		stdViewBehavior: function () {
			return {
				beforeAdd: emptyFunction,
				afterAdd: emptyFunction,
				beforeRemove: callSecoundF,
				afterRemove: emptyFunction,
				beforeUpdate: callSecoundF,
				afterUpdate: emptyFunction
			};
		}(),
        //LINK VIEW BEGIN
		/**
		 * linkes two paths
		 * is used, when on both paths should be stored the same object.
		 * it is not updating the data (because this is happend automaticly)
		 * but it makes sure, that the observer on both sites are activated.
		 * @param {String} sourcePath
		 * @param {String} destPath
		 */
		linkViews: function (sourcePath, destPath) {
			tobserver.on(sourcePath, new this.LinkView(destPath));
			tobserver.on(destPath, new this.LinkView(sourcePath));

		},
		/**
		 * linkes two paths, where one the secound path is an array, 
		 * that contains the object under the first path.
		 * 
		 * is used, when on both paths should be stored the same object.
		 * it is not updating the data (because this is happend automaticly)
		 * but it makes sure, that the observer on both sites are activated.
		 * @param {String} elementPath
		 * @param {String} destPath
		 */
		linkToArrayViews: function (elementPath, arrayPath) {
			tobserver.on(elementPath, new this.LinkToArrayView(elementPath, arrayPath));
			tobserver.on(arrayPath, new this.LinkFromArrayView(elementPath, arrayPath));
		},
		/**
		 *  constructor for LinkView
		 * it updates the path of destPath.
		 * and can be registered on multiple other paths
		 * @param {String} destPath
		 */
		LinkView: function LinkView(destPath) {
			this.update = function updateLinkView(round) {
				var data=tobserver.getData(destPath);
				tobserver.notify(destPath, data,false,true,undefined,round);
				//(path, data, run, online, socket, round)
			};
		},
		/**
		 *  constructor for LinkToArrayView
		 * same as linkView, but it points on an Array. that contains the element of elementPath.
		 * @param {String} elementPath
		 * @param {String} arrayPath
		 */
		LinkToArrayView: function LinkToArrayView(elementPath, arrayPath) {
			this.update = function updateLinkToArrayView(round) {
				var sourceData = tobserver.getData(elementPath);
				var array = tobserver.getData(arrayPath);
				var arrayElementPath=arrayPath + "." + array.indexOf(sourceData);
				tobserver.notify(arrayElementPath,"someCrapthatWIllneverBeAValue5142f7d9aj8496547c6fc6gca37f215cf",false,true,undefined, round);
			};
		},
		/**
		 *  constructor for LinkFromArrayView
		 * the link from an array to an object, the method only notifies the elementPath-Views, 
		 * if the depending element has changed, not if anything changed(smart)
		 * @param {String} elementPath
		 * @param {String} arrayPath
		 */
		LinkFromArrayView: function LinkFromArrayView(elementPath, arrayPath) {
			this.update = function updateLinkView(round, pathParts) {
				var sourceData = tobserver.getData(elementPath);
				var array = tobserver.getData(arrayPath);
                var index=array.indexOf(sourceData);
				if (pathParts[0] !== undefined && index==pathParts[0]) {
					if (array[pathParts[0]] !== sourceData) {
						tobserver.notify(elementPath,"someCrapthatWIllneverBeAValue5142f7d9ja8496547g6fc65ca37f215cf",false,true,undefined, round);
					}
				}
			};
		},
        //LINK VIEW END
        //UPDATE VIEW BEGIN
		/**
		 *  constructor for ArrayUpdateView
		 * uses an update-Object, as view, for each element in the array.
		 *  @param {String} arrayPath
		 *  @param {Object} updateObject
		 */
		ArrayUpdateView: function (arrayPath, updateObject) {
			this.update = function (round, nextPathparts) {
				if (nextPathparts[0] !== undefined && nextPathparts[1] !== undefined) {
					var index = nextPathparts.splice(0, 1);
					var paramName = nextPathparts.splice(0, 1);
					var newSetValue = tobserver.getData(arrayPath + "." + index);
					if(newSetValue && updateObject[paramName])
						updateObject[paramName](arrayPath + "." + index, newSetValue, nextPathparts);
				} else {
					var array = tobserver.getData(arrayPath);
					for (var i = 0; i < array.length; i++)
						updateUpdateObjectComplete(arrayPath + "." + i, updateObject);
				}
			};
		},
		/**
		 *  creates an ArrayUpdateView and binds it to the path.
		 *  @param {String} path
		 *  @param {Object} updateObject
		 */
		registerArrayUpdateView: function (path, updateObject) {
			tobserver.on(path, new tobserver.utils.ArrayUpdateView(path, updateObject));
			var array = tobserver.getData(path);
			for (var i = 0; i < array.length; i++)
				updateUpdateObjectComplete(path + "." + i, updateObject);
		},
		/**
		 *  constructor for ObjectUpdateView
		 * uses an update-Object, as view, for the object under the path.
		 *  @param {String} objectPath
		 *  @param {Object} updateObject
		 */
		ObjectUpdateView: function (objectPath, updateObject) {
			this.update = function (round, nextPathparts) {
				if (nextPathparts[0] !== undefined) {
					var paramName = nextPathparts.splice(0, 1);
					var newSetValue = tobserver.getData(objectPath);
					if(newSetValue)
						updateObject[paramName](objectPath, newSetValue, nextPathparts);
				} else updateUpdateObjectComplete(objectPath, updateObject);
			};
		},
		/**
		 *  creates an ObjectUpdateView and binds it to the path.
		 *  @param {String} path
		 *  @param {Object} computeProperty
		 */
		registerObjectUpdateView: function (path, updateObject) {
			tobserver.on(path, new tobserver.utils.ObjectUpdateView(path, updateObject));
			updateUpdateObjectComplete(path, updateObject);
		},
        //UPDATE VIEW END
		/**
		 *  the history modul from backbone, changed, that it just updates an URL property on via tobserver.
		 * requires jQuery
		 * @param {String} elementPath
		 * @param {String} arrayPath
		 */
		history: function () {
			//NESSASARY PARTS OF UNDERSCORE
			var _ = {};
			var Ctor = function () {};
			var breaker = {};
			var slice = Array.prototype.slice,
				hasOwnProperty = Object.prototype.hasOwnProperty;

			// All **ECMAScript 5** native function implementations that we hope to use
			// are declared here.
			var nativeSome = Array.prototype.some,
				nativeForEach = Array.prototype.forEach,
				nativeBind = Function.prototype.bind;

			// Create a function bound to a given object (assigning `this`, and arguments,
			// optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
			// available.
			_.bind = function (func, context) {
				var args, bound;
				if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
				if (!_.isFunction(func)) throw new TypeError();
				args = slice.call(arguments, 2);
				return function () {
					if (!(this instanceof bound))
						return func.apply(context, args.concat(slice.call(arguments)));
					Ctor.prototype = func.prototype;
					var self = new Ctor();
					Ctor.prototype = null;
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
				var i, length;
				if (nativeForEach && obj.forEach === nativeForEach) {
					obj.forEach(iterator, context);
				} else if (obj.length === +obj.length) {
					for (i = 0, length = obj.length; i < length; i++) {
						if (iterator.call(context, obj[i], i, obj) === breaker) return;
					}
				} else {
					var keys = _.keys(obj);
					for (i = 0, length = keys.length; i < length; i++) {
						if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
					}
				}
				return obj;
			};

			// Keep the identity function around for default iterators.
			_.identity = function (value) {
				return value;
			};

			// Determine if at least one element in the object matches a truth test.
			// Delegates to **ECMAScript 5**'s native `some` if available.
			// Aliased as `any`.
			_.some = _.any = function (obj, predicate, context) {
				//predicate || (predicate = _.identity);
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
				if (window !== undefined) {
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
				this.options = options === undefined ? {} : options;
				this.options.root = "/";

				this.path = this.options.path === undefined ? "url" : this.options.path;
				// _.extend({root: '/'}, this.options, options);
				this.root = this.options.root;
				this._wantsHashChange = this.options.hashChange !== false;
				this._wantsPushState = !!this.options.pushState;
				this._hasPushState = !!(this.options.pushState && this.history && this.history.pushState);
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
				$(document).on("click", "a[href^='/']", function (event) {
					var href = $(event.currentTarget).attr('href');

					//# chain 'or's for other black list routes
					var passThrough = href.indexOf('sign_out') >= 0;
					//# Allow shift+click for new tabs, etc.
					if (!passThrough && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
						event.preventDefault();
						//# Remove leading slashes and hash bangs (backward compatablility)
						var url = href.replace(/^\//, '').replace('#!\/', '');
						//# Instruct Backbone to trigger routing events
						tobserver.utils.history.navigate(url, {
							trigger: true
						});
						return false;
					}
				});
				tobserver.on(this.path, function () {
					var url = tobserver.getData(tobserver.utils.history.path);
					tobserver.utils.router.route(url);
				});
				if (!this.options.silent) return this.loadUrl();
			};

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
			History.prototype.checkUrl = function () {
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
				if (!options || options === true) options = {
					trigger: !!options
				};

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
				} else
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
			};
			// Create the default Backbone.history.
			return new History();
		}(),
		/**
		 *  the router modul from Grapnel, but a lot simplefied, and observing the same URL Property as the historyModul.
		 * @param {String} elementPath
		 * @param {String} arrayPath
		 */
		router: (function (root) {
			function Grapnel() {
				this.events = []; // Event Listeners
				this.params = []; // Named parameters
			}
			Grapnel.prototype.version = '0.4.2'; // Version
			/**
			 * Fire an event listener
			 *
			 * @param {String} event
			 * @param {Mixed} [attributes] Parameters that will be applied to event listener
			 * @return self
			 */
			Grapnel.prototype.route = function (url) {
				var params = Array.prototype.slice.call(arguments, 1);
				// Call matching events
				this.events.forEach(function (fn) {
					fn.apply(this, params);
				});
				return this;
			};
			/**
			 * Create a RegExp Route from a string
			 * This is the heart of the router and I've made it as small as possible!
			 *
			 * @param {String} Path of route
			 * @param {Array} Array of keys to fill
			 * @param {Bool} Case sensitive comparison
			 * @param {Bool} Strict mode
			 */
			Grapnel.regexRoute = function (path, keys, sensitive, strict) {
				if (path instanceof RegExp)
					return path;
				if (path instanceof Array)
					path = '(' + path.join('|') + ')';
				// Build route RegExp
				path = path.concat(strict ? '' : '/?')
					.replace(/\/\(/g, '(?:/')
					.replace(/\+/g, '__plus__')
					.replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?/g, function (_, slash, format, key, capture, optional) {
						keys.push({
							name: key,
							optional: !!optional
						});
						slash = slash || '';

						return '' + (optional ? '' : slash) + '(?:' + (optional ? slash : '') + (format || '') + (capture || (format && '([^/.]+?)' || '([^/]+?)')) + ')' + (optional || '');
					})
					.replace(/([\/.])/g, '\\$1')
					.replace(/__plus__/g, '(.+)')
					.replace(/\*/g, '(.*)');

				return new RegExp('^' + path + '$', sensitive ? '' : 'i');
			};
			/**
			 * Add an action and handler
			 *
			 * @param {String|RegExp} action name
			 * @param {Function} callback
			 * @return self
			 */
			Grapnel.prototype.on = Grapnel.prototype.add = Grapnel.prototype.get = function (route, handler) {
				var that = this,
					keys = [],
					regex = Grapnel.regexRoute(route, keys);

				var invoke = function (url) {
					// If action is instance of RegEx, match the action
					var match = window.url.match(regex);
					// Test matches against current action
					if (match) {
						// Match found
						var event = {
							route: route,
							value: url,
							handler: handler,
							params: that.params,
							regex: match,
							propagateEvent: true,
							preventDefault: function () {
								this.propagateEvent = false;
							}
						};
						// Callback
						var req = {
							params: {},
							keys: keys,
							matches: event.regex.slice(1)
						};
						// Build parameters
						req.matches.forEach(function (value, i) {
							var key = (keys[i] && keys[i].name) ? keys[i].name : i;
							// Parameter key will be its key or the iteration index. This is useful if a wildcard (*) is matched
							req.params[key] = (value) ? decodeURIComponent(value) : undefined;
						});
						// Call handler
						handler.call(that, req, event);
					}
					// Returns that
					return that;
				};
				// Invoke and add listeners -- this uses less code
				this.events.push(invoke);
				return this;
			};
			return new Grapnel();
		}).call({}, window),
		bindEvent: function bindEvent(el, eventName, eventHandler) {
			if (el.addEventListener)
				el.addEventListener(eventName, eventHandler, false);
			else if (el.attachEvent)
				el.attachEvent('on' + eventName, eventHandler);
		},
		/**
		 * set a socket, an jQuerySocket or SocketIO-Socket or SocketIO-Namespace.
		 * the socket will be used to tell the server all the changes that are made on the data.
		 */
		setSocket:function(socket){
			tobserver.notifyee.socket=socket;
			socket.on('tOmand', function(msg){
				try{
					var msgO=JSON.parse(msg);
					if(!tobserver.notifyee.isLocal(msgO.path))
						tobserver.set(
							msgO.path,
							msgO.data,
							msgO.run,
							false
						);
				}catch(e){}
			});
		},
		/**
		 * An JQuerySocket - class, that can be used as a socket. 
		 * requires jQuery do send all changes on the data to the server,
		 * for example an php-server. on node it is recommented to use socket.io
		 * 
		 */
		jQuerySocket:function JQuerySocket(file){
			this.emit=function emit(name,data){
				$.post(file,{name:name,data:data});
			}
		}
	};


	var tobserver = new Tobservable(window);

	return tobserver;
})(typeof window==="object"?window:{},typeof document==="object"?document:{});

// Window or AMD-module
if(typeof module === 'object'){
	module.exports = tobserver;
}else if(window instanceof Window){
	tobserver.utils.bindEvent(window, 'load', function () {
		var style = document.createElement("style");
		style.innerHTML = ".tobserverlistitem{margin:0px;	padding:0px;}";
		document.getElementsByTagName("head")[0].appendChild(style);
		tobserver.StdElementView.initDomViews();
	});
}
