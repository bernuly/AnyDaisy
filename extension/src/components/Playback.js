
function BookContext()
{
   // Logging console
   this.console = {
      preferencesService: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("daisy.helper."),
      _initialized: false,
      _debug: false,
      service: Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService),
      log: function(message) {
         this.service.logStringMessage((new Date()).getTime() + ": Log - " + message);
      },
      debug: function(message) {
         if (!this._initialized) {
            if (this.preferencesService) {
               try {
                  this._debug = this.preferencesService.getBoolPref("debug");
               } catch (ex) {
                  // no preference
               }
            }
            this._initialized = true;
         }
         if (this._debug) {
            this.service.logStringMessage((new Date()).getTime() + ": Playback - " + message);
         }
      }
   };
}

BookContext.prototype.init = function(options) {
   this.owner = options.owner;
   this.tts = options.tts;
   this.noteIndex = -1;
   this.top = options.document.getElementById("daisy-internal-book").firstChild;
   this.something = false;
   this.descend = true;
   this.newPosition = false;
   this.revert = null;
   this.locator = options.locator;
   if (!this.locator) {
      this.locator = function(element) { return ""; };
   }
   this.soundManager = options.soundManager;
   this.sounds = options.sounds;
   this.boundaryCount = 0;

};

// we need to run TTS as a callback because it can
// potentially block the main thread depending on how
// the TTS engine is implemented.
BookContext.speak = function(context,text,callback) {
   if (context.tts) {
      // cleanup text:
      var parts = text.split(/\n/);
      var spoken = "";
      for (var i=0; i<parts.length; i++) {
         if (i>0 && parts[i-1].length>0) {
            spoken += " ";
         }
         spoken += parts[i];
      }

      context.timer = setTimeout(function() {
         context.tts.speak(spoken,callback);
      },10);
   }
};

BookContext.skipDescendants = {
   process: function(element,context) {
      context.revert = context._makeRestore(element);
      context._makeMark(element).exec();
      var text = BookContext.inlineText(element);
      if (text=="") {
         text = "empty";
      }
      BookContext.speak(context,text,context.ttsCallback);
      return false;
   },
   canDescend: function(e) { return false; }
};

BookContext.canMixedDescend = function(element) {

   // only desend if there are sentences
   var sent = false;
   var child = element.firstChild;
   while (child && !sent) {
      if (child.nodeType==1 && child.localName=="span" && child.className.indexOf("daisy-sent")>=0) {
         sent = true;
      }
      child = child.nextSibling;
   }

   return sent;
};

BookContext.inlineText = function(element) {
   var text = "";
   var child = element.firstChild;
   while (child) {
      var suffix = "";
      var skip = false;
      var recurse = true;
      if (child.nodeType==1 && child.localName=="a") {
         if (child.className==DAISYHelper.hackClassName) {
            child = child.nextSibling;
            continue;
         }
         var role = child.getAttribute("role");
         if (!role || role.length==0) {
            role = "link";
         }
         var title = child.getAttribute("title");
         if (role!="note" || !title || title.length==0) {
            text += ", "+role;
         }
         if (title && title.length>0) {
            text += ", "+title;
         }
         if ((title && title.length>0) || (role && role.length>0)) {
            text += ", ";
         }
         suffix = ", ";
      } else if (child.nodeType==1 && child.localName=="img") {
    	  if (!this.hasAttributeValue(child, "class", "daisy-skip")) {
	         suffix = child.getAttribute("alt");
	         if (!suffix || suffix=="") {
	            suffix = ", Image (no description), image complete, ";
	         } else {
	            suffix = ", Image "+suffix+" , image complete, ";
	         }
    	  }
      } else if (child.nodeType==1 && child.localName=="math") {
         var alt = child.getAttribute("alttext");
         if (alt.length>0) {
            skip = true;
            text += " "+alt+" ";
         }
      }
      if (!skip) {
         if (child.nodeType==1) {
            text += " "+BookContext.inlineText(child)+suffix;
         } else {
            text += " "+child.textContent+suffix;
         }
      }
      child = child.nextSibling;
   }
   // Trim whitespace
   // TODO: Put trim fn on String.prototype. Code from http://blog.stevenlevithan.com/archives/faster-trim-javascript
   text = text.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
   return text;
};

/**
 * Return the text representation of the content of an element, or "is empty" if none. 
 * @param element a DOM element
 * @return String, not null
 */
BookContext.elementContent = function(element) {
   var cellContent = BookContext.inlineText(element);
   if (!cellContent || cellContent.length == 0) {
	   cellContent = "is empty";
   }
   return cellContent;
};

BookContext.speakAndDescend = function(text,end) {
   return {
      _: {
            process: function(element,context) {
               context.revert = context._makeRestore(element);
               context._makeMark(element).exec();
               BookContext.speak(context,text,context.ttsCallback);
               return true;
            },
            onEnd: end ? ( (typeof end=='function') ? end : function() { return end; }) : null,
            canDescend: function(e) { return true; }
         }
   };
};

/**
 * Speak either a DAISY note element or a user note.
 * This treats the entire note structure tree as a single structural element.
 */
BookContext.speakNote = function(intro, end) {
   return {
      process: function(element,context) {
         context.revert = context._makeRestore(element);
         context._makeMark(element).exec();
         var text = BookContext.inlineText(element);
         if (text=="") {
            text = "empty";
         }
         text = intro + ", " + text + ", " + end;
         BookContext.speak(context, text, context.ttsCallback);
         return true;
      },
      canDescend: function(e) { return false; }
   };
};

BookContext.inlines = [
   "a",
   "em",
   "strong",
   "img",
   "sub",
   "sup",
   "span",
   "tt",
   "i",
   "b",
   "big",
   "small",
   "dfn",
   "code",
   "samp",
   "kbd",
   "var",
   "cite",
   "abbr",
   "acronym",
   "br",
   "q",
   "bdo"
];

BookContext.isInline = function(element) {
   var tagName = element.localName;
   for (var i=0; i<BookContext.inlines.length; i++) {
      if (tagName==BookContext.inlines[i]) {
         return true;
      }
   }
   return false;
};

/**
 * Check whether a given attribute on an element contains a given value.
 * @param element not null
 * @param attributeName String
 * @param attributeValue String
 * @return true if the value occurs somewhere in the attribute's string value
 */
BookContext.hasAttributeValue = function(element, attributeName, attributeValue) {
    var attribute = element.getAttribute(attributeName);
    var names = attribute == null ? [] : attribute.split(" ");
    var result = false;
    
    for (var i=0; i<names.length; i++) {
       if (names[i] == attributeValue) {
          result = true;
       }
    }
    return result;
};

BookContext.prototype.setElement = function(element,options) {
   this.reset();
   this.referer = options ? options.referer : null;
   this.element = element;
   this.yPos = findYPos(this.element);
   this.descend = this._canDescend(element);
   if (options && options.scroll) {
      var window = this.element.ownerDocument.defaultView;
      this.console.debug("Starting scroll from setElement with yPos = " + this.yPos + " for element ID " + element.id);
      window.scrollOwner = this;
      window.scroll(0,this.yPos-DAISYHelper.positionOffset);
   }
   if (options && options.invoke) {
      this._handle();
   } else {
      this.markPosition();
   }
   this.newPosition = options && options.newPosition ? true : false;
};

BookContext.prototype.markPosition = function() {
   if (!this.element) {
      return;
   }
   this.reset();
   this.revert = this._makeRestore(this.element);
   this.element.className = this.element.className + " daisy-position-highlight";
};

BookContext.prototype._canDescend = function(element) {
   var descend = true;
   var handler = this.handlers[element.localName];
   if (handler) {
      var className = element.getAttribute("class");
      var names = className==null ? [] : className.split(/\s+/);
      var classHandler  = null;
      for (var i=0; i<names.length && !classHandler; i++) {
         this.console.debug("_canDescend Class: "+names[i]);
         classHandler = handler[names[i]];
      }
      if (!classHandler) {
         var role = this.element.getAttribute("role");
         this.console.debug("_canDescend Role: "+role);
         classHandler = handler[role];
      }
      if (!classHandler && handler._) {
         classHandler = handler._;
      }
      if (classHandler) {
         descend = classHandler.canDescend(element);
      }
   }
   return descend;
};

