/**
 * @fileOverview
 * @author Tobias Nickel
 * @version 0.9
 */

// the only global Tobservable caring about the window object
var tobserver = (function (window, document, undefined) {
    /**
     * @class
     * Tobservable Class that handle the data
     * @param {mixed} pData the data to observe
     * @param {tobservable} pObserverTree the root observertree (used internally)
     * @param {String} pPath the path of the data that is the current observer is careing about
     */
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
    Tobservable.prototype.set = function (pPath, value, run) {
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
                if (this.data[name] !== value) {
                    this.data[name] = value;
                    this.notify(name);
                }
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
    Tobservable.prototype.exec=
    Tobservable.prototype.run = function (pPath, value) {
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
    Tobservable.prototype.addNameToPath = function (path, name) {
        return path === '' ? name : path + '.' + name;
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
    Tobservable.prototype.on = function (pPath, tObserver) {
        if (tObserver === undefined) return;
        tObserver = typeof tObserver == 'function' ? {
            update: tObserver
        } : tObserver;
        this.observer.addListener(tObserver, pPath);
    };

    /**
     * remove the described observer
     * @param {type} path
     *      tha data-path to the observer, where the last part is the name
     * @returns {void}
     */
    Tobservable.prototype.off = function (path, tObserver) {
        this.observer.removeListener(path, tObserver);
    };

    /**
     * used to tell all observer on the given path to update there view
     * @param {type} path
     * @returns {undefined}
     */
    Tobservable.prototype.notify = function (path, round) {
        if (path === undefined) path = "";
        if (round === undefined) round = new Date().getTime() + "" + Math.random();;
        path = this.addNameToPath(this.path, path);
        if (this.notifyee.paths.indexOf(path) !== -1) return;
        this.notifyee.paths.push(path);
        tobserver.notifyee.round = round;
        clearTimeout(tobserver.notifyee.timeout);
        tobserver.notifyee.timeout =
            setTimeout(function () {
                tobserver.notifyee.notify(round)
            }, 10);
    };

    Tobservable.prototype.notifyee = {
        notify: function (round) {
            if (this.round == round) {
                var paths = this.paths;
                this.paths = [];
                for (var i in paths)
                    tobserver.observer.runUpdate(paths[i], this.round);
            }
        },
        round: 0,
        paths: [],
        timeout: 0
    }

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
            if (pNextPath === undefined)
                pNextPath = '';

            if (pObserver !== undefined)
                if (pNextPath === '')
                    this.$listener.push(pObserver);
                else
                    this.addListener(pObserver, pNextPath);
        }
        //to add a Listener to the tree
        ObserverTree.prototype.addListener = function (pListener, pPath) {
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
        ObserverTree.prototype.runUpdate = function runUpdate(pPath, round) {
            if (round === undefined) round = new Date().getTime() + "" + Math.random();
            if (pPath === undefined)
                pPath = '';
            var pathParts = this.removeEmptyStrings(pPath.split('.'));
            //update the listener on the current node
            for (var ii in this.$listener)
                if (this.$listener[ii].tNotificationRoundNumber != round) {
                    this.$listener[ii].tNotificationRoundNumber = round;
                    this.$listener[ii].update(round, pathParts);
                }
                //go through the path

            if (pathParts.length > 0) {
                var PropName = this.toProertyname(pathParts[0]);
                if (this[PropName] !== undefined) {
                    pathParts.splice(0, 1); //TODO
                    this[PropName].runUpdate(mergeToPath(pathParts), round);
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
            if (typeof (pPath) === "undefined")
                pPath = '';
            var pathParts = pPath.split('.');
            pathParts = this.removeEmptyStrings(pathParts);
            var PropName = this.toProertyname(pathParts[0]);
            if (pathParts.length > 1 || (tObserver !== undefined && pathParts.length > 0)) {

                pathParts.shift();
                if (typeof (this[PropName]) !== 'undefined')
                    this[PropName].removeListener(mergeToPath(pathParts), tObserver);
            } else
            if (pathParts.length === 1 && this[pathParts[0]] !== undefined) {
                for (var i in this.$listener)
                    if (typeof this.$listener[i].name === 'string' && this.$listener[i].name === PropName)
                        this.$listener.splice(i, 1);
            } else
            if (tObserver !== undefined)
                for (var ii = 0; ii < this.$listener.length; ii++)
                    if (this.$listener[ii] === tObserver || this.$listener[ii].update === tObserver)
                        this.$listener.splice(ii, 1);

        };
        //remove all "" strings
        ObserverTree.prototype.removeEmptyStrings = function removeEmptyStrings(array) {
            while (array.indexOf('') !== -1)
                array.splice(array.indexOf(''), 1);
            return array;
        };
        //remove all "" strings
        ObserverTree.prototype.removeEmptyStrings = function removeEmptyStrings(array) {
            while (array.indexOf('') !== -1)
                array.splice(array.indexOf(''), 1);
            return array;
        };

        ObserverTree.prototype.toProertyname = function toProertyname(name) {
            return '_t_' + name;
        };
        return ObserverTree;
    })();

    /**
     * the name of the HTML-class for the elements that are going to became updated by std views
     * @type String
     */
    Tobservable.prototype.stdClassName = "tObserver";

    /**
     * get all HTML objects with the given klass, and makes a view with them.
     * if also register observer ther on the DOM to create StdViews for the elements that are new Created
     * @returns {undefined}
     */
    Tobservable.prototype.initDomViews = function () {
        // liveupdate in the dom
        tobserver.utils.bindEvent(document, 'DOMNodeInserted', function (ev) {
            var element = ev.srcElement;
            tobserver.findTObserver(element);
        });
        //document.addEventListener('DOMNodeInserted',);
        tobserver.utils.bindEvent(document, 'DOMNodeRemoved', function (ev) {
            if (ev.srcElement !== undefined && ev.srcElement.getAttribute !== undefined)
                setTimeout(function () {
                    //var element=ev.srcElement;
                    var attr = getAttr(ev.srcElement);
                    if (attr !== undefined && ev.srcElement._tName !== undefined) {
                        var tPath = attr.path;
                        tPath = tPath !== undefined ? tPath : "";
                        tobserver.off(tPath + "." + ev.srcElement._tName);
                    }
                }, 1000);
        });
        this.findTObserver();
    };
    Tobservable.prototype.findTObserver = function (element) {
        if (element === undefined) {
            element = document.getElementsByTagName("html")[0];
        }
        var attr = getAttr(element);
        var kids = element.children;
        if (attr === null)
            for (var s in kids)
                tobserver.findTObserver(kids[s]);
        else {
            element.attr = attr;
            new tobserver.StdElementView(element, this);

        }
    };

    /**
     * the stdView, that is used for document-nodes
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
            //todo: parse the tobserver-attr as {JSON}
            //var attr=element.getAttribute("tObserver");
            var attr = getAttr(element);
            if (attr === null) return;
            if (element._tName !== undefined) return;
            //attr=eval("({"+attr+"})");
            attr.outer = attr.outer !== undefined ? attr.outer : "div";
            //attr.path=attr.path[attr.path.length-1]=='.'?
            //	attr.path.slice(0,attr.path.length-1):attr.path;
            attr.path = attr.path === '' ? 'window' : attr.path;

            this.element = element;
            attr.defaultValue = [];
            attr.preview = [];
            for (var i in attr.type) {
                if (attr.type[i] === "htmlList" || attr.type === "htmlOption") {
                    attr.defaultValue[i] = element.innerHTML;
                    attr.preview[i] = this.element.innerHTML;
                    this.element.innerHTML = "";
                } else {
                    attr.defaultValue[i] = element.getAttribute(attr.type);
                }
                if (attr.type[i] === "value") {
                    this.folowElement(element)
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
            for (var i in attr.path)
                tobserver.on(attr.path[i], this);
            this.update();
        }
        /**
         *	the standard updatemethod, called by the tObserver
         */
        StdElementView.prototype.update = function () {
            var type = undefined;
            var filter = undefined;
            for (var i in this.attr.path) {
                var v = tobserver.get(this.attr.path[i]).data;
                v = typeof v === "number" ? v + "" : v;
                var orgData = v;

                filter = this.attr.filter[i] === undefined ? filter : this.attr.filter[i];
                if (filter !== undefined)
                    v = filter(v);
                v = v !== undefined ? v : this.attr.defaultValue;
                type = this.attr.type[i] === undefined ? type : this.attr.type[i];
                switch (type) {
                case 'innerHTML':
                case undefined:
                    if (this.element.innerHTML != v) {
                        this.element.innerHTML = v;
                        this.attr.afterUpdate(this.element);
                    }
                    break;
                case 'htmlList':
                    this.updateList(v, orgData);
                    break;
                case 'htmlOption':
                    this.updateOption(v, orgData);
                    break;
                case 'value':
                    if (this.element.value == v)
                        return;
                    this.element.value = v;
                default:
                    if (this.element.getAttribute(type) == v)
                        return;
                    this.element.setAttribute(type, v);
                }
            }
        };
        StdElementView.prototype.updateOption = function updateList(data, orgData) {
            if (data === false) {
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
        StdElementView.prototype.updateList = function updateList(data, orgData) {
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
                        if (e !== undefined) {
                            e.remove();
                            i--;
                        }
                    });
                } else {
                    this.attr.beforeUpdate(kids[i], function () {});
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
            var focussedElement=document.activeElement;
            displayedElements.sort(function (a, b) {
                return a.position - b.position;
            });
            for (i = 0; i < displayedElements.length; i++) {
                this.element.appendChild(displayedElements[i]);
            }
            focussedElement.focus();

            //appendNewElements
            var listIndex = 0;
            if (orgData === undefined) return;
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

                        tobserver.findTObserver(kid);
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
        StdElementView.prototype.findAndUpdatePath = function findAndUpdatePath(element, root) {
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
            if (attr.path === undefined) attr.path = [""];
            for (var i in attr.path) {
                if (attr.path[i].indexOf(root) == -1)
                    attr.path[i] = root + "." + attr.path[i];
            }

        };
        /**
         *	similar	to findAndUpdatePath, but findAndUpdatePath, only can be used for the initialisation of the object.
         */
        StdElementView.prototype.updateRootPath = function updateRootPath(element, newRootPath, oldRootPath) {
            if (element === undefined) return;
            if (newRootPath === undefined) return;
            if (oldRootPath === undefined) return;
            var kids = element.children;
            for (var i in kids) {
                if (kids[i].attr !== undefined) {
                    for (var ii in kids[i].attr.path) {
                        var realOrgPath = kids[i].attr.path[ii].replace(oldRootPath + '.', '');
                        if (kids[i].attr.type == 'htmlList') {
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
                    if (attr.type[i] === "value"){
                        var value=element.value;
                        if(element.getAttribute("type").toLocaleLowerCase().trim()==="number")
                            value=parseFloat(value);
                        tobserver.set(attr.path[i], element.value);
                        
                    }
                }
            };
            element.addEventListener("change", change);
            element.addEventListener("keyup", change);
        }
        return StdElementView;
    }();

    /**
     * @parem e the dom node
     */
    function getAttr(element) {
        if (element.attr !== undefined) return element.attr;

        var attr = element.getAttribute === undefined ? null : element.getAttribute("tObserver");
        if (attr === null) return null;
        try{
            attr = eval("({" + attr + "})");
        }catch(e){
            attr = eval("(" + attr + ")");
        }
        if (attr.path === undefined) attr.path = [""];
        if (!Array.isArray(attr.path)) attr.path = [attr.path]
        for (var i in attr.path) {
            attr.path[i] = attr.path[i][attr.path[i].length - 1] == '.' ?
                attr.path[i].slice(0, attr.path[i].length - 1) : attr.path[i];
            attr.path[i] = attr.path[i] === '' ? '' : attr.path[i];
        }
        if (!Array.isArray(attr.type)) attr.type = [attr.type];
        if (!Array.isArray(attr.filter)) attr.filter = [attr.filter];
        element.attr = attr;
        return attr;
    }
    Tobservable.prototype.utils = {
        stdViewBehavior: function () {
            var emptyFunction = function () {},
                callSecoundF = function (e, f) {
                    f(e);
                };
            return {
                beforeAdd: emptyFunction,
                afterAdd: emptyFunction,
                beforeRemove: callSecoundF,
                afterRemove: emptyFunction,
                beforeUpdate: callSecoundF,
                afterUpdate: emptyFunction
            };
        }(),
        /**
         * @param {String} sourcePath 
         * @param {String} destPath 
         */
        linkViews: function (sourcePath, destPath) {
            tobserver.on(sourcePath, new this.LinkView(destPath));
            tobserver.on(destPath, new this.LinkView(sourcePath));

        },
        /**
         * @param {String} elementPath 
         * @param {String} destPath 
         */
        linkToArrayViews: function (elementPath, arrayPath) {
            tobserver.on(elementPath, new this.LinkToArrayView(elementPath, arrayPath));
            tobserver.on(arrayPath, new this.LinkFromArrayView(elementPath, arrayPath));
        },
        /**
         *  constructor for LinkView
         * @param {String} destPath 
         */
        LinkView: function LinkView(destPath) {
            this.update = function updateLinkView(round) {
                tobserver.notify(destPath, round);
            };
        },
        /**
         *  constructor for LinkToArrayView
         * @param {String} elementPath 
         * @param {String} arrayPath 
         */
        LinkToArrayView: function LinkToArrayView(elementPath, arrayPath) {
            this.update = function updateLinkView(round) {
                var sourceData = tobserver.get(elementPath).data;
                var array = tobserver.get(arrayPath).data;
                tobserver.notify(arrayPath + "." + array.indexOf(sourceData), round);
            };
        },
        /**
         *  constructor for LinkFromArrayView
         * @param {String} elementPath 
         * @param {String} arrayPath 
         */
        LinkFromArrayView: function LinkFromArrayView(elementPath, arrayPath) {
            this.update = function updateLinkView(round, pathParts) {
                var sourceData = tobserver.get(elementPath).data;
                var array = tobserver.get(arrayPath).data;
                if (pathParts[0] !== undefined) {
                    if (array[pathParts[0]] !== sourceData) {
                        tobserver.notify(elementPath, round);
                    }
                } else tobserver.notify(elementPath, round);
            };
        },
        /**
         *  constructor for ArrayUpdateView
         *  @param {String} arrayPath 
         *  @param {Object} computeProperty 
         */
        ArrayUpdateView:function(arrayPath,computeProperty){
            this.update=function(round,nextPathparts){
                if(nextPathparts[0]!==undefined && nextPathparts[1]!==undefined){
                    var index=nextPathparts.splice(0,1);
                    var paramName=nextPathparts.splice(0,1);
                    var newSetValue = tobserver.get(arrayPath+"."+index+"."+paramName).data;
                    computeProperty[paramName](arrayPath+"."+index,newSetValue,nextPathparts)
                }
            }
        },
        /**
         *  creates an ArrayUpdateView and binds it to the path.
         *  @param {String} path 
         *  @param {Object} computeProperty 
         */
        registerArrayUpdateView:function(path,updateObject){
            tobserver.on(path,new tobserver.utils.ArrayUpdateView(path,updateObject));
        },
        /**
         *  constructor for ObjectUpdateView
         *  @param {String} objectPath 
         *  @param {Object} computeProperty 
         */
        ObjectUpdateView:function(objectPath,computeProperty){
            this.update=function(round,nextPathparts){
                if(nextPathparts[0]!==undefined ){
                    var paramName=nextPathparts.splice(0,1);
                    var newSetValue = tobserver.get(arrayPath+"."+paramName).data;
                    computeProperty[paramName](arrayPath,newSetValue,nextPathparts)
                }
            }
        },
        /**
         *  creates an ObjectUpdateView and binds it to the path.
         *  @param {String} path 
         *  @param {Object} computeProperty 
         */
        registerObjectUpdateView:function(path,updateObject){
            tobserver.on(path,new tobserver.utils.ObjectUpdateView(path,updateObject));
        },
        /**
         *  the history modul from backbone, changed, that it just updates an URL property on via tobserver.
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
                    var url = tobserver.get(tobserver.utils.history.path).data;
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
            "use strict";

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
            return new Grapnel;
        }).call({}, window),
        bindEvent: function bindEvent(el, eventName, eventHandler) {
            if (el.addEventListener)
                el.addEventListener(eventName, eventHandler, false);
            else if (el.attachEvent)
                el.attachEvent('on' + eventName, eventHandler);
        }
    };

    /**
     * merges a array of names to a path
     * @private
     * @param {Array} array
     *      an array containing strings with the names
     * @returns {String}
     */
    var mergeToPath = function (array) {
        var out = '';
        for (var ii = 0; ii < array.length; ii++)
            out += (out === '' ? '' : '.') + array[ii];
        return out;
    };

    var tobserver= new Tobservable(window);
    return tobserver;
})(window, document);

tobserver.utils.bindEvent(window, 'load', function () {
    var style = document.createElement("style");
    style.innerHTML = ".tobserverlistitem{margin:0px;	padding:0px;}";
    document.getElementsByTagName("head")[0].appendChild(style);
    tobserver.initDomViews();
});