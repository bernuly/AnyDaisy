Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
const TYPE_ANY = "*/*";

const CLASSID = Components.ID("{8667f289-ed59-4aaf-9111-b7aa88468cb5}");
const CLASSNAME = "AnyDAISY Helper";
const CONTRACTID = "@benetech.org/daisy-helper";

DAISYHelper.prototype.classDescription = "An AnyDAISY Helper Class";
DAISYHelper.prototype.classID = CLASSID;
DAISYHelper.prototype.contractID = CONTRACTID;

function findYPos(obj) {
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

function findPos(obj) {
   var curleft = 0;
   var curtop = 0;
   if (obj.offsetParent) {
      while (obj.offsetParent) {
         curleft += obj.offsetLeft;
         curtop += obj.offsetTop;
         obj = obj.offsetParent;
      }
   }
   return [curleft,curtop];
}

function setTimeout(handler,delay) {
    var timer = Components.classes["@mozilla.org/timer;1"].createInstance().QueryInterface(Components.interfaces.nsITimer);
    timer.initWithCallback(handler,delay,0);
    return timer;
}

function clearTimeout(timer) {
   timer.cancel();
}

function DAISYHelper() {
   this.wrappedJSObject = this;
   var theClass = Components.classes["@benetech.org/daisy;1"];
   var theComponent = theClass.getService(Components.interfaces.nsISupports);
   this.service = theComponent.wrappedJSObject;
   this.service.active = true;
   
   // Logging console
   this.console = {
      preferencesService: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("daisy.helper."),
      _initialized: false,
      _debug: false,
      service: Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService),
      log: function(message) {
         this.service.logStringMessage((new Date()).getTime() + ": DAISYHelper - " + message);
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
            this.service.logStringMessage((new Date()).getTime() + ": DAISYHelper - " + message);
         }
      }
   }
}

DAISYHelper.hackClassName = "stupid-hack-for-crappy-software";
DAISYHelper.testPositionOffset = 100;
DAISYHelper.positionOffset = 80;
DAISYHelper.imagePadding = 10;
DAISYHelper.ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);

DAISYHelper.fileURL = function(file) {
   return DAISYHelper.ios.newFileURI(file);
}

DAISYHelper.prototype.forChild = function(e,name,handler) {
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

DAISYHelper.prototype.init = function(window) {
   this.scrollCounter = 0;
   this.OS = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime).OS;
   this.noteManagerId = "daisy-manage-notes-"+(new Date()).getTime();
   this.noteDialogs = [];

   this.window = window.wrappedJSObject;
   this.url = window.location.href;
   var hashPos = this.url.indexOf("#");
   if (hashPos>0) {
      this.hash = this.url.substring(hashPos);
      this.url = this.url.substring(0,hashPos);
   } else {
      this.hash = null;
   }

   this.startLoadingIndicator();

   this.service.currentHelper = this;
   /*
    * get the book from the URI without the hash and reference it.
    */
   this.console.log("Locating book for location "+this.url);
   this.book = this.service.getBook(this.url);
   this.book.ref();

   this.renderer = this.service.renderer;

   var current = this;

   /*
    * the note comparator compares a navigation point's position to
    * the notes position in the document so that a note can inserted
    * into the navigation tree
    */
   this.noteComparator = function(point,note) {
      var pointTarget = current.window.document.getElementById(point.content.id);
      var noteTarget = current.window.document.getElementById("daisy-user-note-ref-"+note.id);
      if (!noteTarget) {
         return 1;
      }
      if (!pointTarget) {
         return -1;
      }
      return pointTarget.offsetTop-noteTarget.offsetTop;
   };
   this._windowMediator = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
   this.mainWindow = this._windowMediator.getMostRecentWindow("navigator:browser");
   this.initSoundManager();
   var tabBrowser = this.mainWindow.getBrowser();

   // Put in focus hook to play tones for the content region
   var contentArea = this.window.document.getElementById("daisy-internal-book");
   contentArea.onfocus = function() {
      if (current.service.soundNavigation) {
         current.playSound("content/book_contents_1.mp3");
      }      
   }

   /*
    * the sidebar notification function for attaching the current document to the sidebar
    */
   this.notifySidebar = function() {
      var counter = 0;
      var go = function() {
         var sidebar = current.getSidebarObject();
         var isVisible = (current.tab === tabBrowser.selectedtab);
         if (sidebar && current.context && isVisible) {
            current.console.debug("Notifying sidebar to display TOC.");
            try {
               sidebar.attach(current.url, current.context);
               if (current.context.isRendered) {
                  sidebar.onAfterRender();
               }
            } catch (ex) {
               current.console.log(ex);
            }
         } else if (counter < 600) {
            counter++;
            setTimeout(go, 100);
         } else {
            current.console.log("Cannot notify sidebar to display TOC.");
            if (!isVisible) {
           	 current.console.debug("*** tab for " + current.url + " is not current tab, not calling sidebar.attach ***");
            }
         }
      };
      go();
   }

   /*
    * the document switch notification when the sidebar is already open
    */
   this.notifyDocumentSwitch = function() {
      var counter = 0;
      var go = function() {
         var sidebar = current.getSidebarObject();
         if (sidebar && current.context) {
            current.console.debug("Notifying sidebar of document switch");
            try {
               sidebar.switchTo(current.url,current.context);
            } catch (ex) {
               current.console.log(ex);
            }
         } else if (counter<20) {
            counter++;
            setTimeout(go,100);
         }
      };
      go();
   }

   this.tab = null;
   for (var i=0; i < tabBrowser.tabContainer.itemCount; i++) {
      var tab = tabBrowser.tabContainer.getItemAtIndex(i);
      if (tab.linkedBrowser.contentWindow == this.window) {
         this.tab = tab;
         break;
      }
   }
   if (this.tab == null) {
      this.console.log("ERROR: Defaulting to selected tab.");
      this.tab = tabBrowser.selectedTab;
   }

   /*
    * when the tab is selected, this notifies the sidebar that
    * the document has changed.
    */
   this.tab.addEventListener('TabSelect', function() {
      current.console.debug("Selected tab " + current.window.location.href);
      current.mainWindow.toggleSidebar('openDaisySidebar',true);
      current.notifyDocumentSwitch();
      current.service.currentHelper = current;
   },false);

   /*
    * self-voicing of the tab
    */
   this.tab.onfocus = function() {
      if (current.service.readExtension()) {
         var text = "Tab, DAISY book "+current.book.title;
         current.speak(text,null);
      }
   }

   /**
    * the load listener fires when the current tab is reloaded or
    * a file->open affects the document display (possibly a regular
    * web page and not a DAISY book)
    */
   this.loadListener = function(event) {
      var url = current.tab.linkedBrowser.contentWindow.location.href;
      var hashPos = url.indexOf("#");
      if (hashPos>0) {
         url = url.substring(0,hashPos);
      }
      current.console.debug("Tab load: "+url);
      var book = current.service.getBook(url);
      if (!book) {
         current.tab.removeEventListener('load',current.loadListener,false);
         current.mainWindow.toggleSidebar('openDaisySidebar',false);
         var validPanel  = current.mainWindow.document.getElementById("daisy-status-bar-valid");
         var quirkyPanel  = current.mainWindow.document.getElementById("daisy-status-bar-quirky");
         validPanel.style.display = "none";
         quirkyPanel.style.display = "none";
      }
   };
   this.tab.addEventListener('load',this.loadListener,false);

   /*
    * force the sidebar open to our sidebar if it isn't already
    */
   if (this.getSidebar().contentWindow.location.href != "chrome://daisy/content/sidebar.xul") {
      this.mainWindow.toggleSidebar('openDaisySidebar', true);
      this.openedSidebar = true;
   }

   /**
    * window level keyboard handling
    */
   this.window.onkeypress = function(event) {
      current.console.debug("DAISYHelper: altKey="+event.altKey+" metaKey="+event.metaKey+" ctrlKey="+event.ctrlKey+" shiftCode="+event.shiftKey+" charCode="+event.charCode+" keyCode="+event.keyCode);
      //---- Commands only available if we are voicing the book ----      
      if (current.service.readExtension()) {
          if (!event.altKey && !event.ctrlKey && !event.metaKey) {
             switch (event.keyCode) {
                case 27: //escape
                   current.bookContext.skip({ next: true, play: current.bookContext.playing });
                   break;
             }
             switch (event.charCode) {
                case 112: // 'p'
                   setTimeout(function() {
                      current.onPlayCurrent();
                   },100);
                   break;
             }
          } else if ((event.altKey && event.ctrlKey) || (current.OS=="Darwin" && event.metaKey && event.ctrlKey)) {
             switch (event.charCode) {
                case 27: // '[' mac
                case 91: // windows and linux
                   current.onPreviousNote();
                   break;
                case 29: // ']' mac
                case 93: // windows and linux
                   current.onNextNote();
                   break;
                case 59: // ';'
                   // previous page
                   current.bookContext.stop();
                   current.onPreviousPage();
                   break;
                case 39: // ''' (single quote)
                   // next page
                   current.bookContext.stop();
                   current.onNextPage();
                   break;            
                case 44: // ,
                   // previous navigation item
                   current.bookContext.previousNavigation();
                   break;
                case 47: // /
                   // next navigation item
                   current.bookContext.nextNavigation();
                   break;
             }
          } else if (event.altKey && !event.ctrlKey && !event.shiftKey) {
             switch (event.keyCode) {
                case 33: // page up
                   current.incrementVoiceRate();
                   if (current.bookContext.playing) {
                      current.onStop();
                      current.onPlayCurrent();
                   } else {
                      current.bookContext.currentLocation();
                   }
                   break;
                case 34: // page down
                   current.decrementVoiceRate();
                   if (current.bookContext.playing) {
                      current.onStop();
                      current.onPlayCurrent();
                   } else {
                      current.bookContext.currentLocation();
                   }
                   break;
             }
          } else if (!event.altKey && event.ctrlKey && !event.shiftKey) {
             switch (event.charCode) {
                case 44: // ,
                   current.bookContext.previousStructural();
                   break;
                case 46: // .
                   current.bookContext.currentLocation();
                   break;
                case 47: // /
                   current.bookContext.nextStructural();
                   break;
             }
             // Table navigation
             switch (event.keyCode) {
	            case 40: // down
	                 current.bookContext.beneathTableCell();
	                 break;
                case 39: // right
	                 current.bookContext.nextTableCell();
	                 break;
	            case 38: // up
	                 current.bookContext.aboveTableCell();
	                 break;
	            case 37: // left
	                 current.bookContext.previousTableCell();
	                 break;
             }
          }
      }
      //---- Commands available in any situation (with screenreader or without) ----
      if (event.altKey && !event.ctrlKey && event.shiftKey) {
          switch (event.keyCode) {
             case 112: // F1
                current.onMoveToSidebar();
                break;
             case 113: // F2
                current.onMoveToActionBar();
                break;
             case 114: // F3
                current.onMoveToContent();
                break;
          }
      } else if ((event.altKey && event.ctrlKey) || (current.OS=="Darwin" && event.metaKey && event.ctrlKey)) {
          switch (event.charCode) {
          case 105: // 'i'
             // insert note
             current.bookContext.stop();
             current.onAddNote();
             break;
          }
      }
   };
   
   // Set up initial Action Bar focus
   var actionBarDescription = this.window.document.getElementById("daisy-internal-description");
   // Play the focus tone if there is no page number field that would have played it
   actionBarDescription.onfocus = function() {
      if (current.service.readExtension()) {
         current.speak(actionBarDescription.textContent);
      }
      if (current.service.soundNavigation) {
         current.playSound("content/action_bar_1.mp3");
      }
   }   

   /*
    * setup the notes menu
    */
   this.notesMenu = this.window.document.getElementById("daisy-internal-notes");
   this.notes = [];
   try {
      this.notes = this.service.database.getNotes(this.url);
   } catch (ex) {
      this.console.log(ex);
   }

   this.notesMenu.onchange = function() {
      var option = current.notesMenu.options[current.notesMenu.selectedIndex];
      if (option.value=="id:add-note") {
         current.onAddNote();
      } else if (option.value=="id:manage-notes") {
         current.onManageNotes();
      } else {
         for (var i=0; i<current.renderedNotes.length; i++) {
            if (current.renderedNotes[i].note.id==option.value) {
               current.moveToNote(current.renderedNotes[i]);
               break;
            }
         }
      }
      current.notesMenu.selectedIndex = 0;
   };
   /* track keypresses to voice changes */
   this.notesMenu.onkeypress = function(event) {
      switch (event.keyCode) {
         case 37: // left
         case 38: // up
         case 39: // right
         case 40: // down
            if (current.service.readExtension()) {
               var option = current.notesMenu.options[current.notesMenu.selectedIndex];
               current.speak("item, "+option.textContent,null);
            }
            break;
         case 13:
            if (current.service.readExtension()) {
               current.speak("Note selected.",null);
            }
      }
   };
   this.notesMenu.onfocus = function() {
      if (current.service.readExtension()) {
         current.speak("list box, My notes",null);
      }
   };

   var buttonTTS = function() {
      var text = "button, "+this.getAttribute("title");
      if (current.service.readExtension()) {
         if (current.context.playContext && this.getAttribute("id") != "daisy-internal-play-button") {
            current.onStop();
         }
         var button = this;
         button.focusTimer = setTimeout(function() {
            button.focusTimer = null;
            current.speak(text,null);
         },250);

      }
   };
   var noteButton = this.window.document.getElementById("daisy-internal-add-note-button");
   noteButton.onclick = function() {
      current.onAddNote();
   };
   noteButton.onfocus = buttonTTS;

   /**
    * setup page number handling in action bar
    */
   var pageValue = this.window.document.getElementById("daisy-internal-page-no");
   pageValue.onkeypress = function(event) {
      if (event.keyCode==13) {
         current.onGotoPage(pageValue.value);
      }
   };
   pageValue.onfocus = function() {
      if (current.service.readExtension()) {
         current.speak(pageValue.getAttribute("title")+", current value "+pageValue.value,null);
      }
   }
   var pageLink = this.window.document.getElementById("daisy-internal-page-link");
   pageLink.onclick = function() {
      current.onGotoPage(pageValue.value);
   };

   /* setup playback widget */
   var playButton = this.window.document.getElementById("daisy-internal-play-button");
   playButton.onclick = function() {
      if (this.focusTimer) {
         this.focusTimer.cancel();
         this.focusTimer = null;
      }
      setTimeout(function() {
         current.onPlayCurrent();
      },100);
   };
   playButton.onfocus = buttonTTS;
   var nextButton = this.window.document.getElementById("daisy-internal-next-button");
   nextButton.onclick = function() {
      current.onNext();
   }
   nextButton.onfocus = buttonTTS;
   var prevButton = this.window.document.getElementById("daisy-internal-prev-button");
   prevButton.onclick = function() {
      current.onPrevious();
   };
   prevButton.onfocus = buttonTTS;

   /*
    * determine if the book has audio overlays
    */
   var isAudioTest = /^audio/;
   this.isAudioBook = false;
   for (var id in this.book.manifest) {
      if (this.book.manifest[id].mediaType.match(isAudioTest)) {
         this.isAudioBook = true;
         break;
      }
   }

   /**
    * initialize self-voicing via TTS
    */
   this.window.onfocus = function() {
      if (!current.bookContext || !current.bookContext.playing) {
         this.focusTimer = setTimeout(function() {
            current.window.focusTimer = null;
            if (current.service.readExtension()) {
               current.console.debug("window focus, reading title");
               current.speak("DAISY Book, " + current.book.title, null);
            }
            var id = current.window.location.hash.substring(1);
            var target = current.window.document.getElementById(id);
            current.focusTarget(target);
            
            // Set up the playback buttons based on the current voicing mode.
            current.initPlaybackWidgets();
            current.initPagingWidgets();
         },250);
      }
   };

   // Initialize tracking of location
   this.locationListener = {
     QueryInterface: function(aIID)
     {
      if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
          aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
          aIID.equals(Components.interfaces.nsISupports))
        return this;
      throw Components.results.NS_NOINTERFACE;
     },

     onLocationChange: function(aProgress, aRequest, aURI)
     {
        var url = aURI.spec;
        var hashPos = url.indexOf("#");
        if (hashPos>0) {
           url = url.substring(0,hashPos);
        }
        //current.console.debug("current.url="+current.url+", url="+url);
        if (url!=current.url) {
           return;
        }
        if (current.window.location.hash!=current.hash) {
           current.console.log("location changed to "+current.window.location.hash+", playing="+current.bookContext.playing);
           current.hash = current.window.location.hash;
           if (!current.bookContext.playing) {
              var id = current.hash.substring(1);
              var target = current.window.document.getElementById(id);
              if (target) {
                 current.bookContext.setElement(target);
              }
              if (current.needLocationScroll) {
                 current.needLocationScroll = false;
                 this.locationScrollTimer = setTimeout(function() {
                    current.window.scrollOwner = this;
                    current.window.scroll(0,current.window.scrollY-DAISYHelper.positionOffset);
                 },100);
              }
           }
        }
     },

     onStateChange: function(a, b, c, d) {},
     onProgressChange: function(a, b, c, d, e, f) {},
     onStatusChange: function(a, b, c, d) {},
     onSecurityChange: function(a, b, c) {}
   };

   this.tab.linkedBrowser.addProgressListener(this.locationListener,Components.interfaces.nsIWebProgress.NOTIFY_LOCATION);

}

