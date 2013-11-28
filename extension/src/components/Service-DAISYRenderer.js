function DAISYXHTMLContext(renderer,book,target) {
   this.renderer = renderer;
   this.book = book;
   this.target = target;
}

DAISYXHTMLContext.prototype.show = function(xmlDoc) {
   if (!xmlDoc) {
      var entry = this.book.findByMediaType("application/x-dtbook+xml");
      if (!entry) {
         throw "Cannot find dtbook type in manifest.";
      }
      var url = entry.resolve();
      HTTP("GET",url.spec,{
         synchronizedRequest: true,
         overrideMimeType: "text/xml",
         onSuccess: function(status,doc) {
            xmlDoc = doc;
         },
         onFailure: function(status,doc) {
            DAISYService.console.log("Cannot load XML document "+url.spec+", status="+status);
         }
      });
   }
   if (!xmlDoc) {
      throw "Cannot load XML document from book.";
   }

   var sbase = xmlDoc.baseURI;
   for (var i=sbase.length-1; i>0 && sbase.charAt(i)!='/'; i--);
   if (i>0) {
      sbase = sbase.substring(0,i+1);
   }

   this.renderer.xhtmlTransform.setParameter("","base-uri",sbase);
   this.renderer.xhtmlTransform.setParameter("","no-images",this.renderer.service.showImages ? "" : "true");
   var fragment = this.renderer.xhtmlTransform.transformToFragment(xmlDoc,this.target.ownerDocument);
   var node = fragment.firstChild;
   while (node) {
      this.target.appendChild(node);
      node = node.nextSibling;
   }
   if (this.onload) {
      this.onload();
   }
   return true;
}

function DAISYGalleyContext(renderer,book,target,soundManager) {
   this.index = 0;
   this.renderer = renderer;
   this.book = book;
   this.length = this.book.spine.length;
   this.target = target;
   this.soundManager = soundManager;
   this.sound = true;
   this.focusFollow = true;
   this.currentSpine = -1;
   this.generateSMIL = false;
   var entry = this.book.findByMediaType("application/x-dtbncx+xml");
   if (!entry) {
      entry = this.book.findByMediaType("application/x-dtbook+xml");
   }
   if (!entry) {
      throw "Cannot find dtbook or ncx type in manifest.";
   }
   this.baseURI = entry.resolve();
   var current = this;
   this.onNextSpine = function() {
      current.next();
   }
   this.onFinish = function() {o
      if (current.onNextSpine) {
         current.onNextSpine();
      }
   };
}

DAISYGalleyContext.prototype.show = function() {
   return this.next();
}

DAISYGalleyContext.prototype.proceed = function() {
   this.context.proceed();
}
DAISYGalleyContext.prototype.previous = function() {
   if (this.generateSMIL) {
      return;
   }
   this.index = this.currentSpine-1;
   if (this.index<0) {
      this.index = 0;
   }
   return this.next();
}

DAISYGalleyContext.prototype.next = function() {

   if (this.generateSMIL && this.currentSpine<0) {
      DOMUtil.getInstance().clearChildren(this.target);
      this.currentSpine = 0;
      this.showGeneratedSMIL();
      return;
   }

   if (this.index>=this.book.spine.length) {
      return false;
   }

   this.currentSpine = this.index;

   DOMUtil.getInstance().clearChildren(this.target);

   var item = this.book.manifest[this.book.spine[this.index]];
   while (!item && this.index<this.book.spine.length) {
      DAISYService.console.log("Missing spine item: "+this.book.spine[i]);
      this.index++;
   }
   this.index++;
   var url = this.baseURI.resolve(item.href);
   this.currentContext = this.renderer.renderSMIL(this,url.spec,this.target,this.soundManager);
   return true;
}