BookContext.prototype.handlers = {
   img: {
      _: {
         process: function(element,context) {
            context.revert = context._makeRestore(element);
            context._makeMark(element).exec();
            if (context.tts) {
               var caption = null;
               if (caption) {
                  this.console.debug("img handler: caption.localName="+caption.localName+" "+caption.className);
                  BookContext.speak(context,"Image, "+BookContext.inlineText(caption),context.ttsCallback);
               } else {
                  var text = element.getAttribute("alt");
                  if (!text || text=="") {
                     BookContext.speak(context,"Image, no description, image complete",context.ttsCallback);
                  } else {
                     BookContext.speak(context,"Image, "+text+" , image complete",context.ttsCallback);
                  }
               }
            }
            return false;
         },
         canDescend: function(e) { return false; }
      }
   },
   math: {
      _: {
         process: function(element,context) {
            context.revert = context._makeRestore(element);
            context._makeMark(element).exec();
            if (context.tts) {
               var text = element.getAttribute("alttext");
               if (!text || text=="") {
                  BookContext.speak(context,"mathematical expression",context.ttsCallback);
               } else {
                  BookContext.speak(context,text,context.ttsCallback);
               }
            }
            return false;
         },
         canDescend: function(e) { return false; }
      }
   },
   p: {
      "daisy-pagenum": {
         process: function(element,context) {
            context.revert = context._makeRestore(element);
            context._makeMark(element).exec();
            if (context.tts) {
               var text = element.textContent;
               if (text.indexOf("page")>=0 || text.indexOf("Page")>=0) {
                  BookContext.speak(context,text,context.ttsCallback);
               } else {
                  BookContext.speak(context,"page "+text,context.ttsCallback);
               }
            }
            return false;
         },
         canDescend: function(e) { return false; }
      },
      "daisy-p": {
         process: function(element,context) {
            var descend = this.canDescend(element);
            if (descend) {
               var component = null;
               var child = element.firstChild;
               while (child && !component) {
                  if (child.nodeType==1) {
                     component = child;
                  }
                  child = child.nextSibling;
               }
               context.element = component;
               context._handle();
               return context.descend;
            } else {
               context.revert = context._makeRestore(element);
               context._makeMark(element).exec();
               var text = BookContext.inlineText(element);
               context.console.debug("daisy-p handler: **** speaking para '" + text.slice(0, 10) + "...'");
               BookContext.speak(context,text,context.ttsCallback);
               return false;
            }
         },
         skipOnPrevious: BookContext.canMixedDescend,
         canDescend: BookContext.canMixedDescend
      },
      "daisy-li": {
         process: function(element,context) {
            var component = null;
            var child = element.firstChild;
            while (child && !component) {
               if (child.nodeType==1 && (child.getAttribute("class") || child.localName!="span" && child.getAttribute("class")!="daisy-w")) {
                  component = child;
               }
               child = child.nextSibling;
            }
            context.revert = context._makeRestore(element);
            context._makeMark(element).exec();
            if (component) {
               BookContext.speak(context,"Item",context.ttsCallback);
               return true;
            } else {
               var text = BookContext.inlineText(element);
               BookContext.speak(context,"Item, "+text,context.ttsCallback);
               return false;
            }
         },
         canDescend: function(element) {
            var component = null;
            var child = element.firstChild;
            while (child && !component) {
               if (child.nodeType==1 && (child.getAttribute("class")=="daisy-lic" || child.localName!="span" && child.getAttribute("class")!="daisy-w")) {
                  component = child;
               }
               child = child.nextSibling;
            }
            return component ? true : false;
         }
      },
      "daisy-caption": {
         process: function(element,context) {
            context.revert = context._makeRestore(element);
            context._makeMark(element).exec();
            BookContext.speak(context,"Caption, "+BookContext.inlineText(element),context.ttsCallback);
            return false;
         },
         canDescend: function(e) { return false; }
      },
      _: {
         process: function(element,context) {
            context.revert = context._makeRestore(element);
            context._makeMark(element).exec();
            BookContext.speak(context,BookContext.inlineText(element),context.ttsCallback);
            return false;
         },
         canDescend: function(e) { return false; }
      }
   },
   a: {
      _: {
         process: function(element,context) {
            context.revert = context._makeRestore(element);
            context._makeMark(element).exec();
            var role = element.getAttribute("role");
            if (!role || role.length==0) {
               role = "link";
            }
            var text = role+", ";

            var title = element.getAttribute("title");
            if (title && title.length>0) {
               if (role=="note") {
                  text = title+", ";
               } else {
                  text += title+", ";
               }
            }
            text += element.textContent;
            BookContext.speak(context,text,context.ttsCallback);
            return false;
         },
         canDescend: function(e) { return false; }
      }
   },
   span: {
      "math": {
         process: function(element,context) {
            var math = null;
            var child = element.firstChild;
            while (child && !math) {
               if (child.nodeType==1 && child.localName=="math") {
                  math = child;
               }
            }
            context.revert = context._makeRestore(element);
            context._makeMark(element).exec();
            if (math) {
               var text = math.getAttribute("alttext");
               if (!text || text=="") {
                  BookContext.speak(context,"mathematical expression",context.ttsCallback);
               } else {
                  BookContext.speak(context,text,context.ttsCallback);
               }
            } else {
               BookContext.speak(context,element.textContent,context.ttsCallback);
            }
            return false;
         },
         canDescend: function(element) { return false; }

      },
      _: BookContext.skipDescendants
   },
   h1: {
      _: BookContext.skipDescendants
   },
   h2: {
      _: BookContext.skipDescendants
   },
   h3: {
      _: BookContext.skipDescendants
   },
   h4: {
      _: BookContext.skipDescendants
   },
   h5: {
      _: BookContext.skipDescendants
   },
   h6: {
      _: BookContext.skipDescendants
   },
   table: {
      _: {
         process: function(element,context) {
            context.revert = context._makeRestore(element);
            context._makeMark(element).exec();
            var caption = null;
            var child = element.firstChild;
            while (!caption && child) {
               if (child.nodeType==1 && child.localName=="caption") {
                  caption = child;
               }
               child = child.nextSibling;
            }
            var text = "table, ";
            if (caption) {
               text += caption.textContent+", ";
            }
            text += "in navigation mode";
            BookContext.speak(context,text,context.ttsCallback);
            context.boundaryCount = 0;
            return true;
         },
         onEnd: function() { return "table complete"; },
         pause: function(e,context) { return true; },
         canDescend: function(e) { return true; }
      }
   },
   caption: {
      _: BookContext.skipDescendants
   },
   thead: BookContext.speakAndDescend("header","header complete"),
   tfoot: BookContext.speakAndDescend("footer","footer complete"),
   tbody: BookContext.speakAndDescend("body","body complete"),
   tr: BookContext.speakAndDescend("row"),
   th: {
      _: {
         process: function(element,context) {
            context.revert = context._makeRestore(element);
            context._makeMark(element).exec();
            var cellContent = BookContext.elementContent(element);
            BookContext.speak(context, "column heading, " + cellContent, context.ttsCallback);
            return false;
         },
         canDescend: function(e) { return false; }
      }
   },
   td: {
      _: {
         process: function(element,context) {
            context.revert = context._makeRestore(element);
            context._makeMark(element).exec();
            var descend = this.canDescend(element);
            if (context.tts) {
               if (descend) {
                  BookContext.speak(context,"cell, multiple items",context.ttsCallback);
               } else {
                  var cellContent = BookContext.elementContent(element);
                  BookContext.speak(context, "cell, " + cellContent, context.ttsCallback);
               }
            }
            return descend;
         },
         canDescend: function(element) {
            // if the table cell is mixed, then we have simple content (inlines)
            // and so we don't descend
            var mixed = false;
            var child = element.firstChild;
            while (child && !mixed) {
               if (child.nodeType!=1) {
                  var parts = child.textContent.split(/\s+/);
                  for (var i=0; !mixed && i<parts.length; i++) {
                     if (parts[i].length>0) {
                        mixed = true;
                     }
                  }
               }
               child = child.nextSibling;
            }
            if (!mixed) {
               // check for all inlines and return true only when there is a block element.
               var child = element.firstChild;
               while (child) {
                  if (child.nodeType==1 && !BookContext.isInline(child)) {
                     return true;
                  }
                  child = child.nextSibling;
               }
               return false;
            }
            return !mixed;
         }
      }
   },
   dl: {
      _: {
         process: function(element,context) {
            context.revert = context._makeRestore(element);
            context._makeMark(element).exec();
            BookContext.speak(context,"definition list",context.ttsCallback);
            return true;
         },
         canDescend: function(e) { return true; }
      }
   },
   dt: {
      _: {
         process: function(element,context) {
            context.revert = context._makeRestore(element);
            context._makeMark(element).exec();
            BookContext.speak(context,"term: "+element.textContent,context.ttsCallback);
            return false;
         },
         canDescend: function(e) { return false; }
      }
   },
   dd: {
      _: {
         process: function(element,context) {
            context.revert = context._makeRestore(element);
            context._makeMark(element).exec();
            BookContext.speak(context,"definition, "+element.textContent,context.ttsCallback);
            return false;
         },
         canDescend: function(e) { return false; }
      }
   },
   ul: {
      _: {
         process: function(element,context) {
            context.revert = context._makeRestore(element);
            context._makeMark(element).exec();
            var suffix = "";
            if (element.parentNode.localName=="li") {
               var list = element;
               var level = 0;
               while (list.parentNode.localName=="li") {
                  level++;
                  list = list.parentNode.parentNode;
               }
               suffix = ", level "+level;
            }
            BookContext.speak(context,"list"+suffix,context.ttsCallback);
            return true;
         },
         onEnd: function() { return "list complete"; },
         canDescend: function(e) { return true; }
      }
   },
   ol: {
      _: {
         process: function(element,context) {
            context.revert = context._makeRestore(element);
            context._makeMark(element).exec();
            var suffix = "";
            if (element.parentNode.localName=="li") {
               var list = element;
               var level = 0;
               while (list.parentNode.localName=="li") {
                  level++;
                  list = list.parentNode.parentNode;
               }
               suffix = ", level "+level;
            }
            BookContext.speak(context,"list"+suffix,context.ttsCallback);
            return true;
         },
         onEnd: function() { return "list complete"; },
         canDescend: function(e) { return true; }
      }
   },
   li: {
      _: {
         process: function(element,context) {
            context.revert = context._makeRestore(element);
            context._makeMark(element).exec();
            var descend = this.canDescend(element);
            var text = "item";
            if (element.parentNode.localName=="ol") {
               var count = 1;
               var li = element.previousSibling;
               while (li) {
                  if (li.nodeType==1) {
                     count++;
                  }
                  li = li.previousSibling;
               }
               text = count+"";
            }
            if (context.tts) {
               if (descend) {
                  BookContext.speak(context,text,context.ttsCallback);
               } else {
                  BookContext.speak(context,text+", "+BookContext.inlineText(element),context.ttsCallback);
               }
            }
            return descend;
         },
         canDescend: BookContext.canMixedDescend
      }
   },
   blockquote: BookContext.speakAndDescend("block quote","block quote complete"),
   div: {
      "daisy-sidebar": {
         process: function(element,context) {
            context.revert = context._makeRestore(element);
            context._makeMark(element).exec();
            var heading = element.firstChild;
            while (heading && heading.nodeType!=1) {
               heading = heading.nextSibling;
            }
            var suffix = "";
            if (heading) {
               var isHeading = BookContext.hasAttributeValue(heading, "class", "daisy-hd");
               var hasSkip = BookContext.hasAttributeValue(heading, "class", "daisy-skip");

               if (isHeading) {
                  suffix = ", "+heading.textContent;
                  if (!hasSkip) {
                     heading.className = className+" daisy-skip";
                  }
               }
            }

            BookContext.speak(context,"sidebar"+suffix,context.ttsCallback);
            return true;
         },
         onEnd: function() { return "sidebar complete"; },
         pause: function(e,context) { return context.owner.service.sidebarPause; },
         canDescend: function(e) { return true; }
      },
      "daisy-note-ref": BookContext.speakNote("note reference", "note reference complete"),
      "daisy-note": BookContext.speakNote("note", "note complete"),
      "daisy-annotation": BookContext.speakAndDescend("annotation",
          function(context,element) {
             if (context.referer) {
                element.style.display = "none";
                context.element = context.referer;
                context.referer = null;
             }
             return "annotation complete";
          }
      )._,
      "daisy-user-note-ref": BookContext.speakNote("user note", "user note complete"),
      "daisy-imggroup": {
         process: function(element,context) {
            var child = element.firstChild;
            var imgCount = 0;
            while (child) {
               if (child.nodeType==1 && child.localName=="img") {
                  imgCount++;
               }
               child = child.nextSibling;
            }
            if (imgCount!=1) {
               context.revert = context._makeRestore(element);
               context._makeMark(element).exec();
               BookContext.speak(context,"image group",context.ttsCallback);
               return true;
            } else {
               context._nextStructural();
               return context.descend;
            }
         },
         onEnd: function(context,e) {
            var child = e.firstChild;
            var imgCount = 0;
            while (child) {
               if (child.nodeType==1 && child.localName=="img") {
                  imgCount++;
               }
               child = child.nextSibling;
            }
            return imgCount==1 ? "image complete" : "image group complete";
         },
         canDescend: function(e) { return true; }
      },
      "daisy-prodnote": BookContext.speakAndDescend("producer's note")._,
      "daisy-list-pl": BookContext.speakAndDescend("list", "list complete")._,
      // TODO: We probably need the same handler for other elements rendered like <author>, but need test cases.
      // See dtbook2xhtml.xsl for list in template that matches "d:author"
      "daisy-author": {
          process: function(element,context) {
             context.revert = context._makeRestore(element);
             context._makeMark(element).exec();
             BookContext.speak(context, "Author, " + BookContext.inlineText(element), context.ttsCallback);
             return false;
          },
          canDescend: function(e) { return false; }
       },
      _: {
         process: function(element,context) {
            if (element.firstChild) {
               context._nextStructural();
               return context.descend;
            } else {
               BookContext.speak(context,"empty",context.ttsCallback);
               return false;
            }
         },
         skipOnPrevious: function() { return true; },
         canDescend: function(e) { return e.firstChild ? true : false; }
      }
   }
};