DAISYHelper.prototype.dumpBookNav = function() {
	this.console.debug("DEBUG: dumping out the treewalk of nav points from bookContext.");
	var point = this.context.navigation.navMap;
	var prevPoint = null;
	
	while (point != prevPoint) {
		// Dump point details
		var pointLabel = "unknown";
		if (point.labels && point.labels[0]) {
			pointLabel = point.labels[0].text;
		}
		this.console.debug("DEBUG: nav point ID: " + point.content.id + ", scrollY: " + point.scrollY + ", label: " + pointLabel);
		
		// Move to the next one
		prevPoint = point;
		point = this.bookContext._getNextNavigationPoint(point);
	}
}

/**
 * toggle playback widget depending on whether TTS is enabled or if the book has audio overlays
 */
DAISYHelper.prototype.initPlaybackWidgets = function() {
   var playbackWidget = this.window.document.getElementById("daisy-internal-playback-widget");
   var noPlaybackWidget = this.window.document.getElementById("daisy-internal-no-playback");
   
   if (playbackWidget) {
      if (this.service.readExtension() || (this.isAudioBook && this.service.useNarration)) {
         playbackWidget.style.display = "block";
         noPlaybackWidget.style.display = "none";
      } else {
         playbackWidget.style.display = "none";
         if (!this.isAudioBook) {
            noPlaybackWidget.style.display = "block";
         }
      }
   }
}

/**
 * Toggle the page number display and input field depending on whether we have pages and are doing the voicing.
 */
DAISYHelper.prototype.initPagingWidgets = function() {
	var displayStyle = "inline";
	
   if (this.service.isMuted() || !this.window.pagelist || this.window.pagelist.length==0) {
	   displayStyle = "none";
   }
   
   this.window.document.getElementById("daisy-internal-page-widget").style.display = displayStyle;
   this.window.document.getElementById("daisy-internal-page-description").style.display = displayStyle;
   this.window.document.getElementById("daisy-internal-page-no").style.display = displayStyle;
}

/**
 * Open the Help manual.
 * @param anchor An identifier for a specific section of the book (optional)
 */
DAISYHelper.prototype.showHelp = function(anchor) {
   this.getSidebarObject().onHelp(anchor);
}

DAISYHelper.prototype.initSoundManager = function(force) {
   /**
    * The sound manager is loaded into a hidden browser instance located in
    * the status bar.  On Windows, this browser instance must be partially
    * visable for the flash to load properly.
    *
    * Once the document is loaded for the browser window and initialized, the
    * same sound manager instance is used for all books.  This keeps books
    * from playing audio over each other.
    */
    var id = "{6be5ef88-4289-44d1-81f2-097313ed640b}";
   directoryService=Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties);
    soundFile = directoryService.get("ProfD", Components.interfaces.nsIFile);
    soundFile.append("extensions");
    soundFile.append(id);
    soundFile.append("content");
    soundFile.append("sound.xhtml");

 var soundContext = this.mainWindow.document.getElementById("daisy-sound-context");
   var soundDocument = DAISYHelper.fileURL(soundFile).spec;
   if (soundContext.contentWindow.location.href!=soundDocument || force) {
      if (this.OS=="WINNT" && soundContext.boxObject.height==0) {
         soundContext.style.height = "10px";
      }
      this.inSoundManagerInit = true;
      this.console.debug("Loading soundManager2 from DAISYHelper");
      /**
       * flash block is evil, so we have to disable it and restore it
       * after we're done.
       */
      FlashBlockHack.save();

      /**
       * we track the progress of the document loading via a WebProgressListener
       * instance.
       */
      var current = this;
      var myListener = {
         QueryInterface: function(aIID) {
            if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
               aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
               aIID.equals(Components.interfaces.nsISupports)) {
               return this;
            }
            throw Components.results.NS_NOINTERFACE;
         },

         onStateChange: function(aWebProgress, aRequest, aFlag, aStatus) {
            if(aFlag & Components.interfaces.nsIWebProgressListener.STATE_STOP && aFlag & Components.interfaces.nsIWebProgressListener.STATE_IS_DOCUMENT && aStatus==0) {
                // This fires when the load finishes

               /**
                * The document is now loaded.  We now need to wait for the
                * sound manger to initialize.  Once that is complete, we're done.
                */
               soundContext.removeProgressListener(myListener);
               var tryCount = 0;
               var waitForInit = function() {
                  if (soundContext.contentWindow.soundManager && soundContext.contentWindow.soundManager._didInit) {
                     current.inSoundManagerInit = false;
                     current.soundManager = soundContext.contentWindow.soundManager;
                     FlashBlockHack.restore();
                     soundContext.style.height = "0px";
                  } else if (tryCount<30) {
                     tryCount++;
                     setTimeout(waitForInit,100);
                  } else {
                     current.inSoundManagerInit = false;
                     FlashBlockHack.restore();
                     current.console.log("Sound manager did not initialize.");
                     soundContext.style.height = "0px";
                  }
               }
               waitForInit();
            }
            return 0;
         },

         onLocationChange: function(aProgress, aRequest, aURI) { return 0; },
         onProgressChange: function() {return 0;},
         onStatusChange: function() {return 0;},
         onSecurityChange: function() {return 0;},
         onLinkIconAvailable: function() {return 0;}
      };
      soundContext.addProgressListener(myListener,Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);
      soundContext.loadURI(soundDocument,null,null);
   }

}

