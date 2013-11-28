
SMIL.prototype.createResourceManager = function(baseURI) {
   return new SMILResourceManager(baseURI);
}

SMIL.parMax = 30*60*1000; // 30 minutes

SMIL.NS = "http://www.w3.org/2001/SMIL20/";

SMIL.debug = false;
SMIL.prototype.__defineGetter__("debug",function() {
   return SMIL.debug;
});
SMIL.prototype.__defineSetter__("debug",function(v) {
   SMIL.debug = v ? true : false;
});



SMIL.allowQuirks = true;
SMIL.prototype.__defineGetter__("allowQuirks",function() {
   return SMIL.allowQuirks;
});
SMIL.prototype.__defineSetter__("allowQuirks",function(v) {
   SMIL.allowQuirks = v ? true : false;
});

SMIL.yOffset = -100;

SMIL.textOnlyPause = 2000;
SMIL.prototype.__defineGetter__("textOnlyPause",function() {
   return SMIL.textOnlyPause;
});
SMIL.prototype.__defineSetter__("textOnlyPause",function(v) {
   SMIL.textOnlyPause = v;
});

SMIL.selectHighlight = false;
SMIL.prototype.__defineGetter__("selectHighlight",function() {
   return SMIL.selectHighlight;
});
SMIL.prototype.__defineSetter__("selectHighlight",function(v) {
   SMIL.selectHighlight = v ? true : false;
});


SMIL.console = {
   service: Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService),
   log: function(message) {
      this.service.logStringMessage(message);
   },
   debug: function(message) {
      if (SMIL.debug) {
         this.service.logStringMessage(message);
      }
   }
}

SMIL.importNode = function(ownerDocument,parent,node) {
   switch (node.nodeType) {
      case 1:
         //SMIL.console.debug("Importing {"+node.namespaceURI+"}"+node.localName);
         var e = ownerDocument.createElementNS(node.namespaceURI,node.localName);
         for (var i=0; i<node.attributes.length; i++) {
            var att = node.attributes.item(i);
            e.setAttribute(att.localName,att.nodeValue);
         }
         var child = node.firstChild;
         while (child) {
            SMIL.importNode(ownerDocument,e,child);
            child = child.nextSibling;
         }
         if (parent) {
            parent.appendChild(e);
         }
         return e;
      case 3:
      case 4:
         //SMIL.console.debug("Importing text '"+node.nodeValue+"'");
         var text = ownerDocument.createTextNode(node.nodeValue);
         if (parent) {
            parent.appendChild(text);
         }
   }
}

SMIL.defaultContainer = function(parentNode,className) {
   return parentNode.ownerDocument.createElement(className);
}
SMIL.noContainer = function(parentNode,className) {
   return null;
}
SMIL.classMap = {};
SMIL.classMap["table"] = { create: SMIL.defaultContainer };
SMIL.classMap["tr"] = { create: SMIL.defaultContainer };
SMIL.classMap["th"] = { create: SMIL.defaultContainer };
SMIL.classMap["td"] = { create: SMIL.defaultContainer };