BookContext.prototype._makeRestore = function(element,action) {
   var current = this;
   return {
      className: element.className+"",
      element: element,
      exec: function() {
         current.console.debug("_makeRestore: Reverting to "+this.className);
         this.element.className = this.className;
         if (action) {
            action();
         }
         return 1;
      }
   };
};


BookContext.prototype._makeMark = function(element) {
   return {
      element: element,
      isNavigation: this.isNavigation,
      context: this,
      exec: function() {
         var window = this.element.ownerDocument.defaultView;
         var pageTop = window.scrollY+DAISYHelper.positionOffset-10;
         if (pageTop<0) {
            pageTop = 0;
         }
         var pageBottom = window.scrollY+window.innerHeight;
         var diff = 0;
         var yPos = findYPos(this.element);
         if (yPos>0) {
             this.context.console.debug("Starting scroll from _makeMark with yPos = " + yPos);
            if (this.isNavigation) {
               window.scrollOwner = this;
               window.location.hash = "#"+this.element.getAttribute("id");
               /*
               */
               var current = this;
               setTimeout(function() {
                  yPos -= DAISYHelper.positionOffset;
                  if (yPos<0) {
                     yPos = 0;
                  }
                  window.scrollOwner = current;
                  window.scroll(0,yPos);
               },250);
            } else {
               if (yPos<pageTop) {
                  //this.console.debug("Scrolling due to keyboard navigation")
                  yPos -= DAISYHelper.positionOffset;
                  window.scrollOwner = this;
                  window.scroll(0,yPos);
               } else if ((yPos+this.element.offsetHeight+30)>pageBottom) {
                  //this.console.debug("Scrolling as content is below viewport bottom")
                  diff = yPos+this.element.offsetHeight-pageBottom;
                  window.scrollOwner = this;
                  window.scroll(0,window.scrollY+diff+DAISYHelper.positionOffset);
               }
            }
         }
         this.context.console.log("_makeMark scrollOwner exists = " + (window.scrollOwner != null));
         this.element.className = this.element.className + " daisy-highlight";
         return -1;
      }
   };
};