/**
 * Return the XUL element for our sidebar.
 */
DAISYHelper.prototype.getSidebar = function() {
   return this.mainWindow.document.getElementById("sidebar");
}

/**
 * Return the Sidebar Javascript object.
 */
DAISYHelper.prototype.getSidebarObject = function() {
   var sidebarWin = this.getSidebar();
   if (sidebarWin) {
      return sidebarWin.contentWindow.theSidebar;
   } else {
      return null;
   }
}

/**
 * a gigantic hack for crappy software like JAWS
 */
DAISYHelper.prototype.focusTarget = function(target) {
   if (target && target.firstChild && target.firstChild.className 
      && target.firstChild.className.indexOf(DAISYHelper.hackClassName)>=0) {
      this.console.log("window.onFocus target=" + target.firstChild.id);
      target.firstChild.focus();
   } else if (target) {
      target.focus();
   }
}

/**
 * This method calculates the current page position
 */
DAISYHelper.prototype.calculatePage = function() {
   if (!this.window.pagelist || this.window.pagelist.length==0) {
      this.pageIndex = -1;
      this.onUpdatePage();
      return;
   }
   try {
      var last = null;
      var i=0;
      var pageIndex = -1;
      for (; i<this.window.pagelist.length; i++) {
         if (!this.window.pagelist[i].element) {
            continue;
         }
         if (this.window.pagelist[i].element.offsetTop<(this.window.scrollY+DAISYHelper.testPositionOffset)) {
            last = this.window.pagelist[i];
            pageIndex = i;
         } else {
            break;
         }
      }
      if (!last) {
         last = this.window.pagelist[0];
         pageIndex = 0;
      }
      this.pageIndex = pageIndex;
      /**
       * Call onUpdatePage to update the page position in the display
       */
      //this.console.log("last.element="+last.element.localName+" "+last.element.getAttribute("id"));
      var total = this.window.pagelist[this.window.pagelist.length-1].number;
      if (last && last.section!=this.window.pagelist[this.window.pagelist.length-1].section) {
         var lastBody = this.window.pagelist.length-1;
         for (; lastBody>=0 && last.section!=this.window.pagelist[lastBody].section; lastBody--);
         if (lastBody>=0) {
            total = this.window.pagelist[lastBody].number;
         }
      }
      this.onUpdatePage(last ? last.element.getAttribute("id") : null,last ? last.number : 0,total);
   } catch (ex) {
      this.console.log(ex);
   }
}

/**
 * Update the page position display
 */
DAISYHelper.prototype.onUpdatePage = function(pageId,page,total) {
   var pageNo = this.window.document.getElementById("daisy-internal-page-no");
   var hiddenPageNo = this.window.document.getElementById("daisy-internal-page-no-hidden");
   var pageTotal = this.window.document.getElementById("daisy-internal-page-total");
   // clear the pageTotal element
   var node = pageTotal.firstChild;
   while (node) {
      pageTotal.removeChild(node);
      node = pageTotal.firstChild;
   }
   // clear the hiddenPageNo element
   node = hiddenPageNo.firstChild;
   while (node) {
      hiddenPageNo.removeChild(node);
      node = hiddenPageNo.firstChild;
   }
   if (!page || page<0) {
      pageNo.value = "";
   } else {
      /**
       * display the page information including the hidden information for screen readers
       */
      var pos = page.indexOf("Page ");
      if (pos==0) {
         this.pagePrefix = "Page ";
         page = page.substring(pos+5);
      } else {
         this.pagePrefix = null;
      }
      pos = total.indexOf("Page ");
      if (pos==0) {
         total = total.substring(pos+5);
      }
      pageNo.value = page+"";
      pageTotal.appendChild(this.window.document.createTextNode(" of "+total));
      hiddenPageNo.appendChild(this.window.document.createTextNode(" "+page+" "));
   }
}

/**
 * Adds a note to the notes menu
 */
DAISYHelper.prototype.addNoteToMenu = function(note) {
   // If this is the first note, add the 'Manage Notes' item first
   var hasManageMenu = false;
   for (var i = 0; i < this.notesMenu.options.length; i++) {
      if (this.notesMenu.options[i].value === "id:manage-notes") {
         hasManageMenu = true;
      }
   }
   if (!hasManageMenu) {
      var manageOption = this.window.document.createElement("option");
      manageOption.appendChild(this.window.document.createTextNode("Manage Notes"));
      manageOption.setAttribute("value", "id:manage-notes");
      manageOption.setAttribute("class", "operation");
      manageOption.setAttribute("id", "manage-notes");
      this.notesMenu.appendChild(manageOption);
   }

   // Add the note reference itself to the menu, in document order
   var option = this.window.document.createElement("option");
   option.appendChild(this.window.document.createTextNode(note.name));
   option.setAttribute("value", note.id+"");
   
   var nextNote = this.getNextRenderedNote(note);
   if (nextNote) {
      var nextNoteMenu = this.getNoteMenu(nextNote.note);
      this.notesMenu.insertBefore(option, nextNoteMenu);
   } else {
      this.notesMenu.appendChild(option);
   }
}

/**
 * Find the note that follows the given note in document order.
 * @return renderedNote, containing a note and a ref
 */
DAISYHelper.prototype.getNextRenderedNote = function(note) {
   var scrollY = this.window.scrollY;
   var pageBottom = this.window.scrollY + this.window.innerHeight;

   var currentY = 0;
   var currentX = 0;
   if (note) {
      // If a starting note is specified, get its offset from the rendered note
      for (var j = 0; j < this.renderedNotes.length; j++) {
         if (this.renderedNotes[j].note === note) {
            currentY = findYPos(this.renderedNotes[j].ref);
            currentX = this.renderedNotes[j].ref.offsetLeft;
            scrollY = currentY;
            break;
         }
      }
   } else if (this.currentNote) {
      // if there is a current note and it is within the viewport, search from the current position
      var yPos = findYPos(this.currentNote.ref);
      if (yPos > scrollY && yPos < pageBottom) {
         scrollY = yPos;
         currentY = yPos;
         currentX = this.currentNote.ref.offsetLeft;
      } else {
    	  // We are no longer on a page with a note
    	  this.currentNote = null;
      }
   }

   var nextNote = null;
   var nextYPos = 0;

   for (var i=0; i < this.renderedNotes.length; i++) {
      if (this.renderedNotes[i] == this.currentNote) {
         continue;
      }
      var yPos = findYPos(this.renderedNotes[i].ref);
      this.console.debug("Checking note " + i + " that starts at yPos " + yPos);
      if (yPos >= scrollY) {
         this.console.debug("name="+this.renderedNotes[i].note.name+", next.yPos="+nextYPos+", yPos="+yPos+", next.offsetLeft="+(nextNote ? nextNote.ref.offsetLeft : 0)+", offsetLeft="+this.renderedNotes[i].ref.offsetLeft+", currentY="+currentY+", currentX="+currentX);
         // either we have no next note or
         // the nextNote is further down than the current note
         if ((!nextNote && (currentY > 0 ? (yPos == currentY ? this.renderedNotes[i].ref.offsetLeft > currentX : true) : true)) ||
             (nextNote && nextYPos > yPos) ||
             (nextNote && nextYPos == yPos && nextNote.ref.offsetLeft > this.renderedNotes[i].ref.offsetLeft && (yPos == currentY ? this.renderedNotes[i].ref.offsetLeft > currentX : true))) {
            this.console.debug("*** Note "+ this.renderedNotes[i].note.id+", " + this.renderedNotes[i].note.name + " set as next note.");
            // set the next note to the current note
            nextNote = this.renderedNotes[i];
            nextYPos = yPos;
         }
      }
   }
   return nextNote;
}

/**
 * Return the menu item corresponding to the given note.
 */
DAISYHelper.prototype.getNoteMenu = function(note) {
   var noteMenu = null;
   this.console.log("Looking through " + this.notesMenu.options.length + " menu choices for one that matches id " + note.id);
   for (var i = 0; i < this.notesMenu.options.length; i++) {
      this.console.log("this.notesMenu.options[" + i + "].value = " + this.notesMenu.options[i].value);
      if (this.notesMenu.options[i].value === note.id + "") {
         noteMenu = this.notesMenu.options[i];
      }
   }
   return noteMenu;
}

/**
 * Updates the note name in the notes menu
 */
DAISYHelper.prototype.updateNoteInMenu = function(note) {
   var notesOptGroup = this.notesMenu.firstChild.nextSibling;
   var option = notesOptGroup.firstChild;
   var sid = note.id+"";
   while (option) {
      if (option.value==sid) {
         var node = option.firstChild;
         while (node) {
            option.removeChild(node);
            node = option.firstChild;
         }
         option.appendChild(this.window.document.createTextNode(note.name));
         break;
      }
      option = option.nextSibling;
   }
}

/**
 * removes a note from the notes menu
 */
DAISYHelper.prototype.removeNoteFromMenu = function(note) {
   var sid = note.id+"";
   this.removeNotesOption(sid);
   
   // If there are no more user notes, remove the 'Manage Notes' choice
   if (this.notesMenu.options.length == 3) {
      this.removeNotesOption("id:manage-notes");
   }
}

/**
 * Remove a single element from the notes menu that has the matching value.
 */
DAISYHelper.prototype.removeNotesOption = function(value) {
   for (var i = 0; i < this.notesMenu.options.length; i++) {
      var option = this.notesMenu.options[i];
      if (option.value == value) {
         this.notesMenu.removeChild(option);
         break;
      }
   }
}

/**
 * Renders a note in the document and returns the anchor
 */
DAISYHelper.prototype.renderNote = function(note) {
   this.console.debug("Rendering note: "+note.id);
   var target = this.window.document.evaluate(note.xpath,this.window.document,null,8,null).singleNodeValue;
   if (target) {
      var noteRefContainer = target.ownerDocument.createElement("div");
      noteRefContainer.className = "daisy-user-note-ref";
      noteRefContainer.setAttribute("id","daisy-user-note-ref-"+note.id);

      var noteImage = target.ownerDocument.createElement("img");
      noteImage.setAttribute("src",this.images["info"]);
      noteImage.setAttribute("alt","User note icon");
      noteImage.className = "daisy-skip";
      noteRefContainer.appendChild(noteImage);

      var noteRef = target.ownerDocument.createElement("span");
      noteRef.appendChild(target.ownerDocument.createTextNode(note.name));
      // The note should be one structure, so we will skip
      // the title and note as navigable items. The note will be voiced as one text.
      noteRef.className = "daisy-user-note-ref daisy-skip";
      noteRef.setAttribute("role","note");
      noteRef.setAttribute("title","user note");
      noteRefContainer.appendChild(noteRef);
      
      target.parentNode.insertBefore(noteRefContainer,target);

      var noteDiv = target.ownerDocument.createElement("div");
      noteRefContainer.appendChild(noteDiv);
      noteDiv.className = "daisy-user-note daisy-skip";
      noteDiv.setAttribute("id","daisy-user-note-"+note.id);

      var p = target.ownerDocument.createElement("p");
      p.appendChild(target.ownerDocument.createTextNode(note.note));
      noteDiv.appendChild(p);

      return noteRef;
   } else {
      this.console.log("Cannot find note target: "+note.xpath);
      return null;
   }
};

