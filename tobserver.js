function tobservable(pData,pObserverTree,pPath){
	if(!pData){pData={}}
	if(!pObserverTree){pObserverTree=new observerTree();}
	if(!pPath){pPath=''}

	var that=this;
    this.data=pData; // the ProgrammData
	this.observer=pObserverTree; 
	this.path=pPath;  
	
	this.get = function(pPath){
		var pathParts=(pPath+'').split('.');
		var name=pPath;
		if(pathParts.length==0){
			return this;
		} else {
			if(pathParts.length==1){
				name=pathParts[0];
				return new tobservable(
					that.data[name],
					that.observer,
					addNameToPath(that.path,name)
				);
			} else{
				name=pathParts[0];
				pathParts.splice(0,1);
				return new tobservable(that.data[name],that.observer,addNameToPath(that.path,name),that.rootTobservable).get(mergeToPath(pathParts));
			}
		}
	}
	this.set = function(pPath,value,run){
		
		var pathParts=(pPath+'').split('.');
		var name=pPath;
		if(pathParts.length==0){return 0;}
		if(pathParts.length==1){
			if(run){
				var out=that.data[name].apply(that.data,value);
				that.notify(name);
				return out;
			}else{
				that.data[name]=value;
				that.notify(name);
				return this;
			}
		}else{
			name=pathParts.pop();
			that.get(mergeToPath(pathParts)).set(name,value,run)
		}
	}
	this.run=function(pPath,value){
		that.set(pPath,value,true);
	}
	this.registerObserver=function(tObserver, pPath){
		that.observer.addListener(tObserver,pPath);
		that.notify(pPath);
	}
	//remove the listener on the given path, where the last value is the name property of the observable, 
	//if it is not existing, it nothing will get removed.
	this.removeObserver=function(path){
		that.observer.removeListener(that.observer,path);
	}
	
	this.notify = function(path){
			that.observer.runUpdate(that.observer,addNameToPath(that.path,path));
	}
	
	function addNameToPath(path,name){
		var out=path;
		if(out==''){out=name;}
		else{out+='.'+name;}
		return out;
	}
	
	// merges a array of names to a path
	function mergeToPath(array){
		var out='';
		for(ii=0;ii<array.length;ii++){
			if(out==''){ out+=array[ii];
			}else{ out+='.'+array[ii]; }
		}
		return out;
	}
	//---------------------------------------
	// subclass observerTree
	//---------------------------------------
	function observerTree(pObserver,pNextPath){
		var that=this;
		this.$listener=[];
		//to add a Listener to the tree
		this.addListener=function(pListener,pPath){
			var pathParts=pPath.split('.');
			pathParts=removeEmptyStrings(pathParts);
			if(pathParts.length>0){
				var prop=toProertyname(pathParts[0]);
					pathParts.shift();
				if(typeof(that[prop])=="undefined"){
					that[prop]=new observerTree(pListener,mergeToPath(pathParts));
				}else{
					that[prop].addListener(pListener,mergeToPath(pathParts));
				}
			}else{
				that.$listener.push(pListener);
			}
		}
		// remove the Listener, that 
		this.removeListener=function(pListener,pPath){
		    if(typeof(pPath)=="undefined"){pPath='';}
			var pathParts=pPath.split('.');
			pathParts=removeEmptyStrings(pathParts);
			if(pathParts.length>1){
				var PropName=toProertyname(pathParts[0]);
				pathParts.shift();
				if(typeof(that[PropName])!='undefined'){
					that[PropName].runUpdate(pListener,mergeToPath(pathParts));
				}
			}else{
				if(pathParts.length==1){
					var PropName=pathParts[0];
					if(typeof(that[PropName])!='undefined'){
						for(ii in that.$listener){
							if(typeof that.$listener[ii].name === 'string' && that.$listener[ii].name=PropName){
								that.$listener.splice(that.$listener[ii],1);
							}
						}
					}				
				}
			}
		}
		
		this.runUpdate=function(pListener,pPath){
		    if(typeof(pPath)=="undefined"){pPath='';}
			for(ii in that.$listener){
				that.$listener[ii].update();
			}
			var pathParts=pPath.split('.');
			pathParts=removeEmptyStrings(pathParts);
			if(pathParts.length>0){
				var PropName=toProertyname(pathParts[0]);
				pathParts.splice(0,1);//TODO
				if(typeof(that[PropName])!='undefined'){
					that[PropName].runUpdate(pListener,mergeToPath(pathParts));
				}
			}
		}
		// merges a array of names to a path
		function mergeToPath(array){
			var out='';
			for(ii=0;ii<array.length;ii++){
				if(out==''){ out+=array[ii];
				}else{ out+='.'+array[ii]; }
			}
			return out;
		}
		//remove all "" strings
		function removeEmptyStrings(array){
			while(array.indexOf('')!=-1){ array.splice(array.indexOf(''),1);}
			return array;
		}
		function toProertyname(name){
			name='_'+name;
			return name;
		}
		//run initialisation of observertree
		if(typeof(pNextPath)=="undefined"){pNextPath='';}
		if(typeof(pObserver)!="undefined"){
			if(pNextPath==''){
				this.$listener.push(pObserver);
			}else{this.addListener(pObserver,pNextPath);}
		}
	}
	this.stdView=function(node,path,pName){
		var tObservable = that;
		this.name=pName;
		//on Update It Will Update The Node.html()
		this.update=function(){
			node.html(tObservable.get(path).data);
		}
	}
}