BookContext.prototype._getHandler = function(e) {
   var handler = this.handlers[e.localName];
   if (handler) {
      var className = e.getAttribute("class");
      var names = className==null ? [] : className.split(" ");
      var classHandler  = null;
      for (var i=0; i<names.length && !classHandler; i++) {
         this.console.debug("_getHandler Class: "+names[i]);
         classHandler = handler[names[i]];
      }
      if (!classHandler) {
         var role = this.element.getAttribute("role");
         this.console.debug("_getHandler Role: "+role);
         classHandler = handler[role];
      }
      if (!classHandler && handler._) {
         classHandler = handler._;
      }
      return classHandler;
   }
   return null;
};

BookContext.prototype._handle = function() {
   this.yPos = findYPos(this.element);
   this.element.focus();
   var classHandler = this._getHandler(this.element);
   var handled = false;
   if (classHandler) {
      this.console.debug("_handle: Using class handler for "+this.element.localName);
      handled = true;
      this.descend = classHandler.process(this.element,this);
   } else {
      this.console.debug("_handle: No handler for "+this.element.localName);
   }
   if (!handled) {
      this.console.debug("_handle: Using default semantics for "+this.element.localName);
      this.revert = this._makeRestore(this.element);
      this._makeMark(this.element).exec();
      BookContext.speak(this,this.element.textContent,this.ttsCallback);
   }
   this.handler = classHandler;
//   this.console.debug("descend="+this.descend);
};

BookContext.prototype._canDisplay = function(element) {
   return (element.nodeType == 1 
      && element.offsetHeight > 0
      && element.localName != "br" 
      && element.localName != "col"
      && (element.localName != "a" || element.getAttribute("href"))
      && element.className.indexOf("daisy-skip")<0);
};

BookContext.prototype.nextWord = function(nostop) {
   if (!nostop) {
      this.stop();
   }
};

BookContext.prototype.previousWord = function(nostop) {
   if (!nostop) {
      this.stop();
   }
};

BookContext.prototype.reset = function() {
   this.console.debug("**** resetting highlight ****");
   if (this.revert) {
      this.revert.exec();
      this.revert = null;
   }
};

BookContext.prototype.stop = function() {};

/**
 * Stop the current running TTS, if there is any.
 */
BookContext.prototype.cancelTTS = function() {
	if (this.tts) {
		this.console.debug("Cancelling TTS.");
		this.tts.cancel();
	}
};

BookContext.prototype._getTableCell = function(e) {
   var cell = null;
   if (e.localName=="table") {
      var row = e.firstChild;
      while (row && (row.nodeType!=1 || (row.localName!="tr" && row.localName!="tbody"))) {
         row = row.nextSibling;
      }
      if (row && row.localName!="tr") {
         row = row.firstChild;
         while (row && (row.nodeType!=1 || row.localName!="tr")) {
            row = row.nextSibling;
         }
      }
      if (row) {
         e = row;
      }
   }

   if (e.localName=="tr") {
      cell = e.firstChild;
      while (cell && (cell.nodeType!=1 || (cell.localName!="td" && cell.localName!="th"))) {
         cell = cell.nextSibling;
      }
   } else {
      cell = e;
      while (cell && cell.localName!="td" && cell.localName!="th") {
         //this.console.debug(cell.localName);
         cell = cell.parentNode;
         if (cell.nodeType!=1) {
            cell = null;
         }
      }
   }
   return cell;
};

BookContext.prototype._getCellPosition = function(cell) {
   var pos = 0;
   while (cell) {
      var colspan = cell.getAttribute("colspan");
      pos += colspan ? parseInt(colspan) : 1;
      cell = cell.previousSibling;
      while (cell && cell.nodeType!=1) {
         cell = cell.previousSibling;
      }
   }
   return pos;
};

BookContext.prototype.currentLocation = function(nostop) {
   if (!nostop) {
      this.stop();
   }
   if (!this.element) {
      return;
   }

   this.cancelTTS();
   this.reset();

   var cell = this._getTableCell(this.element);
   if (cell) {
      this.setElement(cell,{ scroll: true, invoke: true });
   } else {
      this.setElement(this.element,{ scroll: true, invoke: true });
   }

};

BookContext.prototype._playNoLink = function(oncomplete) {
   if (this.soundManager) {
      var sound = this.soundManager.createSound({
         id: 'playback-no-link',
         url: this.sounds['no-link'],
         onfinish: function() {
            if (oncomplete) {
               oncomplete();
            }
         },
         autoPlay: false
      });
      sound.load();
      var waitFor = function() {
         if (sound.readyState==3) {
            sound.play();
         } else {
            setTimeout(waitFor,10);
         }
      };
      waitFor();
   }
};

BookContext.prototype._playTableBoundary = function(oncomplete) {
   if (this.soundManager) {
      var sound = this.soundManager.createSound({
         id: 'playback-table-boundary',
         url: this.sounds['table-boundary'],
         onfinish: function() {
            if (oncomplete) {
               oncomplete();
            }
         },
         autoPlay: false
      });
      sound.load();
      var waitFor = function() {
         if (sound.readyState==3) {
            sound.play();
         } else {
            setTimeout(waitFor,10);
         }
      };
      waitFor();
   }
};

BookContext.makeTableBoundarySkip = function(context) {
   var current = this;
   return function() {
      current.console.debug("context.boundaryCount="+context.boundaryCount);
      if (context.boundaryCount>=3) {
         context.boundaryCount = 0;
         current.console.debug("Skipping table due to boundary hit 3 times.");
         var cell = context._getTableCell(context.element);
         var table = cell.parentNode.parentNode;
         if (table.localName!="table") {
            table = table.parentNode;
         }
         context.element = table;
         BookContext.speak(context,"table complete",{
            QueryInterface: function(aIID) {
               if (aIID.equals(Components.interfaces.nsITTSCallback) ||
                  aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
                  aIID.equals(Components.interfaces.nsISupports)) {
                  return this;
               }
               throw Components.results.NS_NOINTERFACE;
            },
            onFinish: function(cancelled) {
               context._skip({ next: true, outOfContainer: true});
            }
         });
      }
   };
};


BookContext.prototype.nextTableCell = function(nostop) {
   if (!nostop) {
      this.stop();
   }
   if (!this.element) {
      return;
   }

   var cell = this._getTableCell(this.element);
   if (!cell) {
      return;
   }

   this.console.debug("In table cell, calculating next cell");

   cell = cell.nextSibling;
   while (cell && cell.nodeType!=1) {
      cell = cell.nextSibling;
   }

   if (cell) {
	  this.stop();
      this.setElement(cell,{ scroll: true, invoke: true });
   } else {
      this.boundaryCount++;
      this._playTableBoundary(BookContext.makeTableBoundarySkip(this));
   }

};

BookContext.prototype.previousTableCell = function() {
   if (!this.element) {
      return;
   }

   var cell = this._getTableCell(this.element);
   if (!cell) {
      return;
   }

   this.console.debug("In table cell, calculating previous cell");

   cell = cell.previousSibling;
   while (cell && cell.nodeType!=1) {
      cell = cell.previousSibling;
   }

   if (cell) {
	  this.stop();
      this.setElement(cell,{ scroll: true, invoke: true });
   } else {
      this.boundaryCount++;
      this._playTableBoundary(BookContext.makeTableBoundarySkip(this));
   }

};

