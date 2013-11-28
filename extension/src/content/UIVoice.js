/**
 * Provide TTS descriptions of UI widgets.
 * The object is aware of voice mode settings stored by DAISYService
 * to know when voicing is appropriate.
 */
function UIVoice() {
   this.voiceable = [ "button", 
                     "checkbox", 
                     "toolbarbutton", 
                     "textbox", 
                     "scale", 
                     "listbox", 
                     "radiogroup", 
                     "description",
                     "label",
                     "caption",
                     "menulist"
                      ];
   this.voicingModes = [];
   this.labels = {};
   this.voiced = {};
}

UIVoice.codePointNames = [
   { start: 9, map: ["tab", "line feed"]},
   { start: 13, map: ["carriage return"]},
   { start: 32, map: [ "space", "exclamation", "double quote", "hash", "dollar", "percent", "ampersand", "single quote", "left paren", "right paren",
                       "asterik", "plus", "comma", "minus", "period", "slash"]},
   { start: 58, map: [ "colon", "semicolon", "less than", "equals", "greater than", "question mark", "at sign"]},
   { start: 91, map: [ "left square bracket", "backslash", "right square bracket", "circumflex", "underscore", "grave",]},
   { start: 123, map: [ "left curly bracket", "vertical line", "right curly bracket", "tilde"]}

];

UIVoice.prototype.init = function(voicingModes) {
   var theClass = Components.classes["@benetech.org/daisy;1"];
   var theComponent = theClass.getService(Components.interfaces.nsISupports);
   this.service = theComponent.wrappedJSObject;
   
   if (voicingModes) {
      this.voicingModes = voicingModes;
   } else {
      // Default voicing is only if "Comprehensive" is turned on.
      this.voicingModes.push(this.service.voicingComprehensive());
   }   
}

/**
 * Assign some introductory text to be included the first time 
 * anything is spoken.
 */
UIVoice.prototype.introduce = function(text) {
   this.introText = text;
   this.introduced = false;
}

UIVoice.prototype.makeCallback = function(operation) {
   var ttsCallback = {
      QueryInterface: function(aIID) {
         if (aIID.equals(Components.interfaces.nsITTSCallback) ||
            aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
            aIID.equals(Components.interfaces.nsISupports)) {
            return this;
         }
         throw Components.results.NS_NOINTERFACE;
      },
      onFinish: function() {
         operation();
      }
   };
   return ttsCallback;
}

UIVoice.prototype.speak = function(text, callback) {
   this.cancelling = false;
   var lock = this.service.getLockFor("tts");
   var current = this;
   this.ownedLock = lock.acquire({
      exclusive: true,
      onRelinquish: function() {
         current.cancelling = true;
         current.cancel();
      }
   });
   
   // Prepend an intro if appropriate
   var spokenText = text;
   if (this.introText && !this.introduced) {
      this.introduced = true;
      spokenText = this.introText + ", " + text;
   }
   
   this.service.tts.speak(spokenText, this.makeCallback(function() {
      if (!current.cancelling && callback) {
         current.ownedLock.release();
         callback.onFinish();
      }
   }));
}

UIVoice.prototype.cancel = function() {
   if (this.service.tts) {
      this.service.tts.cancel();
      if (this.ownedLock) {
         this.ownedLock.release();
         this.ownedLock = null;
      }
   }
}

/**
 * Place event handlers on all of the menus underneath menuBar
 * to voice them when they are selected.
 */
UIVoice.prototype.attachMenus = function(menuBar) {
   if (menuBar) {
      var current = this;
      
      // Capture menu selection for all child elements of the menu bar
      menuBar.addEventListener("DOMMenuItemActive", function(event) {
            current.voice(event.target);
      }, false);
   }   
}

/**
 * Place event handlers on all of the controls underneath the parent node
 * to be able to voice them either on focus or on keyboard events.
 */