DAISYGalleyContext.prototype.showGeneratedSMIL = function() {
   var smilDoc = this.renderer.generateSMILDocument(this.book);
   if (!smilDoc) {
      throw "Cannot generate SMIL from XML document in book.";
   }

   var entry = this.book.findByMediaType("application/x-dtbook+xml");
   if (!entry) {
      throw "Cannot find dtbook type in manifest.";
   }
   var url = entry.resolve();
   
   this.currentContext = this.renderer.renderSMIL(this,{ document: smilDoc, baseURI: url.spec},this.target,this.soundManager);
}

DAISYGalleyContext.prototype.cancel = function() {
   if (this.currentContext) {
      this.currentContext.cancel();
      this.currentContext = null;
   }
}

DAISYGalleyContext.prototype.toggleSound = function(flag) {
   if (this.context) {
      this.context.options.sound = flag;
   }
   this.sound = flag;
}

DAISYGalleyContext.prototype.toggleFollowPosition = function(flag) {
   if (this.context) {
      this.context.options.focusFollow = flag;
   }
   this.focusFollow = flag;
}

function DAISYRenderer(service)
{
   this.service = service;
   this.smilTransform = null;
   this.xhtmlTransform = null;
}

DAISYRenderer.prototype.setSMILTransform = function(url) {
   this.smilTransform = Components.classes["@mozilla.org/document-transformer;1?type=xslt"].createInstance(Components.interfaces.nsIXSLTProcessor);
   var current = this;
   HTTP("GET",url,{
      synchronizedRequest: true,
      overrideMimeType: "text/xml",
      onSuccess: function(status,doc) {
         try {
            current.smilTransform.importStylesheet(doc);
         } catch (ex) {
            DAISYService.console.log("Cannot load SMIL transform: "+ex);
         }
      },
      onFailure: function(status,doc) {
         DAISYService.console.log("Cannot load SMIL transform document "+url+", status="+status);
      }
   });
}

DAISYRenderer.prototype.setXHTMLTransform = function(url) {
   this.xhtmlTransform = Components.classes["@mozilla.org/document-transformer;1?type=xslt"].createInstance(Components.interfaces.nsIXSLTProcessor);
   var current = this;
   HTTP("GET",url,{
      synchronizedRequest: true,
      overrideMimeType: "text/xml",
      onSuccess: function(status,doc) {
         try {
            current.xhtmlTransform.importStylesheet(doc);
         } catch (ex) {
            DAISYService.console.log("Cannot load XHTML transform: "+ex);
         }
      },
      onFailure: function(status,doc) {
         DAISYService.console.log("Cannot load XHTML transform document "+url+", status="+status);
      }
   });
}

DAISYRenderer.prototype.generateSMILDocument = function(book) {
   var entry = book.findByMediaType("application/x-dtbook+xml");
   if (!entry) {
      throw "Cannot find dtbook type in manifest.";
   }
   var url = entry.resolve();
   this.smilTransform.setParameter("","base-uri",url.spec);
   var xmlDoc = null;
   HTTP("GET",url.spec,{
      synchronizedRequest: true,
      overrideMimeType: "text/xml",
      onSuccess: function(status,doc) {
         xmlDoc = doc;
      },
      onFailure: function(status,doc) {
         DAISYService.console.log("Cannot load XML document "+url.spec+", status="+status);
      }
   });
   if (!xmlDoc) {
      throw "Cannot load XML document "+url.spec+" from book.";
   }

   var smilDoc = this.smilTransform.transformToDocument(xmlDoc);
   if (DAISYService.preferences.debug) {
      var serializer = new XMLSerializer();
      DAISYService.console.debug(serializer.serializeToString(smilDoc));
   }
   return smilDoc;
}


DAISYRenderer.prototype.galleyRender = function(book,target,soundManager) {
   return new DAISYGalleyContext(this,book,target,soundManager);
}

DAISYRenderer.prototype.xhtmlRender = function(book,target) {
   return new DAISYXHTMLContext(this,book,target);
}