/**
 * Moves the current scroll position to a note
 */
DAISYHelper.prototype.moveToNote = function(renderedNote) {
   var id = "daisy-user-note-ref-"+renderedNote.note.id;
   this.moveToLocation(id);
   this.currentNote = renderedNote;
   var current = this;
   setTimeout(function() {
      current.notifyTOCChange(current.service.readExtension());
   },100);
};

DAISYHelper.prototype.moveToLocation = function(id) {
   this.needLocationScroll = true;
   this.window.location.hash = "#"+id;
   this.linkHackForTarget(id);
};

/**
 * Not sure about the name of this method, but it seems necessary to ensure clicking on a TOC item actually takes
 * you to that item in the main pane
 * @param id
 */
DAISYHelper.prototype.linkHackForTarget = function(id) {
   var target = this.window.document.getElementById(id);
   if (target && (!target.firstChild || !target.firstChild.className || target.firstChild.className.indexOf(DAISYHelper.hackClassName)<0)) {
      var link = this.window.document.createElement("a");
      link.setAttribute("href","#"+id);
      link.setAttribute("role","heading");
      link.className = DAISYHelper.hackClassName+" daisy-skip";
      if (target.firstChild) {
         target.insertBefore(link,target.firstChild);
      } else {
         target.appendChild(link);
      }
   }
}

/**
 * Moves to the next note
 */
DAISYHelper.prototype.onNextNote = function() {
   this.onStop();
   
   var nextNote = this.getNextRenderedNote();
   if (nextNote) {
      this.moveToNote(nextNote);
   } else if (this.renderedNotes.length > 0) {
      // Cycle around to the beginning if we went past the last note.
      nextNote = this.renderedNotes[0];
      this.moveToNote(nextNote);
   }
   return nextNote ? true : false;
}

/**
 * Moves to the previous note
 */
DAISYHelper.prototype.onPreviousNote = function() {
   this.onStop();
   var scrollY = this.window.scrollY;
   var pageBottom = this.window.scrollY + this.window.innerHeight;

   // if there is a current note and it is within the viewport, search from the current position
   var currentY = 0;
   var currentX = 0;
   if (this.currentNote) {
      var yPos = findYPos(this.currentNote.ref);
      if (yPos > scrollY && yPos < pageBottom) {
         scrollY = yPos;
         currentY = yPos;
         currentX = this.currentNote.ref.offsetLeft;
      } else {
    	 // We are no longer on a note
    	 this.currentNote = null;
      }
   }

   var prevNote = null;
   var prevYPos = 0;

   // TODO: rendered notes should be kept in sorted order
   var sorted = [];
   for (var i=0; i < this.renderedNotes.length; i++) {
      sorted.push(this.renderedNotes[i]);
   }
   sorted.sort(function(noteA,noteB) {
      var targetA = noteA.ref;
      var targetB = noteB.ref;
      return targetA.offsetTop == targetB.offsetTop ? targetA.offsetLeft-targetB.offsetLeft : targetA.offsetTop-targetB.offsetTop;
   });

   for (var i=0; i < sorted.length; i++) {
      if (sorted[i] == this.currentNote) {
         continue;
      }
      var yPos = findYPos(sorted[i].ref);
      if (yPos <= scrollY) {
         this.console.debug("Note " + i + " name="+sorted[i].note.name+", next.yPos="+prevYPos+", yPos="+yPos+", next.offsetLeft="+(prevNote ? prevNote.ref.offsetLeft : 0)+", offsetLeft="+sorted[i].ref.offsetLeft+", currentY="+currentY+", currentX="+currentX);
         // either we have no previous note or
         // the prevNote is closer to the top than the current note
         if ((!prevNote && (currentY > 0 ? (yPos == currentY ? sorted[i].ref.offsetLeft < currentX : true) : true)) ||
            (prevNote && prevYPos < yPos && (yPos != currentY || (yPos == currentY && sorted[i].ref.offsetLeft < currentX) ) ) ||
            (prevNote && prevYPos == yPos && prevNote.ref.offsetLeft < sorted[i].ref.offsetLeft && (yPos == currentY ? sorted[i].ref.offsetLeft < currentX : true))) {
            // set the next note to the current note
            prevNote = sorted[i];
            prevYPos = yPos;
         }
      }
   }
   if (prevNote) {
      this.moveToNote(prevNote);
   } else if (sorted.length > 0) {
      // Cycle around to the last note if we went past the first note.
      prevNote = sorted[sorted.length-1];
      this.moveToNote(prevNote);
   }
   return prevNote ? true : false;
}


/**
 * Updates the note represenation in the document when the note changes
 */
DAISYHelper.prototype.updateNoteRendering = function(note) {
   var noteRefContainer = this.window.document.getElementById("daisy-user-note-ref-"+note.id);
   if (noteRefContainer) {
	   // Update the note title, span -> text
	   var noteRef = noteRefContainer.firstChild;
	   while (noteRef.localName != "span") {
		   noteRef = noteRef.nextSibling;
	   }
	   if (noteRef.localName == "span") {
		   noteRef.firstChild.nodeValue = note.name;
	   }
	   
	   // Update the note text, div -> p -> text
	   var noteDiv = this.window.document.getElementById("daisy-user-note-" + note.id);
	   if (noteDiv) {
		   noteDiv.firstChild.firstChild.nodeValue = note.note;
	   }
   }
}

/**
 * Removes a note rendering from the document
 */
DAISYHelper.prototype.removeNoteRendering = function(note) {
   var noteRef = this.window.document.getElementById("daisy-user-note-ref-"+note.id);
   if (noteRef) {
      if (this.bookContext.element==noteRef) {
         var next = noteRef.nextSibling;
         while (next && next.nodeType!=1) {
            next = next.nextSibling;
         }
         this.bookContext.setElement(next ? next : noteRef.parentNode);
      }
      noteRef.parentNode.removeChild(noteRef);
   }
}

/**
 * Whether the book should use TTS.
 * Audio books where we haven't overridden the voicing are ones that don't need TTS.
 */
DAISYHelper.prototype.needTts = function() {
	return !this.isAudioBook || !this.service.useNarration;
}

/**
 * The main callback to render a book in the current document.
 */

DAISYHelper.prototype.writeContent = function(){

 var current = this;
 var soundContext = this.mainWindow.document.getElementById("daisy-sound-context");
 var soundWindow = soundContext.contentWindow;
 var soundManager  = soundWindow.soundManager;
 var extid = "{6be5ef88-4289-44d1-81f2-097313ed640b}";
/*replaced extensionManager code to work in firefox 4+ versions*/
 directoryService=Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties);
 fmDir = directoryService.get("ProfD", Components.interfaces.nsIFile);
 fmDir.append("extensions");
 fmDir.append(extid);
 fmDir.append("content");
 fmDir.append("auto-pause.mp3");
 var autoPauseSound = DAISYHelper.fileURL(fmDir).spec;

