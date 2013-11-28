Controls.prototype = new Settings();
Controls.prototype.constructor = Controls;

Controls.ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
Controls.fileURL = function(file) {
   return Controls.ios.newFileURI(file);
}


function Controls() {
   this._windowMediator = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
   this.app = Components.classes["@mozilla.org/fuel/application;1"].getService(Components.interfaces.fuelIApplication);
   this.libraryDir = this._getPreferenceString("daisy.library.","dir");
   if (!this.libraryDir) {
      var dirService = Components.classes['@mozilla.org/file/directory_service;1'].getService(Components.interfaces.nsIProperties);
      var dir = dirService.get("Desk", Components.interfaces.nsILocalFile);
      dir.appendRelativePath("mydaisy");
      if (!dir.exists()) {
         dir.create(Components.interfaces.nsIFile.DIRECTORY_TYPE,0700);
      }
      this.libraryDir = dir.path;
   }
   this.console.log("Library directory is "+this.libraryDir);
   this.library = this.service.getLibrary(this.libraryDir);
   if (!this.library) {
      alert("Library directory "+this.libraryDir+" does not exist.");
   }
   this.renderer = this.service.createRenderer();
   this.renderer.setSMILTransform("chrome://daisy/content/daisy/dtbook2smil.xsl");
   this.renderer.setXHTMLTransform("chrome://daisy/content/daisy/dtbook2xhtml.xsl");
   var extManager = Components.classes["@mozilla.org/extensions/manager;1"].getService(Components.interfaces.nsIExtensionManager);
   // the path may use forward slash ("/") as the delimiter
   // returns nsIFile for the extension's install.rdf

   this.generateSMIL = false;
   this.focusFollow = false;
   this.galleyView = false;
   this.highlight = true;
   this.sound = true;
   this.useTTS = false;

   var current = this;
   document.getElementById("galley-format").addEventListener("click",function() {
      current.galleyView = true;
   },false);
   document.getElementById("rendered-format").addEventListener("click",function() {
      current.galleyView = false;
   },false);

   var debugControl = document.getElementById("debug-checkbox");
   debugControl.addEventListener("click",function() {
      current.service.debug = debugControl.checked;
   },false);
   var focusControl = document.getElementById("focus-checkbox");
   focusControl.addEventListener("click",function() {
      current.focusFollow = focusControl.checked;
   },false);
   var highlightControl = document.getElementById("highlight-checkbox");
   highlightControl.addEventListener("click",function() {
      current.highlight = highlightControl.checked;
   },false);
   var selectTextControl = document.getElementById("selecttext-checkbox");
   selectTextControl.addEventListener("click",function() {
      current.service.smil.selectHighlight = selectTextControl.checked;
   },false);
   var soundControl = document.getElementById("sound-checkbox");
   soundControl.addEventListener("click",function() {
      current.sound = soundControl.checked;
   },false);
   var generateSMILControl = document.getElementById("generate-smil-checkbox");
   generateSMILControl.addEventListener("click",function() {
      current.generateSMIL = generateSMILControl.checked;
   },false);
   var ttsControl = document.getElementById("tts-checkbox");
   ttsControl.addEventListener("click",function() {
      current.useTTS = ttsControl.checked;
   },false);

   var highlightTime = document.getElementById("highlight-time");
   highlightTime.onchange = function() {
      document.getElementById("highlight-time-display").value = highlightTime.value+" seconds";
      current.service.smil.textOnlyPause = parseInt(highlightTime.value)*1000;
   }
   var quirksControl = document.getElementById("quirks-checkbox");
   quirksControl.addEventListener("click",function() {
      current.service.allowQuirks = quirksControl.checked;
   },false);
}

Controls.getInstance = function() {
   if (!Controls.instance) {
      Controls.instance = new Controls();
   }
   return Controls.instance;
}

Controls.prototype.init = function() {
   this.filename = document.getElementById("filename");
   this.booklist = document.getElementById("booklist");
   var current = this;
   this.booklist.ondblclick = function() {
      var book = current.library.findByURI(current.booklist.selectedItem.value);
      if (book) {
         current.openBook(book);
      }
   };

   for (var i=0; i<this.library.books.length; i++) {
      this.showBook(this.library.books[i]);
   }
}

Controls.prototype.addBook = function(filename) {
   if (!filename) {
      filename = this.filename.value;
   }
   if (!filename || filename.length==0) {
      return;
   }
   try {
      var book = this.library.addBookFromZip(filename);
      this.showBook(book);
   } catch (ex) {
      alert(ex);
   }
}