UIVoice.prototype.attach = function(parent) {
   var uivoice = this;
   var current = parent.firstChild;
   while (current != parent) {
      if (current.nodeType==1) {
         var isVoiceable = false;
         for (var i=0; !isVoiceable && i<this.voiceable.length; i++) {
            if (current.localName==this.voiceable[i]) {
               isVoiceable = true;
            }
         }
         if (isVoiceable) {
            current.onfocus = function(event) {
               uivoice.voice(this);
            }
            if (current.localName=="checkbox") {
               current.onkeypress = function(event) {
                  this.lastCharCode = event.charCode;
               }
               current.onkeyup = function(event) {
                  if (this.lastCharCode==32) {
                     uivoice.voiceCheckboxState(this);
                  }
               }
            } else if (current.localName === "radiogroup") {
               current.onkeypress = function(event) {
                  uivoice.voice(event.target);
               }
            } else if (current.localName=="scale") {
               current.onkeypress = function(event) {
                  if (event.keyCode==39) {
                     uivoice.voiceScaleChange(true,this.value);
                  } else if (event.keyCode==37) {
                     uivoice.voiceScaleChange(false,this.value);
                  }
               }
            } else if (current.localName == "listbox" || current.localName == "menulist") {
               current.onkeypress = function(event) {
                  this.lastKeyCode = event.keyCode;
               }
               current.onkeyup = function(event) {
                  switch (this.lastKeyCode) {
                     case 37: // left
                     case 38: // up
                     case 39: // right
                     case 40: // down
                        if (this.selectedItem) {
                           uivoice.voiceText("item, "+this.selectedItem.label);
                        }
                        break;
                  }
               };
            } else if (current.localName=="textbox" && current.getAttribute("type")!="password") {
               current.onkeypress = function(event) {
                  if (!event.shiftKey) {
                     this.selecting = 0;
                  }
                  //Console.log("pos: "+this.selectionStart+", "+this.selectionEnd+", length="+this.value.length);
                  //Console.log("key: "+event.keyCode+", char:"+event.charCode);
                  if ((event.metaKey && event.charCode==122) || (event.ctrlKey && event.charCode==122)) {
                     uivoice.voiceText("undo");
                  } else if (event.ctrlKey && event.altKey && event.charCode==115) {
                     uivoice.voiceText(this.value);
                  } else if (!event.altKey && !event.ctrlKey && !event.metaKey && event.charCode>0) {
                     var text = uivoice.getCharacterName(String.fromCharCode(event.charCode))
                     uivoice.voiceText(text);
                  } else if (!event.altKey && !event.ctrlKey && !event.metaKey && event.keyCode>0) {
                     if (event.keyCode==13 || event.keyCode==10) {
                        // carriage returns get turned into line feeds
                        uivoice.voiceText("line feed");
                     } else if (event.keyCode==8 && this.value.length>0) {
                        if (this.selectionStart==this.selectionEnd) {
                           var text = uivoice.getCharacterName(this.value.substring(this.selectionStart-1,this.selectionStart));
                           uivoice.voiceText(text);
                        } else {
                           uivoice.voiceText("Selection deleted");
                        }
                     } else if (event.shiftKey && event.keyCode==37) {
                        // left select
                        if (this.selectionStart==this.selectionEnd) {
                           this.selecting = -1;
                        }
                        if (this.selecting<0) {
                           if (this.selectionStart>0) {
                              var text = uivoice.getCharacterName(this.value.substring(this.selectionStart-1,this.selectionStart));
                              uivoice.voiceText(text);
                           }
                        } else {
                           var text = uivoice.getCharacterName(this.value.substring(this.selectionEnd-1,this.selectionEnd));
                           uivoice.voiceText(text);
                        }
                     } else if (event.shiftKey && event.keyCode==39) {
                        // right select
                        if (this.selectionStart==this.selectionEnd) {
                           this.selecting = 1;
                        }
                        if (this.selecting<0) {
                           if (this.selectionStart>0) {
                              var text = uivoice.getCharacterName(this.value.substring(this.selectionStart,this.selectionStart+1));
                              uivoice.voiceText(text);
                           }
                        } else {
                           var text = uivoice.getCharacterName(this.value.substring(this.selectionEnd,this.selectionEnd+1));
                           uivoice.voiceText(text);
                        }
                     } else if (event.keyCode==37) {
                        if (this.selectionStart>0) {
                           var text = uivoice.getCharacterName(this.value.substring(this.selectionStart-1,this.selectionStart));
                           uivoice.voiceText(text);
                        }
                     } else if (event.keyCode==39) {
                        // right select
                        if (this.selectionStart<this.value.length) {
                           var text = uivoice.getCharacterName(this.value.substring(this.selectionStart,this.selectionStart+1));
                           uivoice.voiceText(text);
                        }
                     }

                  }
               }
            } else if (current.localName=="textbox") {
               // a password entry
               current.onkeypress = function(event) {
                  if (!event.shiftKey) {
                     this.selecting = 0;
                  }
                  if (event.metaKey && event.charCode==122) {
                     uivoice.voiceText("undo");
                  } else if (!event.altKey && !event.ctrlKey && !event.metaKey && event.charCode>0) {
                     uivoice.voiceText("star");
                  } else if (!event.altKey && !event.ctrlKey && !event.metaKey && event.keyCode>0) {
                     if (event.keyCode==8 && this.value.length>0) {
                        if (this.selectionStart==this.selectionEnd) {
                           uivoice.voiceText("delete");
                        } else {
                           uivoice.voiceText("Selection deleted");
                        }
                     }
                  }
               }
            }
         } else if (current.firstChild) {
            current = current.firstChild;
            continue;
         }
      }

      if (current.nextSibling) {
         current = current.nextSibling;
      } else {
         while (!current.nextSibling && current!=parent) {
            current = current.parentNode;
         }
         if (current!=parent) {
            current = current.nextSibling;
         }
      }
   }
}

/**
 * If the self-voicing is turned on, speak text appropriate to the given element.
 */
UIVoice.prototype.voice = function(element) {
   if (this.service.isMuted()) {
      return;
   }

   if (element.localName === "menu" || element.localName.toLowerCase() === "menuitem") {
      this.voiceMenu(element);
   } else {
      this.voiceControls(element);
   }
}

/**
 * Speak descriptions of browser menus.
 * Only speaks if the voicing mode is "Comprehensive."
 */