/*
 * make sure we have a sound manager.  If not, wait till we do (within a timeout) via polling
 */
 if (!this.skipSoundManager && (this.inSoundManagerInit || !soundManager || !soundManager._didInit || !soundManager.supported())) 
 {
   this.console.log("Waiting for soundManager");
   var soundCount = 0;
   var tryCount = 0;
   var waitForSoundManager = function() {
   if (soundWindow.soundManager && soundWindow.soundManager._didInit && !current.inSoundManagerInit) {       
   if (soundWindow.soundManager.supported()) {
                                              current.writeContent();
                                             } 
   else if (tryCount<2) {
                        current.console.log("soundManager didn't load, retrying...");
                        tryCount++;
                        soundCount = 0;
                        current.initSoundManager(true);
                        setTimeout(waitForSoundManager,100);
                      } 
  else {
        current.console.log("soundManager is not supported.");
        current.skipSoundManager = true;
        current.writeContent();
      }
  }//if 
  else if (soundCount<30) {
                           soundCount++;
                           setTimeout(waitForSoundManager,100);
                         } 
  else {
         current.console.log("No soundManager instance could be found in sound context.");
         current.skipSoundManager = true;
         current.writeContent();
      }
  };//function waitForSoundManager
  waitForSoundManager();
  return;
 }//if
 /**
 * toggle the soundmanager browser visible off if we're on windows
 */
 if (this.OS=="WINNT" && soundContext.boxObject.height==10) {
                                                             soundContext.style.height = "0px";
                                                            }
 if (soundManager && !soundManager.supported()) {
                                                 current.console.log("soundManager is not supported.");
                                                 soundManager = null;
                                                }

   /**
    * update the images in the document with the local content
    * for button images, etc.
    */
   this.images = {};
   var imageNames = ["info","play","pause","prev","next","add-note"];
   for (var i=0; i<imageNames.length; i++) {
      this.images[imageNames[i]] = "chrome://daisy-public/content/"+imageNames[i]+"-button.png";
   }

   /**
    * Change the tab title/etc. to the book title
    */
   this.window.document.title = this.book.title;

   /*
    * add the local stylesheet for DAISY books
    */
   this.forChild(this.window.document.documentElement,"head",function(head) {
      var styleE = head.ownerDocument.createElement("link");
      styleE.setAttribute("rel","stylesheet");
      styleE.setAttribute("type","text/css");
      styleE.setAttribute("href","chrome://daisy-public/content/rendered-"+current.OS.toLowerCase()+".css");
      head.appendChild(styleE);
   });

   /**
    * If the book is severely broken, give up
    */
   if (!this.book.isValid()) {
      var p =this.window.document.createElement("p");
      p.appendChild(this.window.document.createTextNode("This document is not a valid DAISY book packaging."));
      this.window.document.body.appendChild(p);
      p.className = "error";
      current.window.document.body.style.color = "rgb(0,0,0)";
      return;
   }

   var doShow = function() {
      // JAWS hack: set up a hidden field that we can update when loading is finished.
      current.prepareJAWSBuffer();
      
      /**
       *  The book is rendered as a child of 'daisy-internal-book'.
       */
      var bookTarget = current.window.document.getElementById("daisy-internal-book");

      // If we're opening an audio book, only use TTS if the user has asked for it
      var bookTts = current.needTts() ? current.service.tts : null;

      /**
       * create the navigation context
       */
      current.context = current.renderer.createNavigationContext(current.book,current.book.loadNavigation(),{
         tts: bookTts,
         playbackPause: current.service.playbackPause,
         soundManager: soundManager,
         sound: current.service.readExtension(),
         region: bookTarget,
         focusFollow: current.service.focusFollow,
         highlight: current.service.highlight,
         onFinish: function() {
            current.console.log("onFinish() called on navigation context in helper.");
            if (current.context.next()==0) {
               current.togglePlayButton(true);
            } else {
               if (this.context.element) {
                  current.bookContext.setElement(this.context.element);
               }
            }
         },
         context: {}
      });

      /**
       * listen for changes from the settings dialog (or other preference changes)
       */
      current.prefListener = {
         tts: current.service.tts,
         onChange: function(name) {
            // TODO: Do we need to account for voicing mode changes here?
            if (name=="useNarration") {
            	current.console.log("prefListener: needTts = " + current.needTts());
               if (current.service.readExtension() && current.needTts()) {
                  current.context.options.tts = current.service.tts;
               } else {
                  current.context.options.tts = null;
               }
               current.context.options.sound = current.service.readExtension();
            } else if (name=="playbackPause") {
               current.context.options.playbackPause = current.service.playbackPause;
            } else if (name=="sound") {
               current.context.options.sound = current.service.readExtension();
            } else if (name=="focusFollow") {
               current.context.options.focusFollow = current.service.focusFollow;
            } else if (name=="highlight") {
               current.context.options.highlight = current.service.highlight;
            }
         }
      };
      current.service.addPreferenceObserver(current.prefListener);
      
      current.context.owner = current;
      current.context.document = current.window.document;

      /**
       * make the content visible
       */
      current.window.document.body.style.color = "rgb(0,0,0)";

      /**
       * if we opened the sidebar, notify it and attach
       */
      if (!current.openedSidebar) {
         current.notifySidebar();
      }

      /**
       * Create an XHTML renderer context
       */
      var renderContext = current.renderer.xhtmlRender(current.book,bookTarget);

      /**
       * afterRender is called to notify the sidebar that we're done with the transform and setup.  This
       * may need to retry because the sidebar is loaded asynchronously
       */
      var trySidebar = 0;
      var afterRender = function() {
         var sidebar  = current.getSidebarObject();
         if (sidebar && sidebar.attached) {
            current.console.debug("sidebar found that is attached");
            sidebar.onAfterRender();
         } else if (trySidebar < 50) {
            trySidebar++;
            setTimeout(afterRender, 100);
         } else {
            current.console.debug("Cannot find sidebar application to notify onAfterRender(): sidebar="+(sidebar ? sidebar : null) + " attached="+(sidebar ? sidebar.attached : null));
         }
      };

      /**
       * onload is called after the content has been processed and rendered into the target element
       */
      renderContext.onload = function() {
         var smdebug = current.window.document.getElementById("soundmanager-debug");
         if (smdebug) {
            smdebug.style.display = "none";
         }

         /**
          * Render the notes
          */
         current.renderedNotes = [];
         current.currentNote = null;
         for (var i=0; i<current.notes.length; i++) {
            current.addRenderedNote(current.notes[i]);
         }

         /**
          * sort the notes in rendered order
          */
         // sort the notes according to position
         current.notes.sort(function(noteA,noteB) {
            var targetA = current.window.document.getElementById("daisy-user-note-ref-"+noteA.id);
            var targetB = current.window.document.getElementById("daisy-user-note-ref-"+noteB.id);
            if (!targetA) {
               return 1;
            }
            if (!targetB) {
               return -1;
            }
            return targetA.offsetTop==targetB.offsetTop ? targetA.offsetLeft-targetB.offsetLeft : targetA.offsetTop-targetB.offsetTop;
         });
         // add the document's notes in rendered order
         for (var i=0; i<current.notes.length; i++) {
            current.addNoteToMenu(current.notes[i]);
         }
         /**
          * add the notes to the navigation
          */
         current.book.addNotes(current.notes,current.noteComparator);

         /**
          * calculate the page and/or toggle pages off if there are no pages
          */
         current.calculatePage();
         current.initPagingWidgets();
         current.initPlaybackWidgets();

         /**
          * add a resize event listener to pass on resize events to the sidebar
          */
         current.window.addEventListener('resize',function() {
            current.console.debug("resize, scrollY="+current.window.scrollY);
            if (current.resizeTimer) {
               clearTimeout(current.resizeTimer);
               current.resizeTimer = null;
            }
            current.resizeTimer = setTimeout(function() {
               current.console.debug("resize timeout, scrollY="+current.window.scrollY);
               current.resizeTimer = null;
               if (current.getSidebarObject()) {
                  current.getSidebarObject().resize();
               }
               current.console.debug("resize timeout, scrollY="+current.window.scrollY);
               current.resize();
               current.console.debug("resize timeout, scrollY="+current.window.scrollY);
            },100);
         },true);

         /**
          * add a scroll listener to track the navigation and page position in the document
          */
         var actionBar = current.window.document.getElementById("daisy-internal-controls");
         current.window.onscroll = function(event) {

            current.console.debug("window.onscroll, event phase="+event.eventPhase+", scrollY="+current.window.scrollY);
            if (current.scrollTimer) {
               clearTimeout(current.scrollTimer);
               current.scrollTimer = null;
            }

            current.scrollTimer = setTimeout(function() {
               current.console.debug("window.onScroll: start scrollY="+current.window.scrollY);
               current.scrollTimer = null;
               // XXX: We need a better way of knowing what caused the scroll. The 'scrollOwner'
               // flag is too easy to mix up if there are series of 'skip' keystrokes that
               // are sent while scrolling is happening.
               var manualScroll = !current.window.scrollOwner;
               if (!current.window.scrollOwner && current.bookContext && current.bookContext.playing) {
                  current.console.log("Stopping from manual scroll on #"+current.bookContext.element.getAttribute("id"));
                  current.onStop();
               } else {
                  current.window.scrollOwner = null;
               }
               current.console.debug("window.onScroll: after stop scrollY="+current.window.scrollY);

               actionBar.style.left = "-"+current.window.scrollX+"px";
               current.pageTop = current.window.scrollY;
               if (current.pageTop<0) {
                  current.pageTop = 0;
               }
               current.pageBottom = current.window.scrollY+current.window.innerHeight;

               current.console.debug("window.onScroll: after pageBottom set scrollY="+current.window.scrollY);
               /**
                * track hash position changes so that we know when we change TOC or navigation item
                */
               var hashChanged = false;
               if (!current.hash && current.window.location.hash || current.hash!=current.window.location.hash) {
                  current.changeLocationAt = (new Date()).getTime();
                  hashChanged = true;
               }
               current.scrollCounter++;
               current.hash = current.window.location.hash;

               current.console.debug("window.onScroll: after hash check scrollY="+current.window.scrollY);
               current.console.debug("window.onScroll: current.hash: "+current.hash+", changed="+hashChanged);

               /**
                * recalculate the page
                */
               current.calculatePage();

               current.console.debug("window.onScroll: after calculatePage scrollY="+current.window.scrollY);
               /**
                * Check to see if we need to load more images
                */
               if (current.updateImages()) {
            	   current.console.debug("window.onScroll: images updated, resizing sidebar");
                  // we've loaded images, so notify the sidebar that sizing and context has changed
                  var sidebar = current.getSidebarObject();
                  if (sidebar) {
                     setTimeout(function() {
                        sidebar.resize();
                        if (sidebar) {
                           sidebar.updateContext(current.window.scrollY);
                        }
                     },100);
                  }
               } else {
                  // No images were loaded, so just notify the sidebar the context changed
                  var sidebar = current.getSidebarObject();
                  if (sidebar) {
                     sidebar.updateContext(current.window.scrollY);
                     if (hashChanged) {
                        var yPos = current.window.scrollY - DAISYHelper.positionOffset;
                        if (yPos<0) {
                           yPos = 0;
                        }
                        current.window.scrollOwner = current;
                        current.window.scroll(0,yPos);
                     }
                  } else {
                	  current.console.debug("window.onScroll: *** no sidebar to update ***");
                  }
               }
               current.console.debug("window.onScroll: after image update scrollY="+current.window.scrollY);
               if (current.context.playContext) {
                  // we're in playback so we need to track the navigation position
                  // we need to find the current navigation item from the current position forward
                  current.updatePlaybackPosition();
               } else if (manualScroll) {
                  current.updateDocumentPosition();
               }
            },250);
         };

         current.bookContext =  current.needTts() ? new StructuralPlayback() : new SMILPlayback();
         current.console.log(current.needTts() ? "Using structural playback" : "Using SMIL playback");
         current.bookContext.init({
            owner: current,
            document: current.window.document,
            tts: bookTts,
            soundManager: soundManager,
            sounds: {
               'auto-pause': autoPauseSound,
               'table-boundary': autoPauseSound,
               'no-link': autoPauseSound
            },
            locator: function(element) {
               return current.getElementXPath(element);
            }
         });
         current.console.debug("playback.ttsCallback="+current.bookContext.ttsCallback);

         current.bookContext.element = current.bookContext.top;
         var node = current.bookContext.element.firstChild;
         while (node && node.nodeType!=1 && node.nextSibling) {
            node = node.nextSibling;
         }
         if (node.nodeType==1) {
            current.bookContext.element = node;
            current.bookContext.newPosition = true;
         }


         current.context.isRendered = true;
         current.window.daisyRendered = true;

         /**
          * if there is a fragment identifier, find the correct position in the navigation
          */
         if (current.window.location.hash.length>0) {
            current.console.log("Updating position to fragment "+current.window.location.hash);
            var id = current.window.location.hash.substring(1);
            if (id.length>0) {
               var target = current.window.document.getElementById(id);
               if (target) {
                  var ypos = findYPos(target)-DAISYHelper.positionOffset;
                  if (ypos<0) {
                     ypos = 0;
                  }
                  current.window.scroll(0,ypos);
                  //current.bookContext.element = target;
                  current.notifyTOCChange();
               }
               current.linkHackForTarget(id);
            }
         }

         /**
          * Load the first set of images from the current document position
          */
         current.window.loadedImages = [];
         current.updateImagePlaceHolders();
         current.updateImages();

         /**
          * Change the status bar indicator for the documemnt
          */
         var validPanel  = current.mainWindow.document.getElementById("daisy-status-bar-valid");
         var quirkyPanel  = current.mainWindow.document.getElementById("daisy-status-bar-quirky");
         if (current.book.quirky) {
            validPanel.style.display = "none";
            quirkyPanel.style.display = "block";
         } else {
            validPanel.style.display = "block";
            quirkyPanel.style.display = "none";
         }

         /*
          * notify the sidebar that we're done with rendering and setup
          */
         afterRender();
         if (current.context.onload) {
            current.context.onload();
         }

         current.processReferences();
         
         // Let JAWS know that we are done
         current.updateJAWSBuffer();

      };
      // showing the book initiates the render
      renderContext.show(current.book.dtbook);
      
      // Have initial focus be on the book content
      bookTarget.focus();
   };
   doShow();
   
   // DEBUG: Dump out the structure navigation
//   this.dumpBookNav();

};

/**
 * Set up a hidden field that can be used to trigger JAWS to notice an update. 
 */
DAISYHelper.prototype.prepareJAWSBuffer = function() {
    var objNew = this.window.document.createElement('p');
    var objHidden = this.window.document.createElement('input');

    objHidden.setAttribute('type', 'hidden');
    objHidden.setAttribute('value', '1');
    objHidden.setAttribute('id', 'virtualbufferupdate');
    objHidden.setAttribute('name', 'virtualbufferupdate');

    objNew.appendChild(objHidden);
    this.window.document.body.appendChild(objNew);
    
    this.console.debug("Created virtualbuffer field for JAWS");
}

/**
 * Tickle a hidden field value so that JAWS will notice a page update.
 */
DAISYHelper.prototype.updateJAWSBuffer = function() {
   var objHidden = this.window.document.getElementById('virtualbufferupdate');

   if (objHidden) {
      if (objHidden.getAttribute('value') == '1') {
         objHidden.setAttribute('value', '0');
      } else {
         objHidden.setAttribute('value', '1');
      }
      
      this.console.debug("Updated virtualbuffer field for JAWS.");
   }   
}