DAISYRenderer.prototype.renderSMIL = function(renderContext,object,region,soundManager) {
   var smilDoc = typeof object == "string" ? null : object.document;
   var baseURI = typeof object == "string" ? object : object.baseURI;
   if (!smilDoc) {
      HTTP("GET",object, {
         overrideMimeType: "text/xml",
         synchronizedRequest: true,
         onSuccess: function(status,xml,text) {
            smilDoc = xml;
         },
         onFailure: function(status) {
            throw "Cannot get smil document from "+object+", status="+status;
         }
      });
   }
   var smil = this.service.smil.load(smilDoc);
   var current = this;
   renderContext.document = smil;
   var context = current.service.smil.createContext(region,null,{
      onWaitForUserEscape: renderContext.onWaitForUserEscape,
      onFinish: renderContext.onFinish,
      sound: renderContext.sound,
      focusFollow: renderContext.focusFollow,
      resourceManager: current.service.smil.createResourceManager(baseURI),
      soundManager: soundManager
   });
   renderContext.context = context;
   smil.play(context);
   return context;
}

DAISYRenderer.prototype.createNavigationContext = function(book,navigation,options) {
   return new DAISYNavigationContext(this,book,navigation,options);
}

function DAISYNavigationContext(renderer,book,navigation,options) {
   this.renderer = renderer;
   this.book = book;
   this.navigation = navigation;
   this.smilCache = {};
   this.options = options;
   this.quirky = false;
   var entry = this.book.findByMediaType("application/x-dtbncx+xml");
   if (!entry) {
      entry = this.book.findByMediaType("application/x-dtbook+xml");
   }
   if (!entry) {
      throw "Cannot find dtbook or ncx type in manifest.";
   }
   this.baseURI = entry.resolve();
   this.console = DAISYService.console;
}

DAISYNavigationContext.prototype.getSMIL = function(name) {
   var obj = this.smilCache[name];
   if (!obj) {
      var url = this.baseURI.resolve(name);
      var smilDoc = null;
      HTTP("GET",url.spec, {
         overrideMimeType: "text/xml",
         synchronizedRequest: true,
         onSuccess: function(status,xml,text) {
            smilDoc = xml;
         },
         onFailure: function(status) {
            throw "Cannot get smil document from "+url.spec+", status="+status;
         }
      });
      if (!smilDoc) {
         throw "Cannot get smil document for "+name;
      }
      var smilObj = this.renderer.service.smil.load(smilDoc);
      this.quirky = this.quirky || smilObj.quirky;
      obj = {
         smil: smilObj,
         resourceManager: this.renderer.service.smil.createResourceManager(url.spec)
      };
      this.smilCache[name] = obj;
   }
   return obj;
}

DAISYNavigationContext.findPosY = function(obj) {
   var curtop = 0;
   if (obj.offsetParent) {
      while (obj.offsetParent) {
         curtop += obj.offsetTop;
         obj = obj.offsetParent;
      }
   } else if (obj.y) {
      curtop += obj.y;
   }
   return curtop;
}

DAISYNavigationContext.prototype.moveToPage = function(page,focus,hash) {
   var pageNo = ""+page;
   var element = this.document.defaultView.pages[page];
   if (!element) {
      DAISYService.console.log("Cannot find element for page "+page);
      return;
   }
   var id = element.getAttribute("id");
   if (id) {
      //DAISYService.console.log("Move to id: "+id);
      if (focus) {
         element.focus();
      }
      if (hash) {
         this.document.defaultView.location.hash = "#"+id;
      }
      this.moveTo(id);
      return id;
   } else {
      DAISYService.console.log("Page target does not have an id.");
      return null;
   }
}

DAISYNavigationContext.prototype.moveTo = function(id,offset) {
   var target = this.document.getElementById(id);
   if (target) {
      var y = DAISYNavigationContext.findPosY(target);
      if (offset) {
         y += offset;
      } else {
         //y -= 30;
      }
      target.ownerDocument.defaultView.scroll(0,y);
      //target.focus();
   } else {
      DAISYService.console.log("Cannot find element with id "+id);
   }
}

DAISYNavigationContext.prototype.stop = function() {
   if (this.playContext) {
      this.playContext.cancel();
      this.playContext = null;
   }
}