BookContext.prototype.beneathTableCell = function(nostop) {
   if (!nostop) {
      this.stop();
   }

   if (!this.element) {
      return;
   }

   var cell = this._getTableCell(this.element);
   if (!cell) {
      return;
   }

   this.console.debug("In table cell, calculating beneath cell");

   var row = cell.parentNode;

   row = row.nextSibling;
   while (row && row.nodeType!=1) {
      row = row.nextSibling;
   }

   // if there is no next table row, find the next row in the next table part
   if (!row) {
      var seek = null;
      if (cell.parentNode.parentNode.localName=="thead") {
         seek = "tbody";
      } else if (cell.parentNode.parentNode.localName=="tbody") {
         seek = "tfoot";
      }
      if (seek) {
         // find the table part
         var table = cell.parentNode.parentNode.parentNode;
         var child = table.firstChild;
         while (!row && child) {
            if (child.nodeType==1 && child.localName==seek) {
               row = child;
            }
            child = child.nextSibling;
         }
         if (row) {
            // find the first row
            row = row.firstChild;
            while (row && (row.nodeType!=1 || row.localName!="tr")) {
               row = row.nextSibling;
            }
         }
      }
   }
   if (!row) {
      this.boundaryCount++;
      this._playTableBoundary(BookContext.makeTableBoundarySkip(this));
      return;
   }

   var currentPos = this._getCellPosition(cell);
   var pos = 0;
   var beneath = row.firstChild;
   while (beneath && beneath.nodeType!=1) {
      beneath = beneath.nextSibling;
   }
   while (beneath && pos<currentPos) {
      var colspan = beneath.getAttribute("colspan");
      pos += colspan ? parseInt(colspan) : 1;
      if (pos<currentPos) {
         beneath = beneath.nextSibling;
         while (beneath && beneath.nodeType!=1) {
            beneath = beneath.nextSibling;
         }
      }
   }

   if (beneath && pos>=currentPos) {
      this.setElement(beneath,{ scroll: true, invoke: true });
   }

};

BookContext.prototype.aboveTableCell = function(nostop) {
   if (!nostop) {
      this.stop();
   }
   if (!this.element) {
      return;
   }

   var cell = this._getTableCell(this.element);
   if (!cell) {
      return;
   }

   this.console.debug("In table cell, calculating above cell");

   var row = cell.parentNode;

   row = row.previousSibling;
   while (row && row.nodeType!=1) {
      row = row.previousSibling;
   }

   if (!row) {
      var seek = null;
      if (cell.parentNode.parentNode.localName=="tbody") {
         seek = "thead";
      } else if (cell.parentNode.parentNode.localName=="tfoot") {
         seek = "tbody";
      }
      if (seek) {
         // find the table part
         var table = cell.parentNode.parentNode.parentNode;
         var child = table.firstChild;
         while (!row && child) {
            if (child.nodeType==1 && child.localName==seek) {
               row = child;
            }
            child = child.nextSibling;
         }
         if (row) {
            // find the last row
            row = row.lastChild;
            while (row && (row.nodeType!=1 || row.localName!="tr")) {
               row = row.previousSibling;
            }
         }
      }
   }

   if (!row) {
      this.boundaryCount++;
      //this.console.debug("boundaryCount="+this.boundaryCount);
      this._playTableBoundary(BookContext.makeTableBoundarySkip(this));
      return;
   }

   var currentPos = this._getCellPosition(cell);
   var pos = 0;
   var above = row.firstChild;
   while (above && above.nodeType!=1) {
      above = above.nextSibling;
   }
   while (above && pos<currentPos) {
      var colspan = above.getAttribute("colspan");
      pos += colspan ? parseInt(colspan) : 1;
      if (pos<currentPos) {
         above = above.nextSibling;
         while (above && above.nodeType!=1) {
            above = above.nextSibling;
         }
      }
   }

   if (above && pos>=currentPos) {
      this.setElement(above,{ scroll: true, invoke: true });
   }
};

BookContext.prototype._playPause = function(handler) {
   if (this.soundManager) {
      var sound = this.soundManager.createSound({
         id: 'playback-auto-pause',
         url: this.sounds['auto-pause'],
         onfinish: null,
         autoPlay: false
      });
      sound.load();
      var waitFor = function() {
         if (sound.readyState==3) {
            sound.play();
         } else {
            setTimeout(waitFor,10);
         }
      };
      waitFor();
   }   
};

BookContext.prototype.skip = function(options) {
   var current = this;
   var isPlaying = this.playing;
   this.playing = false;

   if (options && options.nostop) {
      this.console.debug("skip: stopping play");
      this.stop();
   }
   this.cancelTTS();
   this.reset();

  options.play = options.play || isPlaying;
  this.console.debug("skip play: "+options.play);
  this._skip(options);
};

BookContext.prototype._skip = function(options) {
   var container = null;
   this.console.debug("_skip: options.next = " + options.next + ", options.play = " + options.play + ", this.descend = " + this.descend + ", options.nostop = " + options.nostop);
   this.console.debug("_skip: current element.id = " + this.element.id + ", element.localname = " + this.element.localName + ", element.className = " + this.element.className + ", location = " + this.locator(this.element));

   if (!options || options.next) {
	   container = this.getSkipContainer(this.element, options.outOfContainer);
	   
      // When we skip, we never want to descend, since we are explicitly going 'out of' some structure
      this.descend = false;
      
      if (container) {
         this.element = container;
      }
      this.doNextSkip(options && options.play);
      
   } else if (options.previous) {
      if (this.descend) {
         var prev = this.element.previousSibling;
         while (prev && prev.nodeType!=1) {
            prev = prev.previousSibling;
         }
         this.element = prev ? prev : this.element.parentNode;
         if (prev) {
            this.newPosition = true;
         }
      } else {
         this.element = this.element.parentNode;
      }
      this.previousStructural();
   }
};

/**
 * Find the skipable container that elements sits in, if any.
 * @param element a DOM element
 * @param alwaysSkipOut flag to say we should find the container of this element, whether it's considered skipable or not
 * @return an Element, or null if element is not something we need to skip out of
 */
BookContext.prototype.getSkipContainer = function(element, alwaysSkipOut) {
	var container = null;
	
	// If we're in a table or list, get its top-level structure element
    var current = element;
    while (current != this.top && !container) {
      if (current.localName=="ol" || current.localName=="ul" || current.localName=="table"
    	  || current.className.indexOf("daisy-list-pl") >= 0) {
          container = current;
      } else {
          current = current.parentNode;
      }
    }
    
    if (container) {
    	this.console.debug("skip container id = " + container.id + ", element id = " + element.id);
    } else {
    	this.console.debug("no skip container found for element id " + element.id);
    }
    return container;
};

/**
 * Handle what we should do once we've decided where we need to skip from.
 * @param playFlag whether or not we are in play mode
 */
BookContext.prototype.doNextSkip = function(playFlag) {
	if (playFlag) {
        this.paused = true;
        this.togglePlay();
    } else {
       this._nextStructural();
    }	
};

BookContext.prototype.nextStructural = function(nostop) {
   if (!nostop) {
      this.stop();
   }
   this.cancelTTS();
   this.reset();
   this._nextStructural();
};