DAISYHelper.prototype.processReferences = function() {
   var links = this.window.document.links;
   for (var i=0; i<links.length; i++) {
      var names = links[i].className.split(/\s+/);
      for (var j=0; j<names.length; j++) {
         if (names[j]=="daisy-note-ref" || names[j]=="daisy-annoref" || names[j]=="daisy-user-note-ref") {
            this.processReference(links[i]);
            break;
         }
      }
   }
}

DAISYHelper.prototype.processReference = function(link) {
   var current = this;
   var id = link.getAttribute("href");
   if (!id || id.charAt(0) != '#') {
      return;
   }
   id = id.substring(1);
   var target = this.window.document.getElementById(id);
   if (!target) {
      return;
   }
   var closer = target.firstChild;
   while (closer && closer.className.indexOf("daisy-closer") < 0) {
      closer = closer.nextSibling;
   }
   if (closer) {
      closer.onclick = function() {
         target.style.display = "none";
      }
   }
   link.onclick = function() {
      var pos = findPos(link);
      target.style.position = "absolute";
      target.style.left = pos[0]+"px";
      target.style.top = (pos[1]+link.offsetHeight+3)+"px";
      target.style.display = "block";
      current.bookContext.setElement(target, { referer: link, invoke: true });
      target.focus();
      return false;
   }
};

/**
 * as the document scrolls during playback, this method tracks
 * the current navigation item regardless of whether the sidebar is open
 */
DAISYHelper.prototype.updatePlaybackPosition = function(scrollY) {
   var point = this.context.currentPoint;
   var last = point;
   var top = this.window.scrollY+100;
   do {
      var target = this.window.document.getElementById(point.content.id);
      if (target && target.offsetTop<top) {
         last = point;
         while (point && !point.next) {
            point = point.parent;
         }
         if (point) {
            point = point.next;
         }
      }
   } while (point && (!target || target.offsetTop<top));
   if (last) {
      this.context.currentPoint = last;
   }
}

/**
 * when the document is scrolled, this method will calculate the
 * current element for playback position
 */
DAISYHelper.prototype.updateDocumentPosition = function() {

   try {

   var pageTop = this.window.scrollY+DAISYHelper.positionOffset;

   var pageBottom = this.window.scrollY+this.window.innerHeight;

   var context = this.window.document.getElementById("daisy-internal-book");
   var top = context;
   var y = findYPos(context);

   // Either the element:
   //   (A) starts and ends before the viewport and so we want the
   //       next sibling
   //   (B) starts before and after the viewport and so we must
   //       descend
   //   (C) starts before the viewport and ends in the viewport
   //       and so we must descend to find a starting point
   //   (D) starts in the viewport and ends after the viewport.
   //   (E) starts and ends in the viewport
   //
   //   We prefer an element in (E) but will take (D)

   // Note: We force descending into ARIA regions

   while (context && (context.getAttribute("role")=="region" || context.className=="daisy-content" || y<pageTop)) {

      var bottom = y+context.offsetHeight;

      if (bottom<pageTop) {
         //this.console.debug("Element ("+context.getAttribute("id")+") ("+y+","+bottom+") is before the viewport ("+pageTop+","+pageBottom+"), getting next sibling...");
         // descend
         var parent = context.parentNode;
         
         context = context.nextSibling;
         while (context && context.nodeType!=1) {
            context = context.nextSibling;
         }
         if (context) {
            y = findYPos(context);
         } else {

            //this.console.debug("Finding next in tree order...");
            
            // next in tree order

            // we have no child elements, so go to nearest ancestor's
            // next sibling
            var ancestor = parent;

            if (ancestor!=top) {

               // find next in tree order
               while (!context) {
                  // move to next sibling element
                  next = ancestor.nextSibling;
                  while (next && next.nodeType!=1) {
                     next = next.nextSibling;
                  }
                  if (next) {
                     context = next;
                  } else if (ancestor.parentNode!=top) {
                     ancestor = ancestor.parentNode;
                  } else {
                     break;
                  }
               }
               
            }

            if (context) {
               y = findYPos(context);
            } else {
               //this.console.log("No next element in tree order.");
            }

         }
         continue;

      }

      // (B) spans the viewport
      if (bottom>pageBottom) {
         //this.console.debug("Element ("+context.getAttribute("id")+") ("+y+","+bottom+") spans viewport ("+pageTop+","+pageBottom+"), descending...");
         // descend
         context = context.firstChild;
         while (context && context.nodeType!=1) {
            context = context.nextSibling;
         }
         if (context) {
            y = findYPos(context);
         }
         continue;
      }

      // (C) starts before the viewport but ends in the viewport

      //this.console.debug("Element ("+context.getAttribute("id")+")  ("+y+","+bottom+") ends in viewport ("+pageTop+","+pageBottom+"), descending...");
      
      // descend if not a paragraph
      var next = null;
      if (context.localName!="p") {
         next = context.firstChild;
         while (next && next.nodeType!=1) {
            next = next.nextSibling;
         }
      }

      if (!next) {

         // next in tree order

         // try the next sibling
         next = context.nextSibling;
         while (next && next.nodeType!=1) {
            next = next.nextSibling;
         }

         if (!next) {
            // we have no child elements, so go to nearest ancestor's
            // next sibling
            var ancestor = context.parentNode;

            context = null;

            if (ancestor!=top) {

               // find next in tree order
               while (!context) {
                  // move to next sibling element
                  next = ancestor.nextSibling;
                  while (next && next.nodeType!=1) {
                     next = next.nextSibling;
                  }
                  if (next) {
                     context = next;
                  } else if (ancestor.parentNode!=top) {
                     ancestor = ancestor.parentNode;
                  } else {
                     break;
                  }
               }

            }

         } else {
            context = next;
         }

         if (context) {
            y = findYPos(context);
         }


      } else {
         context = next;
         y = findYPos(next);
      }

   }

   // no position if context is top, but this shouldn't happen
   if (!context || context==top) {
      this.console.log("No context to set from manual scroll.");
      if (this.lastScrollContext) {
         this.lastScrollContext.style.backgroundColor = "rgb(255,255,255)";
      }
      return;
   }

/*
   if (this.lastScrollContext) {
      this.lastScrollContext.style.backgroundColor = "rgb(255,255,255)";
   }
   this.lastScrollContext = context;

   context.style.backgroundColor = "rgb(0,0,255)";
      */

   this.bookContext.setElement(context);

   } catch (ex) {
      this.console.log(ex);
   }

}

/**
 * Move to page
 */
DAISYHelper.prototype.onGotoPage = function(page,skipPrefix) {
   this.onStop();
   var id = this.context.moveToPage(this.pagePrefix && !skipPrefix ? this.pagePrefix+page : page,true,true);
   var target = this.window.document.getElementById(id);
   if (target) {
      // change the page by changing the fragment identifier
      var current = this;
      setTimeout(function() {
         current.bookContext.setElement(target,{invoke: true});
      },250);
   }
}

/**
 * Move to the next page
 */
DAISYHelper.prototype.onNextPage = function() {
   this.onStop();
   this.console.debug("Next page, pageIndex="+this.pageIndex);
   if (this.pageIndex<(this.window.pagelist.length-1)) {
      this.pageIndex++;
      this.onGotoPage(this.window.pagelist[this.pageIndex].number,true);
      return true;
   } else {
      return false;
   }
}

/**
 * Move to the previous page
 */
DAISYHelper.prototype.onPreviousPage = function() {
   this.onStop();
   this.console.debug("Previous page, pageIndex="+this.pageIndex);
   if (this.pageIndex>0) {
      this.pageIndex--;
      this.onGotoPage(this.window.pagelist[this.pageIndex].number,true);
      return true;
   } else {
      return false;
   }
}

/**
 * launch the manage notes dialog
 */
DAISYHelper.prototype.onManageNotes = function(note) {
   if (this.closed) {
      return;
   }
   if (this.notes.length==0) {
      return;
   }
   var current = this;
   var context = {
      note: note,
      database: this.service.database,
      notes: this.notes,
      updateNote: function(note) {
         this.database.updateNote(note);
         current.updateNoteRendering(note);
         current.updateNoteInMenu(note);
         note.point.labels[0].text = "Note: "+note.name;
         note.point.item.firstChild.firstChild.setAttribute("label",note.point.labels[0].text);
      },
      removeNote: function(note) {
         for (var i=0; i<this.notes.length; i++) {
            if (this.notes[i].id==note.id) {
               this.database.removeNote(note);
               current.book.removeNote(note);
               this.notes.splice(i,1);
               current.removeNoteRendering(note);
               current.removeNoteFromMenu(note);
               var sidebar  = current.getSidebarObject();
               if (sidebar) {
                  sidebar.notifyRemoveNote(note);
               }
               break;
            }
         }
      }
   };
   context.wrappedJSObject = context;
   
   var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"].getService(Components.interfaces.nsIWindowWatcher);
   this.noteManager = ww.openWindow(null,"chrome://daisy/content/manage-notes.xul",this.noteManagerId,"chrome,resizable", context);
   this.noteManager.focus();
}

/**
 * launch the add note dialog
 */
DAISYHelper.prototype.onAddNote = function() {
   var location = this.getBookLocation();
   if (!location) {
      this.console.log("Cannot find location target for note.");
      return;
   }
   this.console.debug("note target: "+location.xpath);
   var current = this;
   var heading = "";
   var node = location.target;
   while (node) {
      if (node.localName=="h1" || node.localName=="h2" || node.localName=="h3" || node.localName=="h4" || node.localName=="h5") {
         // TODO: We could use a general trim function
         heading = node.textContent.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
         break;
      }
      node = node.previousSibling;
   }
   var data = {
      location: location,
      name: heading+" / "+(this.notes.length+1),
      onClose: function() {
         current.noteDialogs[this.dialogIndex] = null;
         if (this.success) {
            var note = current.service.database.addNote(current.url,this.location.xpath,this.name,this.note);
            current.notes.push(note);
            current.addRenderedNote(note);
            current.addNoteToMenu(note);
            current.book.addNote(note,current.noteComparator);
            var sidebar  = current.getSidebarObject();
            if (sidebar) {
               sidebar.notifyAddNote(note);
            }
         }
      }
   };
   data.wrappedJSObject = data;
   var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"].getService(Components.interfaces.nsIWindowWatcher);
   var noteWindow = ww.openWindow(null,"chrome://daisy/content/add-note.xul",'daisy-add-note-'+(new Date()).getTime(),"chrome,resizable",data);
   noteWindow.focus();
   data.dialogIndex = this.noteDialogs.length;
   this.noteDialogs.push(noteWindow);
}

/**
 * Add a note and its rendered reference to our saved set, kept in sorted order.
 */
DAISYHelper.prototype.addRenderedNote = function(note) {
   var noteRef = this.renderNote(note);
   this.renderedNotes.push({ note : note, ref: noteRef});
   this.renderedNotes.sort(function(noteA,noteB) {
      var targetA = noteA.ref;
      var targetB = noteB.ref;
      return targetA.offsetTop == targetB.offsetTop ? targetA.offsetLeft - targetB.offsetLeft : targetA.offsetTop - targetB.offsetTop;
   });
}

/**
 * Move focus to the main window's action bar (paging, notes, play buttons).
 */