UIVoice.prototype.voiceMenu = function(element) {
   if (!this.shouldVoice()) {
      return;
   }
   
   var text = "";
   
   if (element.localName === "menu" || element.localName.toLowerCase() === "menuitem") {
      // Menus created with 'appendItem' or with icons or other oddities
      // have their text in the attributes array instead of in the label property
      var labelAttr = null;
      for (var i = 0; i < element.attributes.length; i++) {
         if (element.attributes[i].localName === "label") {
            labelAttr = element.attributes[i];
         }
      }
      
      text = element.label;
      if ((!text || text.length === 0) && labelAttr.value) {
         text = labelAttr.value;
      }
   }
   // Identify top-level menus and sub-menus.
   if (element.localName === "menu") {
      if (element.parentNode && element.parentNode.localName === "menupopup") {
         text = text + " sub-menu";
      } else {
         text = text + " menu";
      }
   }
   
   this.speak(text);   
}

/**
 * Speak description of a UI element (other than menus).
 * Only speaks if the voicing mode is "Books and Navigation."
 */
UIVoice.prototype.voiceControls = function(element) {
   if (!this.shouldVoice()) {
      return;
   }
   
   var text = element.getAttribute("tooltiptext");
   if (!text || text=="") {
      text = element.getAttribute("label");
   }
   
   if (element.getAttribute("id") == "book-toc" && element.localName == "tree") {
      var currentIndex = element.view.selection.currentIndex;
      var pos = parseInt(element.view.getCellValue(currentIndex, element.columns.getFirstColumn()));
      text = current.bookSpec.tocData[pos].point.labels[0].text;
      
      if (element.view.isContainer(currentIndex)) {
         text += ", item has children, ";
         if (element.view.isContainerOpen(currentIndex)) {
            text += ", is open";
         } else {
            text += ", is closed";
         }
      }
   } else if (element.localName=="button" || element.localName=="toolbarbutton") {
      text = "Button, " + text;
   } else if (element.localName=="checkbox") {
      text = "Checkbox, " + text + " , " + (element.checked ? "checked" : "not checked");
   } else if (element.localName=="scale") {
      text = "Slider, " + text + " , value " + element.value;
   } else if (element.localName=="textbox") {
      text = "Text box, " + text + " , value " + element.value;
   } else if (element.localName=="listbox") {
      text = "list box, " + text;
      if (element.selectedItem) {
         text += element.selectedItem.label;
      }
   } else if (element.localName === "description") {
      text = "Description, " + element.value;
   } else if (element.localName === "label") {
      text = "Label, " + element.value;
   } else if (element.localName === "caption") {
      text = "Caption for " + element.parentNode.localName + ", " + element.label;
   } else if (element.localName === "radiogroup") {
      text = "Group of " + element.childNodes.length + " radio buttons. ";
      text += "Radio button selected is number " + (element.selectedIndex+1);
      text += ", " + element.selectedItem.label;
   } else if (element.localName === "menulist") {
      text = "Drop down menu, " + text + ", with " + element.firstChild.childNodes.length + " choices. ";
      text += "Selected value is " + element.selectedItem.label;
   }
   this.speak(text,null);
}

UIVoice.prototype.voiceCheckboxState = function(element) {
   if (!this.shouldVoice()) {
      return;
   }
   this.speak(element.checked ? "checked" : "not checked",null);
}

UIVoice.prototype.voiceScaleChange = function(increment,value) {
   if (!this.shouldVoice()) {
      return;
   }
   this.speak((increment ? "increment to " : "decrement to ")+"value "+value,null);
}

UIVoice.prototype.voiceText = function(text) {
   if (!this.shouldVoice()) {
      return;
   }
   this.speak(text, null);
}

UIVoice.prototype.voiceMode = function(mode) {
   // We want this to be voice no matter what the mode setting is
   // so we'll use the speak() fn directly.
   if (mode === "voicing-comprehensive") {
      this.speak("Comprehensive");
   } else if (mode === "voicing-books") {
      this.speak("Book navigation only");
   } else if (mode === "voicing-mute") {
      this.speak("Mute");
   }
}

/**
 * Check whether the current voicing mode is one we are configured for.
 */
UIVoice.prototype.shouldVoice = function() {
   var currentMode = this.service.voicingMode;
   var result = false;
   if (this.service.voicingEnabled) {
	   for (var i = 0; i < this.voicingModes.length; i++) {
	      if (currentMode == this.voicingModes[i]) {
	         result = true;
	         break;
	      }
	   }
   }   
   return result;
}

UIVoice.prototype.getCharacterName = function(s) {
   var c = null;
   if (s.charCodeAt) {
      c = s.charCodeAt(0)
   } else {
      c = s;
   }
   for (var i=0; i<UIVoice.codePointNames.length; i++) {
      if (c<UIVoice.codePointNames[i].start) {
         return s;
      } else if (c<(UIVoice.codePointNames[i].start+UIVoice.codePointNames[i].map.length)) {
         return UIVoice.codePointNames[i].map[c-UIVoice.codePointNames[i].start];
      }
   }
   return s;
}