BookContext.prototype._nextStructural = function() {
   if (!this.newPosition) {
      this.console.debug("nextStructural: "+this.locator(this.element)+", descend="+this.descend);
      // find next element in tree
      this.something = false;
      var next = this.descend ? this.element.firstChild : null;
      var last = this.element;
      while (!next || next.nodeType!=1 || !this._canDisplay(next)) {
         this.console.debug("nextStructural seek at "+this.locator(this.element));
         if (!next) {
            // no children, move to next sibling amongst ancestry
            this.console.debug("nextStructural: no immediate next, searching for next sibling among ancestors");
            while (!this.element.nextSibling && this.element != this.top) {
               this.element = this.element.parentNode;
               // check for on end text
               var classHandler = this._getHandler(this.element);
               if (classHandler.onEnd) {
                  var text = classHandler.onEnd(this,this.element);
                  if (text) {
                     this.console.debug("nextStructural: **** speaking '" + text.slice(0, 10) + "...'");
                     BookContext.speak(this,text,this.ttsCallback);
                     this.descend = false;
                     this.console.debug("nextStructural, onEnd at "+this.locator(this.element)+", descend="+this.descend);
                     return;
                  }
               }
            }
            next = this.element.nextSibling;
            this.console.debug("nextStructural: next sibling = " + this.locator(this.element));
         }
         while (next && (next.nodeType!=1 || !this._canDisplay(next))) {
            next = next.nextSibling;
         }
         if (!next && this.element!=this.top) {
            this.console.debug("nextStructural: No next child element, seeking to sibling");
            // ran out of child siblings (all non-elements) so move to next sibling sibling
            next = this.element.nextSibling;
            while (next && (next.nodeType!=1 || !this._canDisplay(next))) {
               next = next.nextSibling;
            }
         }
         if (!next && this.element!=this.top) {
            this.console.debug("nextStructural: No next sibling element, moving to parent");
            // ran out of element siblings so move to parent
            this.element = this.element.parentNode;
            // check for on end text
            var classHandler = this._getHandler(this.element);
            if (classHandler.onEnd) {
               var text = classHandler.onEnd(this,this.element);
               if (text) {
                  BookContext.speak(this,text,this.ttsCallback);
                  this.descend = false;
                  this.console.debug("nextStructural, onEnd at "+this.locator(this.element)+", descend="+this.descend);
                  return;
               }
            }
         }
         if (!next && this.element==this.top) {
            // there is no next so we're at the top
            break;
         }
      }
      this.descend = true;
      if (next) {
         this.console.debug("nextStructural current: "+this.element.parentNode.parentNode.localName+" > "+this.element.parentNode.localName+" > "+this.element.localName);
         this.console.debug("nextStructural next: "+next.parentNode.parentNode.localName+" > "+next.parentNode.localName+" > "+next.localName);
         if ((this.element.localName=="thead" || this.element.parentNode.localName=="thead" || this.element.parentNode.parentNode.localName=="thead") && 
             (next.localName=="tfoot" || next.parentNode.localName=="tfoot" || next.parentNode.parentNode.localName=="tfoot")) {
            var footer = next;
            next = next.nextSibling;
            while (next && next.nodeType!=1) {
               next = next.nextSibling;
            }
            this.element = next ? next : footer;
            if (next) {
               this.newPosition = true;
               this._nextStructural();
               return;
            }
         }
         this.something = true;
         this.element = next;
      } else if (!this.something && this.element==this.top) {
         // do not move if at the end.
         this.element = last;
         BookContext.speak(this,"End of Book",this.ttsCallback);
         this.stop();
         return;
      } else {
         return;
      }
   } else {
      this.newPosition = false;
   }
   var point = this._findNextNavigation();
   this.isNavigation = point && point.content.id==this.element.getAttribute("id");
   this.console.debug("next Structure is "+this.locator(this.element)+", point="+(point ? point.content.id : "")+", isNavigation="+this.isNavigation);
   this._handle();
};

BookContext.prototype.previousStructural = function(nostop) {
   if (!nostop) {
      this.stop();
   }
   this.cancelTTS();
   this.reset();
   if (!this.newPosition) {
      this.console.debug("previousStructural at "+this.locator(this.element)+", descend="+this.descend);
      // find next element in tree
      var prev = null;
      var movedToParent = false;
      var last = this.element;
      while (!prev || prev.nodeType!=1 || !this._canDisplay(prev)) {
         movedToParent = false;
         this.console.debug("previousStructural: seek at "+this.locator(this.element));
         if (!prev) {
            if (!this.element.previousSibling) {
               // no children, move to next sibling amongst ancestry
               while (!this.element.previousSibling && this.element!=this.top) {
                  this.element = this.element.parentNode;
               }
               var classHandler = this._getHandler(this.element);
               this.console.debug("previousStructural: Moved to parent "+this.locator(this.element)+", last="+this.locator(last));
               movedToParent = true;

               while (!prev && classHandler.skipOnPrevious && classHandler.skipOnPrevious(this.element) && this.element!=this.top) {
                  prev = this.element.previousSibling;
                  while (prev && prev.nodeType!=1) {
                     prev = prev.previousSibling;
                  }
                  if (prev) {
                     this.console.debug("previousStructural: found new previous "+this.locator(prev)+", last="+this.locator(last));
                     movedToParent = false;
                  } else {
                     movedToParent = true;
                     this.element = this.element.parentNode;
                     classHandler = this._getHandler(this.element);
                     this.console.debug("previousStructural: Moved to parent "+this.locator(this.element));
                  }
               }
               if (!prev) {
                  prev = this.element;
               }
               if (prev.firstChild==last && this.element!=this.top) {
                  this.console.debug("previousStructural: Looping to first child "+this.locator(last)+" detected, moving to ancestor.");
                  prev = prev.previousSibling;
                  while (!prev || prev.nodeType!=1) {
                     if (prev) {
                        prev = prev.previousSibling;
                     } else if (this.element.parentNode!=this.top) {
                        prev = this.element.parentNode;
                     }
                  }
                  movedToParent = false;
               }
            } else {
               prev = this.element.previousSibling;
            }
            this.console.debug("previousStructural: No previous, prev set to "+this.locator(prev)+", type="+prev.nodeType+", can display="+this._canDisplay(prev));
         }
         while (prev && (prev.nodeType!=1 || !this._canDisplay(prev))) {
            prev = prev.previousSibling;
         }
         this.console.debug("prev set to "+this.locator(prev));
         if (!prev && this.element!=this.top) {
            // no previous element sibling, move to parent
            this.element = this.element.parentNode;
            var classHandler = this._getHandler(this.element);
            this.console.debug("previousStructural: Moved to parent "+this.locator(this.element));
            movedToParent = true;

            while (!prev && classHandler.skipOnPrevious && classHandler.skipOnPrevious(this.element) && this.element!=this.top) {
               prev = this.element.previousSibling;
               while (prev && prev.nodeType!=1) {
                  prev = prev.previousSibling;
               }
               if (prev) {
                  movedToParent = false;
               } else {
                  movedToParent = true;
                  this.element = this.element.parentNode;
                  classHandler = this._getHandler(this.element);
                  this.console.debug("Moved to parent "+this.locator(this.element));
               }
            }
            if (!prev) {
               prev = this.element;
            }
         }
         if (!prev && this.element==this.top) {
            // there is no next so we're at the top
            break;
         }
      }
      this.descend = true;
      if (prev) {
         this.something = true;
         this.element = prev;
         if (this.element==this.top) {
            BookContext.speak(this,"Start of Book",this.ttsCallback);
            return;
         }
      } else if (this.something) {
         this.element = this.top;
         BookContext.speak(this,"Start of Book",this.ttsCallback);
         this.newPosition = true;
         return;
      } else {
         return;
      }
      if (!movedToParent) {
         this.element = this._findLastDescendant(this.element);
      }
   } else {
      this.newPosition = false;
   }
   var point = this._findPreviousNavigation();
   this.isNavigation = point && point.content.id==this.element.getAttribute("id");
   this.console.debug("previousStructural at "+this.locator(this.element)+", point="+(point ? point.content.id : "")+", isNavigation="+this.isNavigation);
   this._handle();
};

BookContext.prototype._findLastDescendant = function(element) {
   if (this._canDescend(element)) {
      // move to the last element in the tree
      var right = null;
      var next = element.firstChild;
      var last = null;
      while (next && !right) {
         // find the last element sibling
         var lastSibling = next.nodeType==1 ? next : null;
         while (next.nextSibling) {
            next = next.nextSibling;
            if (next.nodeType==1 && this._canDisplay(next)) {
               lastSibling = next;
            }
         }
         if (lastSibling) {
            if (this._canDescend(lastSibling)) {
               // descend into the last sibling
               last = lastSibling;
               next = lastSibling.firstChild;
            } else {
               // the last sibling is final right most element as we can't descend
               right = lastSibling;
            }
         } else if (last) {
            // set this.owner to the last found element in the tree
            right = last;
         } else {
            // we have no right most element so break
            break;
         }
      }
      return right ? right : element;
   } else {
      return element;
   }
};

BookContext.prototype._seekToLastDescendant = function(element) {
   // move to the last element in the tree
   var right = null;
   var next = element.lastChild;
   var last = null;
   while (next && !right) {
      // find the last element sibling
      var lastSibling = next;
      while (lastSibling && lastSibling.style && lastSibling.style.display=="none") {
         lastSibling = lastSibling.previousSibling;
      }
      if (lastSibling) {
         if (lastSibling.nodeType==1) {
            // descend into the last sibling
            last = lastSibling;
            next = lastSibling.lastChild;
         } else {
            // the last sibling is final right most element as we can't descend
            right = lastSibling;
         }
      } else if (last) {
         // set this.owner to the last found element in the tree
         right = last;
      } else {
         // we have no right most element so break
         break;
      }
   }
   return right ? right : element;
};