DAISYHelper.prototype.onMoveToActionBar = function() {
   var current = this;
   // Let any general window focus finish before we try to focus on the page field
   setTimeout(function() {
      current.console.debug("Focusing on action bar");
      current.window.document.getElementById("daisy-internal-description").focus();
   }, 300);
}

/**
 * Move focus to the browser sidebar and table of contents.
 */
DAISYHelper.prototype.onMoveToSidebar = function() {
   this.console.debug("Jumping to sidebar");
   var sidebar = this.getSidebarObject();
   if (sidebar) {
      sidebar.focus();
   }   
}

/**
 * Move focus to the book content area.
 */
DAISYHelper.prototype.onMoveToContent = function() {
   var target = this.window.document.getElementById("daisy-internal-book");
   this.console.debug("Focusing on id=" + target.id);
   if (target) {
      target.focus();
   } else {
      this.console.debug("No element found to focus");
   }   
}

/**
 * Play a sound file through the configured sound manager.
 */
DAISYHelper.prototype.playSound = function(fileName) {
   // XXX The extension ID really needs to be in a more central place.
   var extId = "{6be5ef88-4289-44d1-81f2-097313ed640b}";
   this.console.debug("Getting sound file '" + fileName + "', service id = " + extId);
   directoryService=Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties);
   fmDir = directoryService.get("ProfD", Components.interfaces.nsIFile);
   fmDir.append("extensions");
   fmDir.append(extId);
   var x=fileName.search("/");
   var s=fileName.substr(0,x);
   var s2=fileName.substr(x+1,fileName.length);
   fmDir.append(s);
   fmDir.append(s2);
   var soundUrl = DAISYHelper.fileURL(fmDir).spec;
   var soundContext = this.mainWindow.document.getElementById("daisy-sound-context");
   var soundManager = soundContext.contentWindow.soundManager;
   
   if (soundManager && soundManager.supported()) {
      var sound = soundManager.createSound({
         id: soundUrl,
         url: soundUrl,
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
      }
      waitFor();
   }
}

/**
 * Calculate the current position and return an XPath
 */
DAISYHelper.prototype.getElementXPath = function(node) {
   var concat = function(pre,post) {
      return post.length==0 ? pre : pre+"/"+post;
   }
   var xpath = "";
   while (node) {
      if (node.nodeType==1) {
         var id = node.getAttribute("id");
         if (id) {
            return concat("id('"+id+"')",xpath);
         }
         var count = 0;
         var current = node;
         while (current) {
            if (current.nodeType==1) {
               count++;
            }
            current = current.previousSibling;
         }
         xpath = concat("*["+count+"]",xpath);
      } else {
         xpath = "/"+xpath;
      }
      node = node.parentNode;
   }
   return xpath;
}


/**
 * find the book location from the scroll position
 */
DAISYHelper.prototype.getBookLocation = function() {
   var target = this.bookContext.element;
   if (!target) {
      this.console.debug("No book context, calculating by position.");
      if (!this.window.pagelist || this.window.pagelist.length==0) {
         // no pages
         var book = this.window.document.getElementById("daisy-internal-book");
         var child = book.firstChild;
         while (child && child.className!="daisy-book") {
            child = child.nextSibling;
         }
         if (child) {
            var top = child.firstChild;
            var node = top;
            this.console.debug("node: "+this.getElementXPath(node));
            while (node && (node.nodeType!=1 || (node.nodeType==1 && node.offsetTop<this.window.scrollY))) {
               if (node.nodeType==1 && node.firstChild) {
                  node = node.firstChild;
               } else if (node.nextSibling) {
                  node = node.nextSibling;
               } else {
                  while (!node.nextSibling) {
                     node = node.parentNode;
                     if (node==top) {
                        break;
                     }
                  }
                  node = node.nextSibling;
               }
            }
            target = node;
         }
      } else {
         target = this.window.pagelist[this.pageIndex].element;
         if (target.nextSibling) {
            var seek = target.nextSibling;
            while (seek && seek.nodeType!=1) {
               seek = seek.nextSibling;
            }
            if (seek) {
               target = seek;
            }
         }

      }

   } else if (this.window.pagelist && this.window.pagelist.length>0){
      /*
       * we have a book context but we also have pages, so check to see if
       * the current page is closer to the viewport
       */
      this.console.log("ypos="+this.bookContext.yPos+", top="+this.pageTop+", bottom="+this.pageBottom);
      if (this.bookContext.yPos<this.pageTop || this.bookContext.yPos>this.pageBottom) {
         /**
          * the context is not in the viewport, so use the current page
          */
         target = this.window.pagelist[this.pageIndex].element;

         this.console.log("page: "+target.getAttribute("id")+", "+target.textContent);
         /**
          * seek to the sibling of the page
          */
         if (target.nextSibling) {
            var seek = target.nextSibling;
            while (seek && seek.nodeType!=1) {
               seek = seek.nextSibling;
            }
            if (seek) {
               target = seek;
            }
         }
      }
   }
   if (target) {
      return {
         id: target.getAttribute("id"),
         target: target,
         xpath: this.getElementXPath(target)
      };
   } else {
      return null;
   }
}

/**
 * stop playback
 */
DAISYHelper.prototype.onStop = function() {
   if (!this.bookContext) {
      return;
   }
   this.bookContext.stop();
}

/**
 * previous action in playback
 */
DAISYHelper.prototype.onPrevious = function() {
   this.bookContext.previous();
}

/**
 * next button in playback
 */
DAISYHelper.prototype.onNext = function() {
   this.bookContext.next();
}

/**
 * play in playback
 */
DAISYHelper.prototype.onPlayCurrent = function() {
   if (this.window.focusTimer) {
      this.window.focusTimer.cancel();
      this.window.focusTimer = null;
   }
   if (!this.bookContext.playing) {
      this.service.tts.cancel();
   }
   this.bookContext.togglePlay();
}

/**
 * toggle the play button icon
 */
DAISYHelper.prototype.togglePlayButton = function(flag) {
   if (!this.window.document) {
      return;
   }
   if (flag) {
      this.window.document.getElementById("daisy-internal-play-button").firstChild.setAttribute("src",this.images["play"]);
   } else {
      this.window.document.getElementById("daisy-internal-play-button").firstChild.setAttribute("src",this.images["pause"]);
   }
}

DAISYHelper.prototype.updateImagePlaceHolders = function() {
   // the unactivated images are stored in the window
   var images = this.window.imagelist;

   // enumerate the unactivated images and look for images that need to be shown
   for (var i=0; i<images.length; i++) {

      // a span is stored in the document by id
      var target = this.window.document.getElementById(images[i].id);

      // replace the span with an image element to load the image
      var altSpan = this.window.document.getElementById("daisy-image-alt-"+images[i].id);

      altSpan.style.display = "inline-block";
      if (images[i].height.length>0) {
         altSpan.style.height = images[i].height;
      }
      if (images[i].width.length>0) {
         altSpan.style.width = images[i].width;
      }
   }
}

DAISYHelper.prototype.imageResize = function(img) {
   this.console.debug("DAISYHelper.imageResize: start");
   var pos = findPos(img);
   var rightEdge = pos[0]+img.originalSize.width;

   var padding = (img.offsetLeft-img.parentNode.offsetLeft)*2 + 2*DAISYHelper.imagePadding;  // + 20px padding

   if (rightEdge>img.ownerDocument.defaultView.innerWidth) {
      // resize image
      var delta = rightEdge-img.ownerDocument.defaultView.innerWidth;
      var width = img.originalSize.width-delta-20-padding; // 2*padding + 20 px of scrollbars
      if (width>40) {
         if (width>img.parentNode.clientWidth) {
            // adjust so that it is not larger than parent
            width = img.parentNode.clientWidth-padding;
         }
         if (img.getAttribute("height")) {
            img.removeAttribute("height");
         }
         this.console.debug("Resizing image width for "+img.getAttribute("src")+" from "+img.clientWidth+"px to "+width+"px");
         img.setAttribute("width",width+"");
         img.originalSize.resized = true;

      } else {
         this.console.log("Failed to resize image "+img.getAttribute("src")+" as it would be too small.");
      }
   } else if (img.originalSize.resized) {
      this.console.log("Restoring image "+img.getAttribute("src")+" size.");
      img.originalSize.resized = false;
      img.setAttribute("width",img.originalSize.width+"");
      img.setAttribute("height",img.originalSize.height+"");
      if (img.parentNode.clientWidth<img.clientWidth) {
         // resize to parent width minus padding
         this.console.log("Image overflowed, resizing image "+img.getAttribute("src")+" to parent.");
         img.setAttribute("width",(img.parentNode.clientWidth-padding)+"");
         img.removeAttribute("height");
         img.originalSize.resized = true;
      }
   } else if (img.parentNode.clientWidth<img.clientWidth) {
      // bad CSS rendering, force a resize
      // resize to parent width minus padding
      this.console.log("Resizing image "+img.getAttribute("src")+" to parent.");
      img.setAttribute("width",(img.parentNode.clientWidth-padding)+"");
      img.removeAttribute("height");
      img.originalSize.resized = true;
   }
}
/**
 * Calculates if new images need to be loaded based on scroll position
 */
DAISYHelper.prototype.updateImages = function() {
   var current = this;
   // Set the image active region to be viewport + 500px
   var pageTop = this.window.scrollY;
   if (pageTop<0) {
      pageTop = 0;
   }
   var pageBottom = this.window.scrollY+this.window.innerHeight+500;

   // the unactivated images are stored in the window
   var images = this.window.imagelist;

   var loaded = false;

   var loadCounter = this.scrollCounter+0;

   // enumerate the unactivated images and look for images that need to be shown
   for (var i=0; i<images.length; i++) {

      // a span is stored in the document by id
      var target = this.window.document.getElementById(images[i].id);

      // the span has to be in the image active region
      if (target.offsetTop>=pageTop && target.offsetTop<pageBottom && target.localName=="span") {
         // replace the span with an image element to load the image
         var altSpan = this.window.document.getElementById("daisy-image-alt-"+images[i].id);
         var img = this.window.document.createElementNS("http://www.w3.org/1999/xhtml","img");
         img.onload = function() {
            current.window.loadedImages.push(img);
            img.originalSize = {
               height: img.naturalHeight,
               width: img.naturalWidth
            };
            var h = img.getAttribute("height");
            if (h) {
               try {
                  img.originalSize.height = parseInt(h);
               } catch (ex) {
                  current.console.log("Bad image height value "+h+" on "+img.getAttribute("src"));
               }
            }
            var w = img.getAttribute("width");
            if (w) {
               try {
                  img.originalSize.width = parseInt(w);
               } catch (ex) {
                  current.console.log("Bad image width value "+w+" on "+img.getAttribute("src"));
               }
            }
            current.console.debug("Image "+img.getAttribute("src")+" loaded, scrollCounter="+current.scrollCounter+", loadCounter="+loadCounter);
            current.imageResize(img);
            var now = (new Date()).getTime();
            if (current.hash && current.scrollCounter==loadCounter && (now-current.changeLocationAt)<2000) {
               var id = current.hash.substring(1);
               var target = current.window.document.getElementById(id);
               if (target) {
                  current.window.scroll(0,findYPos(target)-DAISYHelper.positionOffset);
                  loadCounter++;
               }
            }
         }
         img.setAttribute("src",images[i].src);
         img.setAttribute("id",images[i].id);
         if (images[i].height.length>0) {
            img.setAttribute("height",images[i].height);
         }
         if (images[i].width.length>0) {
            img.setAttribute("width",images[i].width);
         }
         if (altSpan) {
            img.setAttribute("alt",altSpan.textContent);
            altSpan.parentNode.removeChild(altSpan);
         }
         var nextSibling = target.nextSibling;
         var parent = target.parentNode;
         parent.removeChild(target);
         if (nextSibling) {
            parent.insertBefore(img,nextSibling);
         } else {
            parent.appendChild(img);
         }

         // remove the image from the unactivated images
         images.splice(i,1);
         i--;

         // change the loaded status
         loaded = true;

         // update context if image is current context (happens on document load)
         if (this.bookContext.element==target) {
            this.bookContext.element = img;
            this.bookContext.element.className = target.className;
         }
      }
   }
   
   return loaded;
}