Controls.prototype.showBook = function(book) {
   //book.loadMetadata();
   this.booklist.appendItem(book.title,book.uris["opf"]);
}

Controls.prototype.openBook = function(book) {
   if (!book) {
      return;
   }
   if (!this.service.isExtracted(book)) {
      var password = prompt("Password for "+book.title+"?");
      // TODO: need password
      var targetDir = this.service.getBookDirectory(book);
      this.service.extract(book.zipFile,targetDir,password);
      if (!this.service.isExtracted(book)) {
         alert("Cannot extract book "+book.title);
         return;
      }
   }

   if (this.galleyView) {
      this.openGalleyView(book);
   } else {
      this.openRenderedView(book,book.loadNavigation());
   }
}

Controls.prototype.openGalleyView = function(book) {
   var galleyURL = Controls.fileURL(this.galleyFile).spec;
   this.tab = this._newTab(galleyURL);
   this.tab.setLabel(book.title);
   var current = this;
   this.tab.waitFor(function() {
      current.tab.document.defaultView.focus();
      current.tab.setLabel(book.title);
      var soundToggle = current.tab.document.getElementById("sound-toggle");
      var proceedButton = current.tab.document.getElementById("proceed");
      proceedButton.disabled = true;
      var previousButton = current.tab.document.getElementById("previous-chapter");
      previousButton.disabled = true;
      var nextButton = current.tab.document.getElementById("next-chapter");
      nextButton.disabled = true;
      if (book.spine.length>1 && !current.generateSMIL) {
         nextButton.disabled = false;
      }
      var followButton = current.tab.document.getElementById("follow-position");
      var soundWindow = current.tab.document.defaultView;
      var trySound = 0;
      var soundManager = null;
      var doShow = function() {
         current.tab.setLabel(book.title);
         var region = current.tab.document.getElementById("book");
         var renderContext = current.renderer.galleyRender(book,region,soundManager);
         renderContext.generateSMIL = current.generateSMIL;
         renderContext.toggleFollowPosition(current.focusFollow);
         followButton.onclick = function() {
            if (followButton.textContent.indexOf("Off")>0) {
               // turn off
               DOMUtil.getInstance().text(followButton,"Turn Follow Position On");
               renderContext.toggleFollowPosition(false);
            } else {
               // turn on
               DOMUtil.getInstance().text(followButton,"Turn Follow Position Off");
               renderContext.toggleFollowPosition(true);
            }
         }
         soundToggle.onclick = function() {
            if (soundToggle.textContent.indexOf("Off")>0) {
               // turn off
               DOMUtil.getInstance().text(soundToggle,"Turn Sound On");
               renderContext.toggleSound(false);
            } else {
               // turn on
               DOMUtil.getInstance().text(soundToggle,"Turn Sound Off");
               renderContext.toggleSound(true);
            }
         }
         nextButton.onclick = function() {
            nextButton.style.backgroundColor = null;
            setTimeout(function(){
               renderContext.cancel();
               renderContext.next();
            },10);
            previousButton.disabled = false;
         }
         previousButton.onclick = function() {
            nextButton.style.backgroundColor = null;
            if (renderContext.currentSpine==1) {
               previousButton.disabled = true;
            }
            setTimeout(function() {
               renderContext.cancel();
               renderContext.previous();
            },10);
         }
         /*
         region.onclick = function(){
            setTimeout(function() {
               renderContext.proceed();
            },10);
            proceedButton.disabled = true;
            proceedButton.style.backgroundColor = null;
         }
         */
         renderContext.onNextSpine = function() {
            if (!current.generateSMIL) {
               nextButton.style.backgroundColor = "rgb(100,255,100)";
            }
         }
         renderContext.onWaitForUserEscape = function() {
            proceedButton.disabled = false;
            proceedButton.style.backgroundColor = "rgb(100,255,100)";
            proceedButton.onclick = function() {
               setTimeout(function() {
                  renderContext.proceed();
               },10);
               proceedButton.style.backgroundColor = null;
               proceedButton.disabled = true;
            }
         }
         renderContext.show();
      }
      var waitForSoundManager = function() {
         if (soundWindow.soundManager && soundWindow.soundManager._didInit) {
            if (soundWindow.soundManager.supported()) {
               soundManager = soundWindow.soundManager;
               //soundWindow.soundManager.play("test",Controls.fileURL(current.soundTest).spec);
            }
            doShow();
         } else if (trySound<20) {
            trySound++;
            setTimeout(waitForSoundManager,100);
         } else {
            doShow();
         }
      }
      waitForSoundManager();
   });
}