BookContext.prototype._findNextNavigation = function() {
   return this._getNextNavigationPoint(this.owner.context.currentPoint);
};

/**
 * Return the next DAISYNavigationPoint in a depth-first walk of the tree.
 * @param point a DAISYNavigationPoint
 * @return null if we are given a null starting point. At the end of the
 * tree walk just return the point that was passed in.
 */
BookContext.prototype._getNextNavigationPoint = function(point) {
	var nextPoint;
	
   if (point) {
      if (point.children.length > 0) {
         // move to first child if there is a child
         point = point.children[0];
      } else {
         // otherwise, move to first next sibling of self or ancestor
    	 nextPoint = point;
         while (!nextPoint.next && nextPoint.parent) {
        	 nextPoint = nextPoint.parent;
         }
         if (nextPoint.next) {
            point = nextPoint.next;
         } else {
            this.console.debug("findNextNavigation: End of navigation.");
         }
      }
      return point;
   } else {
      return null;
   }	
};

BookContext.prototype.nextNavigation = function(nostop) {
   if (!nostop) {
      this.stop();
   }
   this.owner.context.currentPoint = this._findNextNavigation();
   if (this.owner.context.currentPoint) {
      this.console.debug("nextNavigation: Moved to navigation point "+this.owner.context.currentPoint.content.id);
      this.owner.window.location.hash = "#"+this.owner.context.currentPoint.content.id;
      var target = this.owner.window.document.getElementById(this.owner.context.currentPoint.content.id);
      if (target) {
         //target = this.owner.seekNavigationStart(target);
         this.setElement(target,{ scroll: true, invoke: true });
         //this.nextStructural();
      }
   } else {
      this.console.debug("nextNavigation: No current point for next.");
   }
};

BookContext.prototype._findPreviousNavigation = function() {
   var point = this.owner.context.currentPoint;
   if (!point) {
      return null;
   }
   // otherwise, move to first previous sibling of an ancestor or self
   if (!point.previous && point.parent) {
      point = point.parent;
   } else if (point.previous) {
      // move to the previous sibling
      point = point.previous;
      // descend to right most descendant
      while (point.children.length>0) {
         point = point.children[0];
         while (point.next) {
            point = point.next;
         }
      }
   }
   return point;
};

BookContext.prototype.previousNavigation = function(nostop) {
   if (!nostop) {
      this.stop();
   }
   this.owner.context.currentPoint = this._findPreviousNavigation();
   if (this.owner.context.currentPoint) {
      this.console.debug("previousNavigation: Moved to navigation point "+this.owner.context.currentPoint.content.id);
      this.owner.window.location.hash = "#"+this.owner.context.currentPoint.content.id;
      var target = this.owner.window.document.getElementById(this.owner.context.currentPoint.content.id);
      if (target) {
         this.setElement(target,{ scroll: true, invoke: true });
      }
   } else {
      this.console.debug("previousNavigation: No current point for previous.");
   }
};

BookContext.prototype.nextLink = function(nostop) {
   if (!nostop) {
      this.stop();
   }
   if (!this.element) {
      return;
   }
   var current = this.element.firstChild ? this.element.firstChild : this.element.nextSibling;
   if (!current) {
      // there is no next sibling, seek to ancestor's next sibling
      current = this.element.parentNode;
      while (!current.nextSibling && current!=this.top) {
         current = current.parentNode;
      }
      if (current!=this.top) {
         current = current.nextSibling;
      }
   }
   // find the next link from the current position
   while (current && current!=this.top) {
      if (current.nodeType==1 && current.localName=="a") {
         if (current.className!=DAISYHelper.hackClassName) {
            this.setElement(current,{ scroll: true, invoke: true });
            return;
         }
      }
      if (current.firstChild) {
         // descend to first child
         current = current.firstChild;
      } else if (current.nextSibling) {
         // move to sibling
         current = current.nextSibling;
      } else {
         // find ancestor's next sibling
         current = current.parentNode;
         while (!current.nextSibling && current!=this.top) {
            current = current.parentNode;
         }
         if (current!=this.top) {
            current = current.nextSibling;
         }
      }
   }
   this._playNoLink();
};

BookContext.prototype.previousLink = function(nostop) {
   this.console.debug("previousLink: Start");
   if (!nostop) {
      this.stop();
   }
   if (!this.element) {
      this.console.debug("previousLink: no element");
      return;
   }
   var current = this.element;
   // find ancestor or self previous sibling
   while (!current.previousSibling && current!=this.top) {
      //this.console.debug("previousLink at "+this.locator(current)+", moving to parent");
      current = current.parentNode;
   }
   if (current!=this.top) {
      current = current.previousSibling;
      current = this._seekToLastDescendant(current);
   } else {
      //this.console.debug("previousLink: at top, no previous link");
      this._playNoLink();
      return;
   }
   //this.console.debug("previousLink at "+this.locator(current));

   // find the previous link from the current position
   while (current && current!=this.top) {
      //this.console.debug("previousLink at "+this.locator(current));
      if (current.nodeType==1 && current.localName=="a") {
         if (current.className!=DAISYHelper.hackClassName) {
            this.setElement(current,{ scroll: true, invoke: true });
            return;
         }
      }
      if (current.previousSibling) {
         // move to sibling
         //this.console.debug("previousLink previous sibling of "+this.locator(current));
         current = current.previousSibling;
         //this.console.debug("previousLink finding last descendant of "+this.locator(current));
         current = this._seekToLastDescendant(current);
      } else {
         // find ancestor's next sibling
         current = current.parentNode;
         //this.console.debug("previousLink moving to parent, "+this.locator(current));
         if (current.nodeType==1 && current.localName=="a") {
            this.setElement(current,{ scroll: true, invoke: true });
            return;
         }
         while (!current.previousSibling && current!=this.top) {
            current = current.parentNode;
            //this.console.debug("previousLink moving to parent, "+this.locator(current));
            if (current.nodeType==1 && current.localName=="a") {
               this.setElement(current,{ scroll: true, invoke: true });
               return;
            }
         }
         if (current!=this.top) {
            //this.console.debug("previousLink previous sibling of "+this.locator(current));
            current = current.previousSibling;
            //this.console.debug("previousLink finding last descendant of "+this.locator(current));
            current = this._seekToLastDescendant(current);
         }
      }
   }
   this._playNoLink();
};

BookContext.prototype.lockTTS = function() {
   var current = this;
   var lock = this.owner.service.getLockFor("tts");
   this.ownedLock = lock.acquire({
      exclusive: true,
      onRelinquish: function() {
         current.ownedLock = null;
         current.stop();
      }
   });
};


SMILPlayback.prototype = new BookContext();
SMILPlayback.prototype.constructor = SMILPlayback;
function SMILPlayback() {
   this.tm = Components.classes["@mozilla.org/thread-manager;1"].getService(Components.interfaces.nsIThreadManager);
   var current = this;
   this.ttsCallback = {
      thread: current.tm.currentThread,
      QueryInterface: function(aIID) {
         if (aIID.equals(Components.interfaces.nsITTSCallback) ||
            aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
            aIID.equals(Components.interfaces.nsISupports)) {
            return this;
         }
         throw Components.results.NS_NOINTERFACE;
      },
      onFinish: function(cancelled) {
         if (current.console._debug) {
            this.thread.dispatch({
               run: function() {
                  current.console.debug("SMILPlayback: Speech complete, playing="+current.playing);
               }
            },this.thread.DISPATCH_NORMAL);
         }
         this.thread.dispatch({
            run: function() {
               if (!cancelled) {
                  current.reset();
               }
            }
         },this.thread.DISPATCH_NORMAL);
      }
   };
}

SMILPlayback.prototype.togglePlay = function() {
   if (this.owner.context.playContext) {
      this.playing = false;
      this.owner.context.stop();
      this.owner.togglePlayButton(true);
      if (this.owner.context.options.context.element) {
         this.setElement(this.context.options.context.element);
      }
      if (this.ownedLock) {
         this.ownedLock.release();
      }
   } else {
      this.reset();
      this.lockTTS();
      try {
         this.owner.context.seek(this.element.getAttribute("id"));
         if (this.owner.context.playContext) {
            this.playing = true;
            this.owner.togglePlayButton(false);
         } else {
            // The current item failed to play, so play the next item
            this.owner.onNext();
         }
      } catch (ex) {
         this.console.log(ex);
      }
   }
};