DAISYNavigationContext.prototype.seek = function(id)
{
   var target = this.document.getElementById(id);
   if (target) {
      var smilref = target.ownerDocument.defaultView.smilref[id]
      if (!smilref) {
         DAISYService.console.log("Cannot find smilref for #"+id);
         return false;
      }
      /*
      var smilObj = null;
      var smilTarget = null;
      for (var mid in this.book.manifest) {
         var item = this.book.manifest[mid];
         if (item.mediaType.indexOf("application/smil")==0) {
            smilObj = this.getSMIL(item.href);
            smilTarget = smilObj.smil.objects[id];
            if (!smilTarget) {
               smilObj = null;
            } else {
               break;
            }
         }
      }
      */
      /*
      var smilObj = this.getSMIL(this.currentPoint.content.href);
      var smilTarget = smilObj.smil.objects[id];
      */
      var hashPos = smilref.indexOf("#");
      var href = smilref.substring(0,hashPos);
      var smilId = smilref.substring(hashPos+1);
      var smilObj = this.getSMIL(href);
      var smilTarget = smilObj.smil.objects[smilId];
      if (!smilTarget) {
         DAISYService.console.log("Cannot find #"+smilId+" in SMIL "+href+" for target #"+id);
         return false;
      }
      DAISYService.console.log("Playing #"+smilId+" in SMIL "+href+" for target #"+id);
      this._playTarget(target,smilObj,smilTarget);
      return true;
   }
   return false;
}

DAISYNavigationContext.prototype.play = function(navPoint) {
   if (navPoint) {
      this.currentPoint = navPoint;
   } else if (this.currentPoint) {
      navPoint = this.currentPoint;
   } else {
      return false;
   }
   var target = this.document.getElementById(navPoint.content.id);
   if (target) {
      var smilObj = this.getSMIL(navPoint.content.href);
      var smilTarget = smilObj.smil.objects[navPoint.content.id];
      if (!smilTarget) {
         //throw "Cannot find target "+navPoint.content.id+" in SMIL "+navPoint.content.href;
         return false;
      }
      this._playTarget(target,smilObj,smilTarget);
      return true;
   } else {
      return false;
   }
}

DAISYNavigationContext.prototype._playTarget = function(target,smilObj,smilTarget) {
   var current = this;
   var currentOnFinish = this.options.onFinish;
   var newOptions = {
      onFinish: function() {
         DAISYService.console.debug("play context onFinish called for point: "+smilTarget.id);
         current.playContext = null;
         if (currentOnFinish) {
            currentOnFinish();
         }
      }
   };
   for (var id in this.options) {
      newOptions[id] = this.options[id];
   }
   this.playContext = this.renderer.service.smil.createContext(target,smilTarget.parent,newOptions);
   this.playContext.resourceManager = smilObj.resourceManager;
   this.playContext.options.navigateOnly = true;
   var topContext = this.playContext;
   while (topContext.parent) {
      topContext = topContext.parent;
   }
   topContext.top = true;
   for (var index=0; index<smilTarget.parent.children.length; index++) {
      if (smilTarget.parent.children[index].id==smilTarget.id) {
         smilTarget.parent.restart(this.playContext,index);
         break;
      }
   }
}

DAISYNavigationContext.prototype.next = function(noPlay) {
   while (this.currentPoint && !this.currentPoint.next) {
      this.currentPoint = this.currentPoint.parent;
   }
   if (this.currentPoint && this.currentPoint.next) {
      this.currentPoint = this.currentPoint.next;
      if (!noPlay) {
         this.play();
         return 1;
      } else {
         return 2;
      }
   } else {
      return 0;
   }
}

DAISYNavigationContext.prototype.previous = function(noPlay) {
   while (this.currentPoint && !this.currentPoint.previous) {
      this.currentPoint = this.currentPoint.parent;
   }
   if (this.currentPoint && this.currentPoint.previous) {
      this.currentPoint = this.currentPoint.previous;
      if (!noPlay) {
         this.play();
         return 1;
      } else {
         return 2;
      }
   } else {
      return 0;
   }
}