Controls.prototype.openRenderedView = function(book,navigation) {
   var renderedURL = Controls.fileURL(this.renderedFile).spec;
   this.tab = this._newTab(renderedURL);
   this.tab.setLabel(book.title);
   var current = this;
   this.tab.waitFor(function() {
      current.tab.document.defaultView.focus();
      current.tab.setLabel(book.title);
      var bookTarget = current.tab.document.getElementById("book");
      var soundWindow = current.tab.document.defaultView;
      var trySound = 0;
      var soundManager = null;
      var doShow = function() {
         var tts = null;
         if (current.useTTS) {
            try {
               var ttsMediator = Components.classes["@benetech.org/tts-mediator-service;1"].getService(Components.interfaces.nsITTSMediatorService);
               var ttsEngine = ttsMediator.findEngine(null);
               tts = {
                  engine: ttsEngine,
                  voiceName: voiceName
               }
            } catch (ex) {
               this.console.log("Error initializing TTS context: "+ex);
            }
         }

         var navContext = current.renderer.createNavigationContext(book,navigation,{
            tts: tts,
            soundManager: soundManager,
            sound: current.sound,
            region: bookTarget,
            focusFollow: current.focusFollow,
            highlight: current.highlight
         });
         current.tab.document.defaultView.renderApp.init(navContext);
         current.tab.document.body.style.color = "rgb(0,0,0)";
         var renderContext = current.renderer.xhtmlRender(book,bookTarget);
         renderContext.onload = function() {
            if (navContext.onload) {
               navContext.onload();
            }
         }
         renderContext.show();
      };
      var waitForSoundManager = function() {
         if (soundWindow.soundManager && soundWindow.soundManager._didInit) {
            if (soundWindow.soundManager.supported()) {
               soundManager = soundWindow.soundManager;
               //soundWindow.soundManager.play("test",Controls.fileURL(current.soundTest).spec);
            }
            doShow();
         } else if (trySound<20) {
            trySound++;
            setTimeout(waitForSoundManager,100);
         } else {
            doShow();
         }
      }
      waitForSoundManager();

   });
}

Controls.prototype.browseForFile = function() {
   
   var nsIFilePicker = Components.interfaces.nsIFilePicker;
   var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
   fp.init(window, "Choose Book Zip File", nsIFilePicker.modeOpen);
   if(fp.show() == nsIFilePicker.returnOK) {
      this.filename.value = fp.file.path;
   }
}

Controls.prototype._newTab = function(url) {
  var tabBrowser = this._windowMediator.getMostRecentWindow("navigator:browser").getBrowser();
  var tab = {
     browserTab: tabBrowser.addTab(url),
     waitFor: function(callback) {
        var current = this;
        var doWait = function() {
           if (current.browserTab.linkedBrowser.webProgress.isLoadingDocument) {
              setTimeout(doWait,100);
           } else {
              callback();
           }
        };
        doWait();
     },
     setLabel: function(title) {
        this.browserTab.label = title;
     },
     get document() {
        return this.browserTab.linkedBrowser.contentDocument.wrappedJSObject;
     }
  }
  tabBrowser.selectedTab = tab.browserTab;
  tabBrowser.focus();

  return tab;
}

Controls.prototype.stopSpeaking = function() {
   if (this.tts) {
      this.tts.stop();
   }
}
Controls.prototype.speak = function(text) {
   if (!this.ttsEngine) {
      var ttsMediator = Components.classes["@benetech.org/tts-mediator-service;1"].getService(Components.interfaces.nsITTSMediatorService);
      this.ttsEngine = ttsMediator.findEngine(null);
   }
   var voiceName = "kevin16";
   this.tts = this.ttsEngine.wrappedJSObject.getContext(voiceName);
   if (this.tts) {
      document.getElementById("tts-status").value = "Speaking";
      this.tts.speak(text);
      var current = this;
      var checker = function() {
         if (current.tts.isDone()) {
            document.getElementById("tts-status").value = "Not Speaking";
         } else {
            setTimeout(checker,50);
         }
      };
      checker();
   } else {
      this.console.log("Cannot get voice "+voiceName);
   }
}