SMILPlayback.prototype.next = function() {
   if (this.owner.context.currentPoint) {
      this.console.debug("SMILPlayback.next: at "+this.owner.context.currentPoint.content.id+", next="+this.owner.context.currentPoint.next);
   }
   this.owner.context.stop();
   this.reset();
   this.lockTTS();

   var current = this.owner;
   var tm = Components.classes["@mozilla.org/thread-manager;1"].getService(Components.interfaces.nsIThreadManager);
   var operation = {
      run: function() {
         current.context.next();
         if (current.context.currentPoint) {
            current.console.debug("SMILPlayback: After next at "+current.context.currentPoint.content.id);
         }
         if (current.context.playContext) {
            current.togglePlayButton(false);
         } else {
            current.togglePlayButton(true);
            if (current.context.currentPoint) {
               // the play failed because the target could not be found, since
               // there is a context, try again
               current.timer = setTimeout(function() {
                  tm.currentThread.dispatch(operation,tm.currentThread.DISPATCH_NORMAL);
               },250);
            }
         }
      }
   };
   current.timer = setTimeout(function() {
      tm.currentThread.dispatch(operation,tm.currentThread.DISPATCH_NORMAL);
   },250);
   
};

SMILPlayback.prototype.previous = function() {
   this.owner.context.stop();
   this.reset();
   this.lockTTS();

   var current = this.owner;
   var tm = Components.classes["@mozilla.org/thread-manager;1"].getService(Components.interfaces.nsIThreadManager);
   var operation = {
      run: function() {
         current.context.previous();
         if (current.context.playContext) {
            current.togglePlayButton(false);
         } else {
            current.togglePlayButton(true);
            if (current.context.currentPoint) {
               // the play failed because the target could not be found, since
               // there is a context, try again
               current.timer = setTimeout(function() {
                  tm.currentThread.dispatch(operation,tm.currentThread.DISPATCH_NORMAL);
               },250);
            }
         }
      }
   };
   current.timer = setTimeout(function() {
      tm.currentThread.dispatch(operation,tm.currentThread.DISPATCH_NORMAL);
   },250);
};

SMILPlayback.prototype.stop = function() {
   this.owner.context.stop();
   this.owner.togglePlayButton(true);
};


StructuralPlayback.prototype = new BookContext();
StructuralPlayback.prototype.constructor = StructuralPlayback;
function StructuralPlayback() {
   this.tm = Components.classes["@mozilla.org/thread-manager;1"].getService(Components.interfaces.nsIThreadManager);
   this.playing = false;
   var current = this;
   this.ttsCallback = {
      thread: current.tm.currentThread,
      QueryInterface: function(aIID) {
         if (aIID.equals(Components.interfaces.nsITTSCallback) ||
            aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
            aIID.equals(Components.interfaces.nsISupports)) {
            return this;
         }
         throw Components.results.NS_NOINTERFACE;
      },
      onFinish: function(cancelled) {
         if (current.console._debug) {
        	 var currentPlaying = current.playing;
            this.thread.dispatch({
               run: function() {
                  current.console.debug("StructuralPlayback: Speech complete, playing=" + currentPlaying);
               }
            },this.thread.DISPATCH_NORMAL);
         }
         if (current.playing) {
            var dispatch = function() {
               current.pauseTimer = null;
               current.nextOperation();
            };
            if (current.owner.service.playbackPause>0) {
               try {
                  this.thread.dispatch({
                     run: function() {
                        current.console.debug("StructuralPlayback: Pause: "+current.owner.service.playbackPause);
                        current.pauseTimer = setTimeout(dispatch, current.owner.service.playbackPause);
                     }
                  },this.thread.DISPATCH_NORMAL);
               } catch (ex) {
                  current.console.log("StructuralPlayback: **** Dispatching nextOperation after exception: " + ex);
                  dispatch();
               }
            } else {
               this.thread.dispatch({
                  run: function() {
                     dispatch();
                  }
               },this.thread.DISPATCH_NORMAL);
            }
         } else {
            this.thread.dispatch({
               run: function() {
                  if (!cancelled) {
                     current.reset();
                  }
                  current.console.debug("StructuralPlayback: No longer playing, playback stopped.");
               }
            },this.thread.DISPATCH_NORMAL);
         }
      }
   };
}

StructuralPlayback.prototype.nextOperation = function() {
   var current = this;
   // We need to cancel any operation waiting in the pause interval
   // so that we don't mess up the TTS.
   if (this.pauseTimer) {
      this.console.debug("StructuralPlayback.nextOperation: Stopping a pause period operation.");
      clearTimeout(this.pauseTimer);
   }
   var operation = {
      run: function() {
         current.console.debug(">>>> nextOperation(), current.playing="+current.playing + ", current.paused=" + current.paused + ", current.handler = " + (current.handler ? "(something)" : "null"));
         if (current.playing) {
            if (!current.paused && current.handler && current.handler.pause && current.handler.pause(current.element, current)) {
               current.reset();
               current.playing = false;
               current.paused = true;
               current.owner.togglePlayButton(true);
               current._playPause(current.handler);
               return;
            }
            current.paused = false;
            current.nextStructural(true);
         } else {
            current.reset();
         }
         current.console.debug("<<<< nextOperation() finished");
      }
   };
   this.tm.currentThread.dispatch(operation, this.tm.currentThread.DISPATCH_NORMAL);
};

StructuralPlayback.prototype.togglePlay = function() {
   if (this.playing) {
      this.console.debug("togglePlay: Pausing");
      this.playing = false;
      this.cancelTTS();
      this.owner.togglePlayButton(true);
      if (this.ownedLock) {
         this.ownedLock.release();
      }
      var current = this;
      setTimeout(function() {
         current.markPosition();
      },500);
   } else {
      this.console.debug("togglePlay: Resuming");
      this.lockTTS();
      this.reset();
      this.owner.togglePlayButton(false);
      this.playing = true;
      if (!this.paused) {
         this.newPosition = true;
      }
      this.nextOperation();
   }
};

StructuralPlayback.prototype.next = function() {
   this.stop();
   this.reset();
   var current = this;
   this.nextTimer = setTimeout(function() {
      current.nextTimer = null;
      current.owner.context.currentPoint = current._findNextNavigation();
      if (current.owner.context.currentPoint) {
         current.console.debug("StructuralPlayback.next: Moved to navigation point "+current.owner.context.currentPoint.content.id);
         current.owner.window.location.hash = "#"+current.owner.context.currentPoint.content.id;
         var target = current.owner.window.document.getElementById(current.owner.context.currentPoint.content.id);
         if (target) {
            current.setElement(target,{ scroll: true, newPosition: true });
         }
         current.togglePlay();
      } else {
         current.console.debug("StructuralPlayback.next: No current point for next.");
      }
   },500);
};

StructuralPlayback.prototype.previous = function() {
   this.stop();
   this.reset();
   var current = this;
   this.prevTimer = setTimeout(function() {
      current.prevTimer = null;
      current.owner.context.currentPoint = current._findPreviousNavigation();
      if (current.owner.context.currentPoint) {
         current.console.debug("StructuralPlayback.previous: Moved to navigation point "+current.owner.context.currentPoint.content.id);
         current.owner.window.location.hash = "#"+current.owner.context.currentPoint.content.id;
         var target = current.owner.window.document.getElementById(current.owner.context.currentPoint.content.id);
         if (target) {
            current.setElement(target,{ scroll: true, newPosition: true });
         }
         current.togglePlay();
      } else {
         current.console.debug("StructuralPlayback.previous: No current point for previous.");
      }
   },500);
};

StructuralPlayback.prototype.stop = function() {
   this.console.debug("StructuralPlayback.stop");
   this.playing = false;
   this.cancelTTS();
   this.reset();
   this.owner.togglePlayButton(true);
   if (this.ownedLock && this.ownedLock.lock.owner) {
      this.ownedLock.release();
   }
   this.ownedLock = null;
   var current = this;
   setTimeout(function() {
      current.markPosition();
   },500);
};