SMIL.findPosY = function(obj) {
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

SMIL.findPosX = function(obj)
{
   var curleft = 0;
   if (obj.offsetParent) {
      while (obj.offsetParent) {
         curleft += obj.offsetLeft;
         obj = obj.offsetParent;
      }
   } else if (obj.x) {
      curleft += obj.x;
   }
   return curleft;
}

SMIL.parseDuration = function(time) {
   var parts = time.split(':');
   var hours = 0;
   var minutes = 0;
   var ms = 0;
   if (parts.length==3) {
      hours = parseInt(parts[0],10);
      minutes = parseInt(parts[1],10);
   } else if (parts.length==2) {
      minutes = parseInt(parts[0],10);
   }
   var pos = parts[parts.length-1].indexOf('.');
   var seconds = parseInt(pos<0 ? parts[parts.length-1] : parts[parts.length-1].substring(0,pos),10);
   if (pos>0) {
      ms = parseInt(parts[parts.length-1].substring(pos+1),10);
   }
   var duration = hours*60*60*1000 + minutes*60*1000 + seconds*1000 + ms;
   return duration;
}

SMIL.loadChild = function(doc,child,allowQuirks) {
   var quirks = SMIL.allowQuirks || allowQuirks;
   if (child.localName=="seq") {
      return SMIL.loadSeq(doc,child,quirks);
   } else if (child.localName=="par") {
      return SMIL.loadPar(doc,child,quirks);
   } else if (child.localName=="text") {
      return SMIL.loadText(doc,child,quirks);
   } else if (child.localName=="audio") {
      return SMIL.loadAudio(doc,child,quirks);
   } else if (child.localName=="img") {
      return SMIL.loadImage(doc,child,quirks);
   } else {
      throw "Unrecognized element "+child.localName;
   }
}

SMIL.loadSeq = function(doc,seqE,allowQuirks) {
   var quirks = SMIL.allowQuirks || allowQuirks;

   var util = DOMUtil.getInstance();

   var seq = new SMILSeq(doc,seqE.getAttribute("id"));
   if (doc && seq.id) {
      doc.objects[seq.id] = seq;
   }
   for (var i=0; i<seqE.attributes.length; i++) {
      var att = seqE.attributes.item(i);
      seq.attributes[att.localName] = att.nodeValue;
   }
   util.forElement(seqE,function(c) {
      var child = SMIL.loadChild(doc,c,quirks);
      seq.children.push(child);
      child.parent = seq;
   });
   return seq;
}

SMIL.loadPar = function(doc,parE,allowQuirks) {
   var quirks = SMIL.allowQuirks || allowQuirks;

   var util = DOMUtil.getInstance();

   var par = new SMILPar(doc,parE.getAttribute("id"));
   if (doc && par.id) {
      doc.objects[par.id] = par;
   }
   for (var i=0; i<parE.attributes.length; i++) {
      var att = parE.attributes.item(i);
      par.attributes[att.localName] = att.nodeValue;
   }
   util.forElement(parE,function(c) {
      var child = SMIL.loadChild(doc,c,quirks);
      par.children.push(child);
      child.parent = par;
   });
   return par;
}

SMIL.loadText = function(doc,textE) {

   var text = new SMILText(doc);
   for (var i=0; i<textE.attributes.length; i++) {
      var att = textE.attributes.item(i);
      text.attributes[att.localName] = att.nodeValue;
   }
   return text;
}

SMIL.loadAudio = function(doc,audioE) {

   var audio = new SMILAudio(doc);
   for (var i=0; i<audioE.attributes.length; i++) {
      var att = audioE.attributes.item(i);
      audio.attributes[att.localName] = att.nodeValue;
   }
   return audio;
}

SMIL.loadImage = function(doc,imgE) {

   var img = new SMILImage(doc);
   for (var i=0; i<imgE.attributes.length; i++) {
      var att = imgE.attributes.item(i);
      img.attributes[att.localName] = att.nodeValue;
   }
   return img;
}

SMIL.prototype.load = function(smilDoc,allowQuirks) {
   var start = (new Date()).getTime();
   var doc = new SMILDocument();
   doc.documentElement = smilDoc.documentElement;
   var util = DOMUtil.getInstance();
   var quirks = SMIL.allowQuirks || allowQuirks;
   util.forChildNS(smilDoc.documentElement,"head",quirks ? null : SMIL.NS,function(head) {
      if (head.namespaceURI!=SMIL.NS) {
         smilDoc.quirky = true;
      }
      util.forChildNS(head,"meta",quirks ? null : SMIL.NS,function(meta) {
         doc.meta[meta.getAttribute("name")] = meta.getAttribute("content");
      });
      util.forChildNS(head,"customAttributes",quirks ? null : SMIL.NS,function(attrs) {
         util.forChildNS(attrs,"customTest",quirks ? null : SMIL.NS,function(test) {
            var attr = {
               type: "customTest",
               id: test.getAttribute("id"),
               defaultState: test.getAttribute("defaultState")=="true",
               override: test.getAttribute("override"),
               title: test.getAttribute("title"),
               className: test.getAttribute("class")
            }
            doc.attributes[attr.id] = attr;
         });
      });
   });
   util.forChildNS(smilDoc.documentElement,"body",quirks ? null : SMIL.NS,function(body) {
      if (body.namespaceURI!=SMIL.NS) {
         smilDoc.quirky = true;
      }
      doc.body = SMIL.loadSeq(doc,body,quirks);
   });
   var end = (new Date()).getTime();
   SMIL.console.debug("SMIL loaded, elapsed="+(end-start)+"ms");
   return doc;
}

SMIL.prototype.createContext = function(region,object,options) {
   SMIL.console.log("Creating context for "+object.id);
   var targetContext =  new SMILContext(region,object,options);
   var currentObject = object;
   var childContext = targetContext;
   while (currentObject.parent) {
      var child = currentObject;
      currentObject = currentObject.parent;
      SMIL.console.debug("Creating context for ancestor "+currentObject.id);
      var ancestorRegion = region.ownerDocument.getElementById(currentObject.id);
      if (!ancestorRegion) {
         ancestorRegion = region;
      }
      var currentContext = new SMILContext(ancestorRegion,currentObject,options);
      currentContext.resourceManager = targetContext.resourceManager;
      currentContext.soundManager = targetContext.soundManager;
      currentContext.child = childContext;
      childContext.parent = currentContext;
      SMIL.console.log(childContext.parent.object.id+" parent of "+childContext.object.id);
      for (var i=0; i<currentObject.children.length; i++) {
         if (currentObject.children[i]==child) {
            currentContext.index = i;
            break;
         }
      }
      childContext = currentContext;
   }
   return targetContext;
}

function SMILContext(region,object,options) {
   this.region = region;
   this.object = object;
   this.resourceManager = options.resourceManager;
   this.soundManager = options.soundManager;
   this.index = -1;
   this.options = options;
   if (!this.options) {
      this.options = {};
      this.options.operations = [];
      this.options.sound = true;
      this.options.focusFollow = true;
      this.options.yPos = SMIL.findPosY(this.region);
   } else if (!this.options.operations){
      this.options.operations = [];
      this.options.yPos = SMIL.findPosY(this.region);
   }
   this.finalizers = [];
   this.timers = [];
}

SMILContext.prototype.onfinish = function() {
   SMIL.console.debug("onfinish() called on "+(this.object ? this.object.id : "(anonymous)"));
   while (this.finalizers.length>0) {
      var op = this.finalizers.pop();
      if (op) {
         if (!op()) {
            return false;
         }
      }
   }
   return true;
}

SMILContext.prototype.cancel = function() {
   SMIL.console.debug("Cancel called on "+this.object.id);
   this.options.cancelled = true;
   while (this.options.operations.length>0) {
      var current = this.options.operations.pop();
      if (current) {
         current.cancel();
      }
   }
   while (!this.onfinish()) {
   }
}

SMILContext.prototype.next = function() {
   if (this.options.cancelled) {
      return;
   }
   if (!this.object) {
      return;
   }
   var currentContext = this;
   var waiting = false;
   while (currentContext && currentContext.object) {
      if (currentContext.object.restart(currentContext,currentContext.index+1)) {
         SMIL.console.debug("Finished "+currentContext.object.id);
         if (currentContext.parent) {
            currentContext.parent.child = null;
         }
         currentContext.onfinish();
         if (currentContext.parent) {
            currentContext = currentContext.parent;
            SMIL.console.debug("Moved to parent "+currentContext.object.id);
         } else {
            break;
         }
      } else {
         SMIL.console.debug("Waiting on "+currentContext.object.id);
         waiting = true;
         break;
      }
   }
   if (!waiting && currentContext && currentContext.top) {
      SMIL.console.debug("smil finished in SMILContext.next()");
      if (currentContext.options.onFinish) {
         currentContext.options.onFinish();
      }
   }
}

SMILContext.prototype.proceed = function() {
   if (this.options.onUserEscape) {
      this.options.onUserEscape();
   }
}

function SMILDocument() {
   this.meta = {};
   this.attributes = {};
   this.objects = {};
   this.quirky = false;
   this.body = new SMILSeq();
   this.documentElement = {};
}

SMILDocument.prototype.play = function(context) {
   context.top = true;
   if (this.body.play(context)) {
      SMIL.console.debug("smil finished in SMILDocument.play()");
      if (context.options.onFinish) {
         context.options.onFinish();
      }
   }
}

function SMILSeq(doc,id) {
   this.type = "seq";
   this.doc = doc;
   this.id = id;
   this.attributes = {};
   this.children = [];
}

SMILSeq.prototype.play = function(context) {
   SMIL.console.debug("SMILSeq.play "+this.id);
   if (this.attributes.customTest) {
      SMIL.console.debug("Skipping "+this.id);
      return true;
   }
   var div = null;
   if (!context.options.navigateOnly) {
      var constructor = SMIL.classMap[this.attributes["class"]];
      if (constructor) {
         div = constructor.create(context.region,this.attributes["class"]);
      } else {
         div = context.region.ownerDocument.createElement("div");
         if (this.attributes["class"]) {
            div.className = this.attributes["class"];
         }
      }
   }
   if (div==null) {
      div = context.region;
   } else {
      context.region.appendChild(div);
      context.options.yPos += div.offsetTop;
   }
   var currentContext = new SMILContext(div,this,context.options);
   currentContext.resourceManager = context.resourceManager;
   currentContext.soundManager = context.soundManager;
   context.child = currentContext;
   currentContext.parent = context;
   return this.restart(currentContext,0);
}

SMILSeq.prototype.restart = function(context,index) {
   SMIL.console.debug("SMILSeq.restart "+context.object.id+" at "+index);
   var current = this;
   for (var i=index ? index : 0; i<this.children.length; i++) {
      context.index = i;
      SMIL.console.debug("Playing "+this.children[i].id);
      if (!this.children[i].play(context)) {
         return false;
      }
   }
   context.finalizers.push(function() {
      if (context.options.onWaitForUserEscape && current.attributes.end && current.attributes.end.match(/^DTBuserEscape;/)) {
         context.options.onUserEscape = function() {
            context.options.onUserEscape = null;
            //TODO: this should only be removed if the duration is set.  If there is
            // an end and no duration, the duration is indefinite.  See the definition
            // of fill=auto and the end attribute in SMIL 2.0
            //context.region.parentNode.removeChild(context.region);
            if (!context.options.navigateOnly) {
               if (current.attributes.fill=="remove") {
                  context.region.parentNode.removeChild(context.region);
               }
            }
            context.parent.child = null;
            if (context.played!=undefined) {
               context.played++;
            }
            context.parent.next();
         };
         SMIL.console.log("waiting for user input");
         context.options.onWaitForUserEscape();
         return false;
      } else if (current.attributes.fill=="remove") {
         if (!context.options.navigateOnly) {
            context.region.parentNode.removeChild(context.region);
         }
      }
      if (context.parent) {
         context.parent.child = null;
      }
      if (context.played!=undefined) {
         context.played++;
      }
      return true;
   });
   return context.onfinish();
}

function SMILPar(doc,id) {
   this.type = "par";
   this.doc = doc;
   this.id = id;
   this.attributes = {};
   this.children = [];
}

SMILPar.prototype.play = function(context) {
   SMIL.console.debug("SMILPar.play "+this.id);
   if (this.attributes.customTest) {
      SMIL.console.debug("Skipping "+this.id);
      return true;
   }
   var constructor = SMIL.classMap[this.attributes["class"]];
   var div = null;
   if (!context.options.navigateOnly) {
      if (constructor) {
         div = constructor.create(context.region,this.attributes["class"]);
      } else {
         div = context.region.ownerDocument.createElement("div");
         if (this.attributes["class"]) {
            div.className = this.attributes["class"];
         }
      }
   }
   if (div==null) {
      div = context.region;
   } else {
      context.region.appendChild(div);
      context.options.yPos += div.offsetTop;
   }
   var currentContext = new SMILContext(div,this,context.options);
   currentContext.resourceManager = context.resourceManager;
   currentContext.soundManager = context.soundManager;
   currentContext.parent = context;
   return this.restart(currentContext,0);
}

SMILPar.prototype.restart = function(currentContext,index) {
   if (index>=this.children.length) {
      return true;
   }
   SMIL.console.debug("SMILPar.restart "+currentContext.object.id+" at "+index);
   var current = this;
   currentContext.requested = 0;
   currentContext.playedCount = 0;
   currentContext.played = function() {
      this.playedCount++;
      if (this.playedCount>=this.requested) {
         SMIL.console.debug("All par "+current.id+" played.");
         var complete = function() {
            if (currentContext.parent.played) {
               currentContext.parent.played();
            }
            currentContext.parent.next();
         }
         if (currentContext.onfinish()) {
            complete();
         } else {
            currentContext.finalizers.push(complete);
         }
      } else {
         SMIL.console.debug("Waiting for par "+current.id+": "+currentContext.requested+"!="+currentContext.playedCount);
      }
   }
   var makePlayer = function(pos) {
      return function() {
         SMIL.console.debug("par play "+pos+": "+current.children[pos].type);
         try {
            current.children[pos].play(currentContext);
         } catch (ex) {
            SMIL.console.log("Error in par play: "+ex);
         }
      };
   }
   currentContext.index = this.children.length;
   for (var i=index; i<current.children.length; i++) {
      currentContext.requested++;
      setTimeout(makePlayer(i),1);
   }
   return false;
}

function SMILText(doc) {
   this.type = "text";
   this.doc = doc;
   this.attributes = {};
}

SMILText.prototype.play = function(context) {
   var pos = this.attributes.src.indexOf("#");
   var id = this.attributes.src.substring(pos+1);
   var current = this;
   try {
      SMIL.console.debug("SMILText.play "+this.attributes.src);
      if (!context.options.navigateOnly) {
         //SMIL.console.debug("Getting element...");
         var element = context.resourceManager.get(this.attributes.src);
         if (!element) {
            SMIL.console.log("Cannot dereference "+this.attributes.src);
         }
         //SMIL.console.debug("Element: "+element+", importing to "+context.region.ownerDocument);
         /* Note: The standard import node throws an error when you import an XML
          * node into an HTML document.  Who knows why.  Bad karma?
          */
         SMIL.importNode(context.region.ownerDocument,context.region,element);
         //SMIL.console.debug("Imported, adding to context: "+context.region);
      } else if (context.options.highlight || context.options.focusFollow || context.options.tts) {
         var target = context.region.ownerDocument.getElementById(id);
         if (context.options.context) {
            context.options.context.id = id;
            context.options.context.element = target;
         }
         // we will only process elements less than 1000px in height.  This avoids
         // highlighting huge sections of a document.
         if (target && target.offsetHeight<1000) {
            if (context.options.highlight || context.options.tts) {
               var originalValue = target.className;
               var time = (new Date()).getTime();
               var opIndex = context.options.operations.length;
               var undo = function() {
                  target.className = originalValue;
                  target.ownerDocument.defaultView.getSelection().removeAllRanges();
               };
               if (context.options.highlight) {
                  target.className = originalValue+" daisy-highlight";
               }
               if (SMIL.selectHighlight) {
                  var range = target.ownerDocument.createRange();
                  range.selectNode(target);
                  target.ownerDocument.defaultView.getSelection().removeAllRanges();
                  target.ownerDocument.defaultView.getSelection().addRange(range);
               }
               if (context.options.tts) {
                  SMIL.console.debug("Speak: "+target.localName+" "+target.getAttribute("id"));
                  var operation = {
                     cancelled: false,
                     cancel: function() {
                        if (!this.cancelled) {
                           this.cancelled = true;
                           context.options.tts.cancel();
                        }
                     }
                  };
                  var tm = Components.classes["@mozilla.org/thread-manager;1"].getService(Components.interfaces.nsIThreadManager);

                  var ttsCallback = { 
                     currentThread: tm.currentThread,
                     QueryInterface: function(aIID) {
                        if (aIID.equals(Components.interfaces.nsITTSCallback) ||
                           aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
                           aIID.equals(Components.interfaces.nsISupports)) {
                           return this;
                        }
                        throw Components.results.NS_NOINTERFACE;
                     },
                     onFinish: function(cancelled) {
                        var thread = this.currentThread;
                        var dispatch = function() {
                           thread.dispatch({
                              run: function() {
                                 undo();
                                 if (!operation.cancelled) {
                                    if (context.played) {
                                       context.played();
                                    } else {
                                       context.next();
                                    }
                                 }
                                 SMIL.console.debug("Speech completed.");
                              }
                           },thread.DISPATCH_NORMAL);
                        };
                        if (!operation.cancelled && context.options.playbackPause && context.options.playbackPause>0) {
                           try {
                              thread.dispatch({
                                 run: function() {
                                    SMIL.console.debug("Pause: "+context.options.playbackPause);
                                    context.timers.push(setTimeout(dispatch,context.options.playbackPause));
                                 }
                              },thread.DISPATCH_NORMAL);
                           } catch (ex) {
                              thread.dispatch({
                                 run: function() {
                                    SMIL.console.debug("Cannot queue pause, error: "+ex);
                                 }
                              },thread.DISPATCH_NORMAL);
                              dispatch();
                           }
                        } else {
                           dispatch();
                        }

                     }
                  };
                  context.options.operations.push(operation);
                  var text = null;
                  if (target.localName=="math" && target.namespaceURI=="http://www.w3.org/1998/Math/MathML") {
                     text = target.getAttribute("alttext");
                     // TODO: we should generate text for mathml if it doesn't exist
                  }
                  if (!text || text=="") {
                     // If the area of the rendered box is larger that 600x600, we probably
                     // have a bad pointer to a section in TTS.  We'll skip the TTS
                     // so that the browser or TTS engine isn't overloaded.
                     var area = target.offsetHeight*target.offsetWidth;
                     if (area<360000) {
                        text = target.textContent;
                     } else {
                        SMIL.console.log("Object "+target.getAttribute("id")+" is too large for TTS, height="+target.offsetHeight);
                     }
                  }
                  if (!text || text=="") {
                     SMIL.console.debug("Empty text, TTS skipped.");
                     ttsCallback.onFinish(false);
                  } else {
                     var parts = text.split(/\n/);
                     SMIL.console.debug("parts: "+parts.length);
                     var spoken = "";
                     for (var i=0; i<parts.length; i++) {
                        if (i>0 && parts[i-1].length>0) {
                           spoken += " ";
                        }
                        spoken += parts[i];
                     }
                     SMIL.console.debug("text: "+spoken);
                     context.options.tts.speak(spoken,ttsCallback);
                  }
               } else {
                  var op = {
                     cancelled: false,
                     cancel: function() {
                        if (!this.cancelled) {
                           SMIL.console.debug("Canceling "+current.attributes.src);
                           undo();
                           context.options.operations[opIndex] = null;
                           this.cancelled = true;
                        }
                     }
                  };
                  context.options.operations.push(op);
                  var tpos = context.timers.push(setTimeout(function() {
                     SMIL.console.debug("Timeout fired for "+current.attributes.src);
                     try {
                        if (context.options.cancelled) {
                           SMIL.console.debug("Text "+current.attributes.src+" cancelled");
                           return true;
                        }
                        context.timers[tpos] = null;
                        SMIL.console.debug("Continuing...");
                        undo();
                        op.cancelled = true;
                        context.options.operations[opIndex] = null;
                        if (context.played) {
                           context.played();
                        } else {
                           context.next();
                        }
                        return true;
                     } catch (ex) {
                        SMIL.console.log("Error during text "+id+" finalizer: "+ex);
                        return true;
                     }
                  },SMIL.textOnlyPause));
                  SMIL.console.debug("Waiting "+SMIL.textOnlyPause+"ms on "+current.attributes.src);
               }
            } else {
               if (context.played) {
                  context.played();
               }
            }
            // non-HTML rendered objects like MathML do not have
            // HTML DOM properties like offsetTop.  As such, you
            // can't calulate their scroll position this way.
            if (target.offsetTop) {
               context.options.yPos = SMIL.findPosY(target)+SMIL.yOffset;
               if (context.options.focusFollow) {
                  context.region.ownerDocument.defaultView.scrollOwner = this;
                  context.region.ownerDocument.defaultView.scroll(0,context.options.yPos);
                  target.focus();
               }
            }
            return false;
         } else if (target) {
            SMIL.console.log("Highlight target "+id+" is too large.");
         } else {
            SMIL.console.log("Cannot find highlight target "+id);
         }
      }
      if (context.played) {
         context.played();
      }
      if (context.options.focusFollow) {
         context.region.ownerDocument.defaultView.scrollOwner = this;
         context.region.ownerDocument.defaultView.scroll(0,context.options.yPos);
      }
   } catch (ex) {
      SMIL.console.log("Error during text "+id+" play: "+ex);
   }
   //div.appendChild(div.ownerDocument.createTextNode(element.localName+" -> "+element.textContent));
   return true;
}

SMILText.prototype.restart = function() {}

function SMILAudio(doc) {
   this.type = "audio";
   this.doc = doc;
   this.attributes = {};
}

SMILAudio.prototype.play = function(context) {
   SMIL.console.log("SMILAudio.play "+this.attributes.src);
   if (context.soundManager && context.options.sound) {
      var position = 0;
      if (this.attributes.clipBegin) {
         position = SMIL.parseDuration(this.attributes.clipBegin);
      }
      var duration = -1;
      if (this.attributes.clipEnd) {
         duration = SMIL.parseDuration(this.attributes.clipEnd)-position;
      }
      var src = this.attributes.src;
      if (!context.resourceManager.baseURI) {
         SMIL.console.log("Cannot resolve audio file as resourceManager.baseURI is null");
         if (context.played) {
            context.played();
         }
         return true;
      }
      var uri = context.resourceManager.baseURI.resolve(src);
      SMIL.console.log("Audio: "+uri.spec+" ("+context.resourceManager.baseURI.spec+","+src+")");
      var id = "audio-"+context.object.id+"-"+(new Date()).getTime();
      var sound = context.soundManager.createSound({
         id: id,
         url: uri.spec,
         autoPlay: false,
         onload: function() {
            SMIL.console.debug(src+" loaded");
         }
      });
      sound.load();
      var current = this;

      // TODO: how is cleanup suppose to be handled;
      var operationPos = context.options.operations.length;
      context.options.operations.push({
         cancelled: false,
         cancel: function() {
            if (!this.cancelled) {
               this.cancelled = true;
               sound.stop();
            }
         }
      });

      var waitFor = function() {
         if (sound.readyState==3) {
            sound.setPosition(position);
            sound.play();
            if (duration > 0) {
               sound.finishTimer = setTimeout(function() {
                  try {
                     SMIL.console.debug("Stopped: "+current.attributes.src);
                     context.options.operations[operationPos] = null;
                     if (context.played) {
                        context.played();
                     }
                     sound.stop();
                  } catch (ex) {
                     SMIL.console.log("Error during sound stop at duration: "+ex);
                  }
               },duration);
               SMIL.console.debug("Sound timer: " + sound.finishTimer);
            } else {
               sound.onfinish = function() {
                  SMIL.console.debug("Finished: "+current.attributes.src);
                  context.options.operations[operationPos] = null;
                  if (context.played) {
                     context.played();
                  }
               };
            }
            SMIL.console.debug("Playing "+src+" ("+current.attributes.clipBegin+","+current.attributes.clipEnd+") = start at "+position+"ms for "+duration+"ms of "+sound.duration+"ms");
         } else {
            setTimeout(waitFor,10);
         }
      }
      waitFor();

   } else {
      if (!context.soundManager) {
         SMIL.console.debug("No sound manager in context.");
      }
      if (context.played) {
         context.played();
      }
   }
   return true;
}

SMILAudio.prototype.restart = function() {}


function SMILImage(doc) {
   this.type = "image";
   this.doc = doc;
   this.attributes = {};
}

SMILImage.prototype.play = function(context) {
   SMIL.console.log("SMILImage.play "+this.attributes.src);
   /*
   var div = context.region.ownerDocument.createElement("div");
   if (this.attributes["class"]) {
      div.className = this.attributes["class"];
   }
   context.region.appendChild(div);
   */
   if (!context.options.navigateOnly) {
      var img = context.region.ownerDocument.createElement("img");
      var uri = context.resourceManager.baseURI.resolve(this.attributes.src);
      img.setAttribute("src",uri.spec);
      context.region.appendChild(img);
   }
   if (context.options.focusFollow) {
      if (img) {
         context.options.yPos += img.offsetTop;
      } else if (context.options.navigateOnly) {
         var target = context.region.ownerDocument.getElementById(context.object.id);
         if (target) {
            context.options.yPos = SMIL.findPosY(target)+SMIL.yOffset;
         }
      }
      context.region.ownerDocument.defaultView.scrollOwner = this;
      context.region.ownerDocument.defaultView.scroll(0,context.options.yPos);
   }
   if (context.options.tts) {
      var target = context.region.ownerDocument.getElementById(context.object.id);
      if (target) {
         if (context.options.context) {
            context.options.context.id = context.object.id;
            context.options.context.element = target;
         }
         var alt = target.getAttribute("alt");
         if (alt && alt!="") {
            SMIL.console.debug("Speak: img "+context.object.id+", "+alt);
            var operation = {
               cancelled: false,
               cancel: function() {
                  if (!this.cancelled) {
                     this.cancelled = true;
                     context.options.tts.cancel();
                  }
               }
            };
            var tm = Components.classes["@mozilla.org/thread-manager;1"].getService(Components.interfaces.nsIThreadManager);

            var ttsCallback = {
               currentThread: tm.currentThread,
               QueryInterface: function(aIID) {
                  if (aIID.equals(Components.interfaces.nsITTSCallback) ||
                     aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
                     aIID.equals(Components.interfaces.nsISupports)) {
                     return this;
                  }
                  throw Components.results.NS_NOINTERFACE;
               },
               onFinish: function(cancelled) {
                  var thread = this.currentThread;
                  var dispatch = function() {
                     thread.dispatch({
                        run: function() {
                           SMIL.console.debug("Speech completed.");
                           if (!operation.cancelled) {
                              if (context.played) {
                                 context.played();
                              } else {
                                 context.next();
                              }
                           }
                        }
                     },thread.DISPATCH_NORMAL);
                  }
                  dispatch.currentThread = this.currentThread;
                  if (context.options.playbackPause && context.options.playbackPause>0) {
                     try {
                        thread.dispatch({
                           run: function() {
                              SMIL.console.debug("Pause: "+context.options.playbackPause);
                              context.timers.push(setTimeout(dispatch,context.options.playbackPause));
                           }
                        },thread.DISPATCH_NORMAL);
                     } catch (ex) {
                        thread.dispatch({
                           run: function() {
                              SMIL.console.debug("Cannot queue pause, error: "+ex);
                           }
                        },thread.DISPATCH_NORMAL);
                        dispatch();
                     }
                  } else {
                     dispatch();
                  }

               }
            };
            context.options.operations.push(operation);
            context.options.tts.speak(alt,ttsCallback);
            return false;
         } else {
            SMIL.console.debug("No alt attribute for "+context.object.id);
         }
      } else {
         SMIL.console.debug("Cannot find "+context.object.id);
      }
   }
   if (context.played) {
      context.played();
   }
   return true;
}

SMILImage.prototype.restart = function() {}


function SMILResourceManager(baseURI) {
   this.baseURI = new URI(baseURI);
   this.documents = {};
}

SMILResourceManager.prototype.get = function(href) {
   var pos = href.lastIndexOf('#');
   var fragment = null;
   if (pos>0) {
      fragment = href.substring(pos+1);
      href = href.substring(0,pos);
   }

   var url = this.baseURI.resolve(href);
   //alert("href="+href+"\n"+url.spec+"\nfragment=x"+fragment);
   var docSpec = this.documents[url.spec];
   if (!docSpec) {
      docSpec = this.load(url.spec);
      this.documents[url.spec] = docSpec;
   }
   return fragment ? docSpec.getElementById(fragment) : docSpec.document.documentElement;
}

SMILResourceManager.prototype.load = function(url) {
   var doc = null;
   HTTP("GET",url, {
      overrideMimeType: "text/xml",
      synchronizedRequest: true,
      onSuccess: function(status,xml,text) {
         doc = xml;
      },
      onFailure: function(status) {
         throw "Cannot get document from "+url+", status="+status;
      }
   });
   var spec = null;
   if (doc) {
      try {
         spec = {
             index: {},
             document: doc,
             getElementById: function(id) {
                return this.index[id];
             }
         };
         var index = spec.index;
         var context = [];
         var current = doc.documentElement;
         while (current) {
            if (current.nodeType!=1) {
               current = current.nextSibling;
               while (!current && context.length>0) {
                  current = context.pop();
                  //SMIL.console.logStringMessage("Popped to "+current.localName);
                  current = current.nextSibling;
               }
               continue;
            }
            var id = current.getAttribute("id");
            if (id) {
               index[id] = current;
               //SMIL.console.logStringMessage(current.localName+" -> "+id);
            } else {
               //SMIL.console.logStringMessage(current.localName+" (no id)");
            }
            if (current.firstChild) {
               context.push(current);
               current = current.firstChild;
            } else {
               current = current.nextSibling;
            }
            while (!current && context.length>0) {
               current = context.pop();
               //SMIL.console.logStringMessage("Popped to "+current.localName);
               current = current.nextSibling;
            }
         }
      } catch (ex) {
         throw "Indexing failed: "+ex;
      }
   }
   return spec;
}



/*
 *
Copyright (c) 2008, R. Alexander Milowski
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

 - Redistributions of source code must retain the above copyright notice,
   this list of conditions and the following disclaimer.
 - Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.
 - Neither the name of the R. Alexander Milowski nor the names of its contributors
   may be used to endorse or promote products derived from this software
   without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

 *
 */

var _HTTP_HEADER_NAME = new RegExp("^([a-zA-Z0-9_-]+):");
var _ioService=Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
var _authenticationManager = Components.classes["@mozilla.org/network/http-auth-manager;1"].getService(Components.interfaces.nsIHttpAuthManager);

function _HTTP_parseHeaders(headerText)
{
   var headers = {};
   if (headerText) {
      var eol = headerText.indexOf("\n");
      while (eol>=0) {
         var line = headerText.substring(0,eol);
         headerText = headerText.substring(eol+1);
         while (headerText.length>0 && !headerText.match(_HTTP_HEADER_NAME)) {
            eol = headerText.indexOf("\n");
            var nextLine = eol<0 ? headerText : headerText.substring(0,eol);
            line = line+' '+nextLine;
            headerText = eol<0 ? "" : headerText.substring(eol+1);
         }
         // Parse the name value pair
         var colon = line.indexOf(':');
         var name = line.substring(0,colon);
         var value = line.substring(colon+1);
         headers[name] = value;
         eol = headerText.indexOf("\n");
      }
      if (headerText.length>0) {
         var colon = headerText.indexOf(':');
         var name = headerText.substring(0,colon);
         var value = headerText.substring(colon+1);
         headers[name] = value;
      }
   }
   return headers;
}

/** 
 * The following keys can be sent:
 * onSuccess (required)  a function called when the response is 2xx
 * onFailure             a function called when the response is not 2xx
 * username              The username for basic auth
 * password              The password for basic auth
 * overrideMimeType      The mime type to use for non-XML response mime types
 * timeout               A timeout value in milliseconds for the response
 * onTimeout             A function to call if the request times out.
 * body                  A string containing the entity body of the request
 * contentType           The content type of the entity body of the request
 * headers               A hash of optional headers
 */
function HTTP(method,url,options)
{
      
   //alert(method+" "+url+" "+options.username);
   
   var requester = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance();
   requester = requester.QueryInterface(Components.interfaces.nsIXMLHttpRequest);
   //var requester = new XMLHttpRequest();

   var timeout = null;
   if (!options.synchronizedRequest) {

      requester.onreadystatechange = function() {
         if (requester.readyState==4) {
            if (timeout) {
               clearTimeout(timeout);
            }
            try {
               if (requester.status) {
               }
            } catch (ex) {
               if (options.onFailure) {
                  options.onFailure(
                     -1,
                     null,
                     ex,
                     null
                  );
               }
               return;
            }
            try {
               if (requester.status==0 || (requester.status>=200 && requester.status<300)) {
                  options.onSuccess(
                     requester.status,
                     requester.responseXML,
                     requester.responseText,
                     options.returnHeaders ? _HTTP_parseHeaders(requester.getAllResponseHeaders()) : null
                  );
               } else {
                  if (options.onFailure) {
                     options.onFailure(
                        requester.status,
                        requester.responseXML,
                        requester.responseText,
                        options.returnHeaders ? _HTTP_parseHeaders(requester.getAllResponseHeaders()) : null
                     );
                  }
               }
            } catch (ex) {
               if (options.onFailure) {
                  options.onFailure(-1,requester.responseXML,ex);
               }
            }
         }
      }
   }
   
   if (options.overrideMimeType) {
      requester.overrideMimeType(options.overrideMimeType);
   }
   if (options.username && options.username!="") {
      requester.open(method,url+"",!options.synchronizedRequest,options.username,options.password);
   } else {
      requester.open(method,url+"",!options.synchronizedRequest);
   }
   if (options.timeout && !options.synchronizedRequest) {
      timeout = setTimeout(
          function() {
             var callback = options.onTimeout ? options.onTimeout : options.onFailure;
             callback(0,"Operation timeout.");
          },
          options.timeout
      );
   }
   if (options.headers) {
      for (var name in options.headers) {
         requester.setRequestHeader(name,options.headers[name]);
      }
   }
   if (options.body) {
      requester.setRequestHeader("Content-Type",options.contentType);
      requester.send(options.body);
   } else {
      requester.send(null);
   }
   if (options.synchronizedRequest) {
      if (requester.status==0 || (requester.status>=200 && requester.status<300)) {
         options.onSuccess(
            requester.status,
            requester.responseXML,
            requester.responseText,
            options.returnHeaders ? _HTTP_parseHeaders(requester.getAllResponseHeaders()) : null
         );
      } else {
         if (options.onFailure) {
            options.onFailure(
               requester.status,
               requester.responseXML,
               requester.responseText,
               options.returnHeaders ? _HTTP_parseHeaders(requester.getAllResponseHeaders()) : null
            );
         }
      }
      return {
         abort: function() {
         }
      };
   } else {
      return {
         abort: function() {
            clearTimeout(timeout);
            requester.abort();
         }
      };
   }
}



/*
 * 
Copyright (c) 2008, R. Alexander Milowski
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

 - Redistributions of source code must retain the above copyright notice,
   this list of conditions and the following disclaimer.
 - Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.
 - Neither the name of the R. Alexander Milowski nor the names of its contributors
   may be used to endorse or promote products derived from this software
   without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

 *
 */

function URI(spec) {
   this.spec = spec;
   this.parse();
}

URI.prototype.parse = function() {
   var pos = 0;
   for (; pos<this.spec.length && this.spec.charAt(pos)!=':'; pos++);
   if (pos==this.spec.length) {
      throw "Bad URI value, no scheme: "+this.spec;
   }
   this.scheme = this.spec.substring(0,pos);
   this.schemeSpecificPart = this.spec.substring(pos+1);
   pos++;
   if (this.spec.charAt(pos)=='/' && this.spec.charAt(pos+1)=='/') {
      this.parseGeneric();
   }
}

URI.prototype.parseGeneric = function() {
   if (this.schemeSpecificPart.charAt(0)!='/' || this.schemeSpecificPart.charAt(1)!='/') {
      throw "Generic URI values should start with '//':"+this.spec;
   }

   var work = this.schemeSpecificPart.substring(2);
   var pathStart = work.indexOf("/");
   if (pathStart<0) {
      throw "There must be a server specification: "+this.spec;
   }
   this.authority = work.substring(0,pathStart);
   this.path = work.substring(pathStart);
   var hash = this.path.indexOf('#');
   if (hash>=0) {
      this.fragment = this.path.substring(hash+1);
      this.path = this.path.substring(0,hash);
   }
   var questionMark = this.path.indexOf('?');
   if (questionMark>=0) {
      this.query = this.path.substring(questionMark+1);
      this.path = this.path.substring(0,questionMark);
   }
   this.segments = this.path.split(/\//);
   if (this.segments.length>0 && this.segments[0]=='' && this.path.length>1 && this.path.charAt(1)!='/') {
      // empty segment at the start, remove it
      this.segments.shift();
   }
   if (this.segments.length>0 && this.path.length>0 && this.path.charAt(this.path.length-1)=='/' && this.segments[this.segments.length-1]=='') {
      // we may have an empty the start
      // check to see if it is legimate
      if (this.path.length>1 && this.path.charAt(this.path.length-2)!='/') {
         this.segments.pop();
      }
   }
   this.isGeneric = true;
}

URI.prototype.resolve = function(href) {
   if (!href) {
      return new URI(this.spec);
   }
   if (!this.isGeneric) {
      throw "Cannot resolve uri against non-generic URI: "+this.spec;
   }
   if (href.charAt(0)=='/') {
      return new URI(this.scheme+"://"+this.authority+href);
   } else if (href.charAt(0)!='#') {
      if (href.charAt(0)=='.' && href.charAt(1)=='/') {
         href = href.substring(1);
      }
      if (this.path.charAt(this.path.length-1)=='/') {
         return new URI(this.scheme+"://"+this.authority+this.path+href.substring(2));
      } else {
         var last = this.path.lastIndexOf('/');
         return new URI(this.scheme+"://"+this.authority+this.path.substring(0,last+1)+href);
      }
   } else {
      return new URI(this.scheme+"://"+this.authority+this.path+href);
   }
}

URI.prototype.relativeTo = function(otherURI) {
   if (otherURI.scheme!=this.scheme) {
      return this.spec;
   }
   if (!this.isGeneric) {
      throw "A non generic URI cannot be made relative: "+this.spec;
   }
   if (!otherURI.isGeneric) {
      throw "Cannot make a relative URI against a non-generic URI: "+otherURI.spec;
   }
   if (otherURI.authority!=this.authority) {
      return this.spec;
   }
   for (var i=0; i<this.segments.length && i<otherURI.segments.length; i++) {
      if (this.segments[i]!=otherURI.segments[i]) {
         //alert(this.path+" different from "+otherURI.path+" at '"+this.segments[i]+"' vs '"+otherURI.segments[i]+"'");
         var relative = "";
         for (var j=i; j<otherURI.segments.length; j++) {
            relative += "../";
         }
         for (var j=i; j<this.segments.length; j++) {
            relative += this.segments[j];
            if ((j+1)<this.segments.length) {
               relative += "/";
            }
         }
         if (this.path.charAt(this.path.length-1)=='/') {
            relative += "/";
         }
         return relative;
      }
   }
   if (this.segments.length==otherURI.segments.length) {
      return hash ? hash : (query ? query : "");
   } else if (i<this.segments.length) {
      var relative = "";
      for (var j=i; j<this.segments.length; j++) {
         relative += this.segments[j];
         if ((j+1)<this.segments.length) {
            relative += "/";
         }
      }
      if (this.path.charAt(this.path.length-1)=='/') {
         relative += "/";
      }
      return relative;
   } else {
      throw "Cannot calculate a relative URI for "+this.spec+" against "+otherURI.spec;
   }
}




/*
 *
Copyright (c) 2008, R. Alexander Milowski
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

 - Redistributions of source code must retain the above copyright notice,
   this list of conditions and the following disclaimer.
 - Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.
 - Neither the name of the R. Alexander Milowski nor the names of its contributors
   may be used to endorse or promote products derived from this software
   without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

 *
 */

function DOMUtil() {
}

DOMUtil.getInstance = function() {
   if (!DOMUtil.instance) {
      DOMUtil.instance = new DOMUtil();
   }
   return DOMUtil.instance;
}

DOMUtil.prototype.forElement = function(e,handler) {
   var current = e ? e.firstChild : null;
   while (current) {
      if (current.nodeType!=1) {
         current = current.nextSibling;
         continue;
      }
      handler(current);
      current = current.nextSibling;
   }
}

DOMUtil.prototype.forChild = function(e,name,handler) {
   var current = e ? e.firstChild : null;
   while (current) {
      if (current.nodeType!=1) {
         current = current.nextSibling;
         continue;
      }
      //alert("{"+current.namespaceURI+"}"+current.localName+" vs {"+namespace+"}"+name);
      if (current.tagName.toLowerCase()==name) {
         handler(current);
      }
      current = current.nextSibling;
   }
}
DOMUtil.prototype.forChildNS = function(e,name,namespaceURI,handler) {
   var current = e ? e.firstChild : null;
   while (current) {
      if (current.nodeType!=1) {
         current = current.nextSibling;
         continue;
      }
      //alert("{"+current.namespaceURI+"}"+current.localName+" vs {"+namespace+"}"+name);
      if ((!name || current.localName==name) && (!namespaceURI || current.namespaceURI==namespaceURI)) {
         handler(current);
      }
      current = current.nextSibling;
   }
}
DOMUtil.prototype.text = function(e,value) {
   if (value) {
      this.clearChildren(e);
      e.appendChild(e.ownerDocument.createTextNode(value));
   } else {
      if (e.innerText) {
         return e.innerText;
      } else if (e.textContent) {
         return e.textContent;
      } else {
         var text = "";
         var current = e.firstChild;
         while (current) {
            if (current.nodeType==3) {
               text += current.nodeValue;
            } else if (current.nodeType==1) {
               text += this.text(current);
            }
            current = current.nextSibling;
         }
         return text;
      }
   }
}

DOMUtil.prototype.clearChildren = function(parent) {
   if (parent && parent.childNodes) {
      while (parent.childNodes.length>0) {
         parent.removeChild(parent.childNodes.item(0));
      }
   }
}

function setTimeout(handler,delay) {
    var timer = Components.classes["@mozilla.org/timer;1"].createInstance().QueryInterface(Components.interfaces.nsITimer);
    timer.initWithCallback(handler,delay,0);
    return timer;
}

function clearTimeout(timer) {
   timer.cancel();
}