DAISYHelper.prototype.resize = function() {
   this.console.debug("DAISYHelper.resize()");
   this.resizeImages();
}

DAISYHelper.prototype.resizeImages = function() {
   for (var i=0; i<this.window.loadedImages.length; i++) {
      this.imageResize(this.window.loadedImages[i]);
   }
}

/**
 * changes position to nearest navigation item so next works.
 * This method is no longer used
 */
DAISYHelper.prototype.seekNavigationStart = function(target) {
   if (target.localName=="h1" || target.localName=="h2" || target.localName=="h3" || target.localName=="h4" || target.localName=="h5" || target.localName=="h6") {
      this.console.debug("Seeking previous for heading.");
      // attempt to seek to previous element so navigation starts at header
      var previous = target.previousSibling;
      while (previous && previous.nodeType!=1) {
         previous = previous.previousSibling;
      }
      if (previous) {
         // just set the context to the previous sibling and "next" will do the right thing
         target = previous;
         target = this.bookContext._findLastDescendant(target);
      } else {
         // set the context to the parent node and next will descend
         target = target.parentNode;
      }
   }
   return target;
}

/*
 * Notification method for when the fragment identifier is changed via the sidebar or otherwise
 * @param speakFlag Whether or not to invoke the voicing handler for the current element
 */
DAISYHelper.prototype.notifyTOCChange = function(speakFlag) {
   var id = this.window.location.hash.length>0 ? this.window.location.hash.substring(1) : null;
   if (!id) {
      return;
   }
   var target = this.window.document.getElementById(id);
   if (target) {
      //target = this.seekNavigationStart(target);
      this.bookContext.setElement(target,{ newPosition: true, invoke: speakFlag });
   }
}


/**
 * Called by the containing document when the tab or document is closed
 */
DAISYHelper.prototype.close = function() {
   this.closed = true;
   this.window.onfocus = null;

   this.onStop();
   if (this.service.tts) {
      this.service.tts.cancel();
   }

   //this.tab.linkedBrowser.removeProgressListener(this.locationListener);

   /*
    * unreference the book so that it can be unloaded from the cache
    */
   this.book.unref();
   this.console.debug("Closed book "+this.url);

   /**
    * close dialogs
    */
   for (var i=0; i<this.noteDialogs.length; i++) {
      if (this.noteDialogs[i]) {
         this.noteDialogs[i].close();
      }
   }
   if (this.noteManager) {
      this.noteManager.close();
   }

   /**
    * remove preference listener
    */
   this.service.removePreferenceObserver(this.prefListener);

   /**
    * calculate book position
    */

   var url = this.window.location.href;

   /**
    * first we'll try to preserve the keyboard navigation context
    * if it is on the page
    */
   var contextOnPage = false;
   var id = null;
   if (this.bookContext.element) {
      
      this.console.log("close, yPos="+this.bookContext.yPos+", top="+this.pageTop+", bottom="+this.pageBottom);

      if (this.bookContext.yPos>=this.pageTop && this.bookContext.yPos<=this.pageBottom) {

         // If there is a book context element and it has an 'id'
         // attribute, replace the fragment identifier (the TOC item)
         // with the element's id
         id = this.bookContext.element.getAttribute("id");
         if (id) {
            contextOnPage = true;
         }
      }
   }

   /**
    * if the context wasn't in the viewport or we can't construct
    * a url reference, we'll try to calculate the page.
    */
   if (!contextOnPage && this.pageIndex>=0) {
      id = this.window.pagelist[this.pageIndex].element.getAttribute("id");
      this.console.log("Using page number instead: "+id);
   }
   
   /**
    * update the fragment identifier
    */
   if (id) {
      // remove query
      var q = url.indexOf("?");
      if (q>0) {
         url = url.substring(0,q);
      }
      // replace has with book context element position
      var pos = url.indexOf("#");
      if (pos>0) {
         url = url.substring(0,pos)+"#"+id;
      } else {
         url = url+"#"+id;
      }
   }
   
   /**
    * update book position
    */
   this.console.debug("Updating book viewed: " + url);
   this.service.database.bookViewed(this.book.title=="" ? null : this.book.title, url);
   this.getSidebarObject().populateBooksMenu();
}

DAISYHelper.prototype.startLoadingIndicator = function() {
   var container = this.window.document.getElementById("daisy-internal-loading");
   var square = container.firstChild.nextSibling;
   var current = this;
   var direction = 1;
   var pos = 0;
   var move = function() {
      if (current.closed) {
         return;
      }
      if (current.context && current.context.isRendered) {
         container.style.display = "none";
         return;
      }
      //current.console.debug("tick");
      try {
         if (direction>0 && (pos+50)>container.offsetWidth) {
            direction = -1;
         } else if (direction<0 && pos==0) {
            direction = 1;
         }
         if (direction>0) {
            pos += 50;
         } else {
            pos -= 50;
         }
         square.style.left = pos+"px";
         current.loadingTimer = setTimeout(move,500);
      } catch (ex) {
         current.console.log("Error in loading timer: "+ex);
      }
   };
   this.loadingTimer = setTimeout(move,500);
}

/**
 * Bump the TTS voice rate up a notch.
 */
DAISYHelper.prototype.incrementVoiceRate = function() {
   var min = this.service.tts.minimumRate;
   var max = this.service.tts.maximumRate;
   // TODO: avoid assumption about the number of increments in the UI control.
   var increment = (max - min)/20;
   
   if (this.service.speechRate < max) {
      var newRate = this.service.speechRate + increment;
      if (newRate > max) {
         newRate = max;
      }
      this.service.speechRate = newRate;
      this.console.debug("Adjusting speech rate to " + newRate);
   }
}

/**
 * Bump the TTS voice rate down a notch.
 */
DAISYHelper.prototype.decrementVoiceRate = function() {
   var min = this.service.tts.minimumRate;
   var max = this.service.tts.maximumRate;
   // TODO: avoid assumption about the number of increments in the UI control.
   var increment = (max - min)/20;
   
   if (this.service.speechRate > min) {
      var newRate = this.service.speechRate - increment;
      if (newRate < min) {
         newRate = min;
      }
      this.service.speechRate = newRate;
      this.console.debug("Adjusting speech rate to " + newRate);
   }
}

DAISYHelper.prototype.speak = function(text,callback) {
   var lock = this.service.getLockFor("tts");
   var current = this;
   this.ownedLock = lock.acquire({
      exclusive: true,
      onRelinquish: function() {
         current.service.tts.cancel();
      }
   });
   this.service.tts.speak(text,{
      QueryInterface: function(aIID) {
         if (aIID.equals(Components.interfaces.nsITTSCallback) ||
            aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
            aIID.equals(Components.interfaces.nsISupports)) {
            return this;
         }
         throw Components.results.NS_NOINTERFACE;
      },
      onFinish: function() {
         if (current.ownedLock) {
            current.ownedLock.release();
            current.ownedLock = null;
         }
         if (callback) {
            callback();
         }
      }
   });

}

/**
 * XPCOM information to integrate into Javascript
 */
DAISYHelper.prototype.QueryInterface = function(iid) {
    if (iid.equals(Components.interfaces.nsISupports) || 
        iid.equals(Components.interfaces.nsIDAISYHelper) ||
        iid.equals(Components.interfaces.nsIClassInfo)) {
       return this;
    }
    throw Components.results.NS_ERROR_NO_INTERFACE;
};


DAISYHelper.prototype.implementationLanguage = Components.interfaces.nsIProgrammingLanguage.JAVASCRIPT;
DAISYHelper.prototype.flags = Components.interfaces.nsIClassInfo.DOM_OBJECT;
DAISYHelper.prototype.getHelperForLanguage = function() { return null; }
DAISYHelper.prototype.getInterfaces = function(countRef) {
   var interfaces = [Components.interfaces.nsIDAISYHelper, Components.interfaces.nsIClassInfo, Components.interfaces.nsISupports];
   countRef.value = interfaces.length;
   return interfaces;
}
DAISYHelper.prototype._xpcom_categories = [{category:"JavaScript global constructor",entry:"DAISYHelper",value:"@benetech.org/daisy-helper"}];

/**
 * Flash block enable/disable code
 */

var FlashBlockHack = {
  prefs: Components.classes["@mozilla.org/preferences-service;1"]
         .getService(Components.interfaces.nsIPrefBranch)
         .QueryInterface(Components.interfaces.nsIPrefBranchInternal),
  valueSet: false,
  value: false,

  // Returns the value of the flashblock.enabled pref
  save: function() {
     if (this.prefs.prefHasUserValue("flashblock.enabled")) {
        this.value = this.prefs.getBoolPref("flashblock.enabled");
        this.valueSet = true;
//        this.console.debug("User value: "+this.value);
     } else {
        this.valueSet = false;
//        this.console.debug("flashblock.enabled is not set");
     }
     this.prefs.setBoolPref("flashblock.enabled", false);
  },


  // Sets the flashblock.enabled pref to the given boolean value
  restore: function() {
//     this.console.debug("Restoring flashblock.enabled");
     try {
        if (this.valueSet) {
           this.prefs.setBoolPref("flashblock.enabled", this.value);
        } else {
           this.prefs.clearUserPref("flashblock.enabled");
        }
     } catch (ex) {
     }
  }

}


function GenericComponentFactory(ctor, params) {
  this._ctor = ctor;
  this._params = params;
}
GenericComponentFactory.prototype = {
  _ctor: null,
  _params: null,

  createInstance: function GCF_createInstance(outer, iid) {
    if (outer != null)
      throw Cr.NS_ERROR_NO_AGGREGATION;
    return (new this._ctor(this._params)).QueryInterface(iid);
  },

  QueryInterface: function GCF_QueryInterface(iid) {
    if (iid.equals(Components.interfaces.nsIFactory) ||
        iid.equals(Components.interfaces.nsISupports))
      return this;
    throw Cr.NS_ERROR_NO_INTERFACE;
  }
};

var components = [DAISYHelper];
/*function NSGetModule(compMgr, fileSpec) {
    return XPCOMUtils.generateModule(components);  
}*/

/**
* XPCOMUtils.generateNSGetFactory was introduced in Mozilla 2 (Firefox 4).
* XPCOMUtils.generateNSGetModule is for Mozilla 1.9.2 (Firefox 3.6).
*/
if (XPCOMUtils.generateNSGetFactory)
var NSGetFactory = XPCOMUtils.generateNSGetFactory(components);
else
    var NSGetModule = XPCOMUtils.generateNSGetModule(components);
