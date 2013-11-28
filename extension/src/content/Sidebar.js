Sidebar.prototype = new Settings();
Sidebar.prototype.constructor = Sidebar;

Sidebar.XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
Sidebar.SMIL_NS = "http://www.w3.org/2001/SMIL20/";
Sidebar.positionOffset = 80;
Sidebar.bookHistoryLimit = 20;

function Sidebar() {
   this._windowMediator = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
   this.OS = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime).OS;
   var current = this;

   // Hold on to things that a closure might need and not have access to
   this.fileUrlInterface = Components.interfaces.nsIFileURL;
   this.fileInterface = Components.interfaces.nsIFile;
}

Sidebar.getInstance = function() {
   if (!Sidebar.instance) {
      Sidebar.instance = new Sidebar();
   }
   return Sidebar.instance;
};

Sidebar.prototype.fileFromURI = function(suri) {
   var uri = this.ios.newURI(suri,"UTF-8",null);
   if (uri.scheme=="file") {
      uri = uri.QueryInterface(this.fileUrlInterface);
      return uri.file;
   }
   return null;
};

Sidebar.prototype.fileURL = function(file) {
   return this.ios.newFileURI(file);
};

/**
 * Return the URL of the book associated with the given file.
 * If the book is one that has been opened recently, return the
 * saved location within the content.
 * @param file value from a file dialog choice
 * @return a URL string
 */
Sidebar.prototype.bookURL = function(file) {
	var result = "";
	var fileURL = this.fileURL(file);
	if (fileURL) {
		result = fileURL.spec;
	}
	
	// Check whether this is a book that the user has recently opened
	var history = this.service.database.getBookHistory(Sidebar.bookHistoryLimit);
	for (var i = 0; i < history.length; i++) {
		this.console.log("bookURL: fileURL = " + result + ", history.url = " + history[i].url);
		if (history[i].url == result
				&& history[i].position && history[i].position.length > 0) {
			result = result + "#" + history[i].position;
		}
	}
	return result;
};

/**
 * Return the URL with any relative anchor text (#) stripped off
 */
Sidebar.prototype.getBaseBookURL = function(spec) {
   var href = spec;
   var hash = href.indexOf("#");
   if (hash > 0) {
      href = href.substring(0,hash);
   }
   return href;
};

/**
 * Return the relative portion of the URL (the string after any hash symbol). 
 * @param url String
 * @return null if no hash found
 */
Sidebar.prototype.getURLHash = function(url) {
   var hash = null;
   var hashPos = url.indexOf("#");
   if (hashPos > 0) {
      hash = url.substring(hashPos + 1);
   }
   return hash;
};

Sidebar.prototype.init = function() {
   this.service.active = true;
   try {
   this.playButtonImageURI = this.fileURL(this.playButtonImage).spec;
   this.pauseButtonImageURI = this.fileURL(this.pauseButtonImage).spec;
   this.console.debug("Initializing sidebar");
   this.mainWindow = this._windowMediator.getMostRecentWindow("navigator:browser");
   this.soundContext = this.mainWindow.document.getElementById("daisy-sound-context");
   this.showSoundContextWindow = this.soundContext.boxObject.height>0;
   this.uivoice = new UIVoice();
   // Have our books voiced so long as the mode isn't 'Mute'
   this.uivoice.init([this.service.voicingComprehensive(), this.service.voicingBooks()]);
   
   var current = this;
   
   var helper = this.getHelper();
   if (helper) {
      helper.initSoundManager();
   }
   
   window.onkeypress = function(event) {
      current.console.debug("Sidebar: altKey="+event.altKey+" metaKey="+event.metaKey+" ctrlKey="+event.ctrlKey+" shiftCode="+event.shiftKey+" charCode="+event.charCode+" keyCode="+event.keyCode);
      if (event.shiftKey && event.altKey && event.ctrlKey && event.charCode==68) {
         // shift-ctrl-alt-d toggles debug
         if (current.service.debug) {
            current.console.log("Turning debug off.");
            current.service.debug = false;
         } else {
            current.console.log("Turning debug on.");
            current.service.debug = true;
         }
      } else if (event.shiftKey && event.altKey && event.ctrlKey && event.charCode==83) {
         // shift-ctrl-alt-s toggles sound manager context
         if (current.showSoundContextWindow) {
            current.showSoundContextWindow = false;
            current.soundContext.style.height = "0px";
         } else {
            current.showSoundContextWindow = true;
            current.soundContext.style.height = "300px";
         }
      } else if (!event.ctrlKey && event.altKey && event.shiftKey && event.keyCode == 113) {
         // alt-shift-F2 jumps to the action bar
         var tabBrowser = current.mainWindow.getBrowser();
         var helper = current.getHelper();
         var browserWindow = tabBrowser.selectedTab.linkedBrowser.contentWindow;
         current.console.debug("Jumping to action bar from sidebar");
         if (helper) {
            // Make sure any general focus handling happens in the window
            // before we move specifically to the action bar
            browserWindow.focus();
            helper.onMoveToActionBar();
         }
      } else if (!event.ctrlKey && !event.altKey && !event.shiftKey && event.keyCode == 13) {
    	  // Return key jumps to the content area
    	  current.console.debug("Jumping to content area from sidebar");
    	  current.onMoveToContent();
      }
   };
   if (!this.attached) {
      var tabBrowser = this.mainWindow.getBrowser();
      var tabUrl = tabBrowser.selectedTab.linkedBrowser.contentWindow.location.href;
      this.url = this.getBaseBookURL(tabUrl);
      current.console.debug("tab url: "+this.url);
      var book = this.service.getBook(this.url);
      if (book) {
         current.console.debug("OPF document detected.");

         // popup not supported warning if book isn't in English
         this.checkUnsupported(book);

         if (helper) {
            // only call for reopening sidebar when on the same OPF document
            var context = helper.context;
            if (context) {
               current.console.debug("Attaching to existing DAISY document: "+this.url);
               this.attach(this.url,context);
               if (this.bookSpec.contentWindow.daisyRendered) {
                  this.populateTOC(this.bookSpec);
                  this.update();
               }
            } else {
               current.console.debug("Helper does not have a context yet, waiting...");
               var waitCount = 0;
               var waitForContext = function() {
                  if (helper.context) {
                     current.init();
                  } else if (waitCount<600) {
                     waitCount++;
                     setTimeout(waitForContext,100);
                  } else {
                     current.console.log("Cannot get context from helper--render may have failed.");
                  }
               };
               waitForContext();
               return;
            }
         } else {
            current.console.log("No helper in tab: "+tabBrowser.selectedTab.linkedBrowser.contentWindow);
         }
      } else {
         // We don't have a DAISY book in the tab, so close the sidebar
         window.focus();
         this.mainWindow.toggleSidebar('openDaisySidebar', false);
      }
   }
   this.populateBooksMenu();
   
   // Play the opening sound the first time opened
   if (document.defaultView.parent.DAISYOverlay.getInstance().useCount() == 0) {
      var current = this;
      setTimeout(function() {
         current.onOpenCue(null);
      },250);
   }
      
   } catch (ex) {
      this.console.log(ex);
   }
};

Sidebar.prototype.onMoveToContent = function() {
   var helper = this.getHelper();
   if (helper) {
      helper.onMoveToContent();
   } else {
      this.console.log("Sidebar.onMoveToContent: no helper attached!");
   }
};

Sidebar.prototype.cancelVoice = function(element) {
   if (this.service.isMuted()) {
      return;
   }
   this.service.tts.cancel();
};

/**
 * If the self-voicing is turned on, speak text appropriate to the given UI element.
 */
Sidebar.prototype.voice = function(element) {
   this.uivoice.voice(element);
};

/**
 * Give voice to text if our voicing mode is turned on.
 * @param text any String
 */
Sidebar.prototype.voiceText = function(text) {
   if (this.service.readExtension()) {
	   // XXX Do we need to cancel before speaking?
       this.service.tts.cancel();
	   this.speak(text);
   }
};

/**
 * Speak a text string through the text-to-speech engine that is assigned.
 */
Sidebar.prototype.speak = function(text) {
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
      }
   });
};

Sidebar.prototype.setDocumentTitle = function(title) {
   var desc = document.getElementById("document-title");
   DOMUtil.getInstance().clearChildren(desc);
   desc.appendChild(desc.ownerDocument.createTextNode(title));
};

Sidebar.prototype.attach = function(url, context) {
   this.console.debug("Attach: " + url);
   var current = this;
   this.url = url;
   var tabBrowser = this._windowMediator.getMostRecentWindow("navigator:browser").getBrowser();
   this.bookSpec = {
      book: context.book,
      toc: document.getElementById("book-toc"),
      tocData: [],
      context: context,
      contentWindow: tabBrowser.selectedTab.linkedBrowser.contentWindow.wrappedJSObject,
      contentDocument: context.document
   };

   this.setDocumentTitle(this.bookSpec.book.title);
   var treechildren = this.bookSpec.toc.firstChild.nextSibling;
   this.bookSpec.toc.onselect = null;
   DOMUtil.getInstance().clearChildren(treechildren);

   this.bookSpec.toc.onselect = function() {
      if (!current.tocSelectFromScroll && current.bookSpec.toc.view.selection.currentIndex>=0) {
         current.tocSelect = true;
         var pos = parseInt(current.bookSpec.toc.view.getCellValue(current.bookSpec.toc.view.selection.currentIndex,current.bookSpec.toc.columns.getFirstColumn()));
         var makeSelector = function(index) {
            return function() {
               if (index!=current.bookSpec.toc.view.selection.currentIndex) {
                  current.tocSelect = false;
                  return;
               }
               current.tocSelectTimer = null;
               current.bookSpec.context.stop();
               current.bookSpec.context.owner.togglePlayButton(true);
               current.bookSpec.context.currentPoint = current.bookSpec.tocData[pos].point;

               // Setting the hash has some affect on JAWS context but ultimately does
               // not navigate JAWS to the TOC item.
               var tabBrowser = current.mainWindow.getBrowser();
               var helper = current.getHelper();
               helper.moveToLocation(current.bookSpec.tocData[pos].point.smilId);
               // Note: scrolling causes the document to "flash"
               setTimeout(function() {
                  helper.notifyTOCChange();
               },100);
               setTimeout(function() {
                  current.tocSelect = false;
               },250);
            };
         };
         setTimeout(makeSelector(current.bookSpec.toc.view.selection.currentIndex),500);
         
        var text = current.bookSpec.tocData[pos].point.labels[0].text;
        if (current.bookSpec.toc.view.isContainer(current.bookSpec.toc.view.selection.currentIndex)) {
           text += ", item has children, ";
           if (current.bookSpec.toc.view.isContainerOpen(current.bookSpec.toc.view.selection.currentIndex)) {
              text += ", is open";
           } else {
              text += ", is closed";
           }
        }
        current.console.debug("UI: tree item, text="+text);
        current.voiceText(text);
      }
      /*
      if (current.bookSpec.toc.view.selection.currentIndex>=0) {
         current.bookSpec.book.tocPosition = current.bookSpec.toc.view.selection.currentIndex
      }
      */
   };
   
   // Attach focus listener to play a tone and read the title
   this.bookSpec.toc.onfocus = function() {
      current.voiceText("Table of contents, " + current.bookSpec.book.title);
      
      if (current.service.soundNavigation) {
         current.getHelper().playSound("content/table_of_contents_1.mp3");
      }
   };
   
   if (this.bookSpec.contentWindow.daisyRendered) {
      this.update();
   }
   this.attached = true;

   // Trigger the TTS to be live now
   this.service.voicingEnabled = true;
};

/**
 * Return the DAISYHelper object attached to the current book.
 * If we can't find one, then return null.
 */
Sidebar.prototype.getHelper = function() {
   var tabBrowser = this.mainWindow.getBrowser();
   var helperWrapper = tabBrowser.selectedTab.linkedBrowser.contentWindow.wrappedJSObject.helper;
   if (helperWrapper) {
      return helperWrapper.wrappedJSObject;
   } else {
      return null;
   }
};

Sidebar.prototype.switchTo = function(url,context) {
   if (this.url==url) {
      return;
   }
   this.console.debug("switchTo: "+url);
   var current = this;
   this.url = url;
   var tabBrowser = this._windowMediator.getMostRecentWindow("navigator:browser").getBrowser();
   this.bookSpec = {
      book: context.book,
      toc: document.getElementById("book-toc"),
      tocData: [],
      context: context,
      contentWindow: tabBrowser.selectedTab.linkedBrowser.contentWindow.wrappedJSObject,
      contentDocument: context.document
   };
   this.populateBooksMenu();

   this.setDocumentTitle(this.bookSpec.book.title);

   // Reset the TOC tree widget with the data from the current book
   var treechildren = this.bookSpec.toc.firstChild.nextSibling;
   var onselect = this.bookSpec.toc.onselect;
   this.bookSpec.toc.onselect = null;
   DOMUtil.getInstance().clearChildren(treechildren);
   this.populateTOC(this.bookSpec);
   this.bookSpec.toc.onselect = onselect;
   
   this.updateNavigationPosition();
   this.updateContext(this.bookSpec.contentWindow.scrollY, true);
};

Sidebar.prototype.update = function() {
   if (!this.bookSpec || !this.attached) {
      return;
   }
   this.console.debug("Sidebar.update:");
   this.updateNavigationPosition();
   this.updateContext(this.bookSpec.contentWindow.scrollY, true);
   this.populateBooksMenu();
};

Sidebar.prototype.onAfterRender = function() {
   //this.console.log("onAfterRender()");
   if (!this.bookSpec) {
      return;
   }
   this.populateTOC();
   this.update();
};

Sidebar.prototype.focus = function() {
   var current = this;
   setTimeout(function() {
      current.bookSpec.toc.focus();
   },100);
};

Sidebar.prototype.openBook = function(book) {
   if (!this.unpackBook(book)) {
      return;
   }
   var entry = book.findByMediaType("application/oebps-package+xml");
   if (!entry) {
      entry = book.findByExtension("opf");
   }
   if (!entry) {
      throw "Cannot find OPF document in book manifest.";
   }
   var url = entry.resolve();
   var tab = this._newTab(url.spec);

};

Sidebar.prototype.destroy = function() {
   this.closed = true;
};

Sidebar.prototype.onPlay = function() {
   if (this.bookSpec.context.playContext) {
      this.bookSpec.context.stop();
      this.bookSpec.context.owner.togglePlayButton(true);
   } else {
      try {
         var pos = parseInt(this.bookSpec.toc.view.getCellValue(this.bookSpec.toc.view.selection.currentIndex, this.bookSpec.toc.columns.getFirstColumn()));
         var navPoint = this.bookSpec.tocData[pos].point;

         this.console.debug("Calling play on context "+navPoint.content.id);
         this.bookSpec.context.play(navPoint);
         this.bookSpec.context.owner.togglePlayButton(false);
      } catch (ex) {
         this.console.log(ex);
      }
   }
};

Sidebar.prototype.openDocument = function(url, forcenobook) {
   this.console.debug("Sidebar.openDocument");
   
   // If the URL is already open in a tab, just move to that tab
   var cleanurl = this.getBaseBookURL(url);
   var tabBrowser = this._windowMediator.getMostRecentWindow("navigator:browser").getBrowser();
   for (var i=0; i<tabBrowser.tabContainer.itemCount; i++) {
      var tab = tabBrowser.tabContainer.getItemAtIndex(i);
      var href = this.getBaseBookURL(tab.linkedBrowser.contentWindow.location.href);
      if (href == cleanurl) {
         tabBrowser.selectedTab = tab;
         tab.linkedBrowser.contentWindow.focus();
         // Move to the relative location in the URL.
         // If we can get a handle on the DAISYHelper for the existing tab,
         // we'll use its behavior that makes sure we scroll the current location into view.
         var helper = tab.linkedBrowser.contentWindow.wrappedJSObject.helper;
         if (helper) {
        	 helper.wrappedJSObject.moveToLocation(this.getURLHash(url));
         } else {
             tab.linkedBrowser.contentWindow.location = url;
         }
         return;
      }
   }

   if (!forcenobook) {
      var book = this.service.getBook(url);
      if (!book) {
         book = this.service.newBook(url);
      }

      // If the file is a local file, check to see if it is extracted
      if (url.substring(0,5)=="file:") {
         var extracted = false;
         var file = this.fileFromURI(url);
         if (file.exists()) {

            // It exists, but maybe only the OPF file was extracted
            var dirEntries = file.parent.directoryEntries;
            var opfTest = /\.opf$/;
            var nonOPFFound = false;
            while (!nonOPFFound && dirEntries.hasMoreElements()) {
               var bookFile = dirEntries.getNext().QueryInterface(this.fileInterface);
               if (!bookFile.leafName.match(opfTest)) {
                  nonOPFFound = true;
               }
            }
            extracted = nonOPFFound ? true : false;
         } else {
            // It doesn't exist, hopefully there is a zip file
            extracted = false;
         }
         this.console.debug("OPF found = " + extracted);
         if (!extracted) {
            var zipFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
            zipFile.initWithPath(file.parent.parent.path);
            zipFile.appendRelativePath(file.parent.leafName+".zip");
            var bks2File = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
            bks2File.initWithPath(file.parent.parent.path);
            bks2File.appendRelativePath(file.parent.leafName+".bks2");
            if (zipFile.exists() || bks2File.exists()) {
               var arcFile = zipFile.exists() ? zipFile : bks2File;
               var result = this.service.readZipPackaging(arcFile);
               if (result.document) {
                  book.zipFile = arcFile;
                  book.init();
                  book.loadPackaging(result.document,result.baseURI);
                  book.zipFile = arcFile;
                  this.console.debug("Book manifest from "+arcFile.path+" loaded.");
                  if (!this.unpackBook(book,true)) {
                     return;
                  }
               } else {
                  this.console.debug("No OPF document in zip "+arcFile.path);
                  return;
               }
            } else {
               alert("Cannot locate document: "+url);
               return;
            }
         }
      }
   }

   if (tabBrowser.selectedTab && tabBrowser.selectedTab.linkedBrowser.contentWindow.location.href=="about:blank") {
      tabBrowser.selectedTab.linkedBrowser.contentWindow.location = url;
   } else {
      var tab = this._newTab(url);
   }
};

Sidebar.prototype.checkUnsupported = function(book) {
    // popup not supported warning if book isn't in English
     var lang = book.metadata["Language"];
     if(lang ) {
         if (lang.indexOf("en") != 0) {
             alert("Non English books are not supported by AnyDaisy");
         }
     }
}

Sidebar.prototype.populateTOC = function() {
   if (this.bookSpec.tocDone) {
      return;
   }
   this.bookSpec.tocDone = true;
   var treechildren = this.bookSpec.toc.firstChild.nextSibling;
   for (var i=0; i < this.bookSpec.book.navigation.navMap.children.length; i++) {
      this.addNavigationPoint(this.bookSpec.tocData, treechildren, this.bookSpec.book.navigation.navMap.children[i], "toc-item");
   }
};

// DEBUG code
Sidebar.prototype.dumpTOCNav = function() {
   var tocItem = null;
   for (var i = 0; i < this.bookSpec.tocData.length; i++) {
	   tocItem = this.bookSpec.tocData[i];
	   this.console.debug("DEBUG: TOC item #" + i + ", point content ID: " + tocItem.point.content.id + ", scrollY: " + tocItem.scrollY + ", label: " + tocItem.point.labels[0].text);
   }
};

Sidebar.prototype.populateBooksMenu = function() {
   this.console.debug("Sidebar.populateBooksMenu");
   var mainWindow = this._windowMediator.getMostRecentWindow("navigator:browser");
   var booksMenu = mainWindow.document.getElementById("daisy-history-menu");
   // Create a fresh new menu from the entries in the database
   var db = this.service.database;
   var history = db.getBookHistory(Sidebar.bookHistoryLimit);
   while (booksMenu.itemCount > 0) {
      booksMenu.removeItemAt(0);
   }
   var current = this;
   var openFn = function(event) {
      // The menu item attributes hold the title (0), URL (1) and some boolean flag
      var targetUrl = event.target.attributes[1].value;
      current.openDocument(targetUrl);
   };
   for (var i=0; i < history.length; i++) {
      var url = history[i].url;
      if (history[i].position && history[i].position.length>0) {
         url = url+"#"+history[i].position;
      }
      this.console.debug(history[i].title+" -> "+url);
      var item = booksMenu.appendItem(history[i].title, url);
      item.addEventListener('command', openFn, true);
   }
};

Sidebar.prototype.constructNavigationPoint = function(navPoint,value,className) {
   var item = document.createElementNS(Sidebar.XUL_NS, "treeitem");
   if (navPoint.children.length > 0) {
      item.setAttribute("container","true");
   }
   var row = document.createElementNS(Sidebar.XUL_NS, "treerow");
   row.setAttribute("properties", navPoint.className ? navPoint.className : className);
   item.appendChild(row);
   var name = document.createElementNS(Sidebar.XUL_NS, "treecell");
   name.setAttribute("properties", navPoint.className ? navPoint.className : className);
   row.appendChild(name);
   name.setAttribute("label", navPoint.labels[0].text);
   name.setAttribute("value", value);
   return item;
};

Sidebar.prototype.addNavigationPoint = function(tocData,parent,navPoint,className) {
   tocData.push({
      point: navPoint
   });
   var item = this.constructNavigationPoint(navPoint, ""+(tocData.length-1), className);

   var children = document.createElementNS(Sidebar.XUL_NS, "treechildren");
   item.appendChild(children);

   for (var i=0; i<navPoint.children.length; i++) {
      this.addNavigationPoint(tocData, children, navPoint.children[i], className);
   }

   parent.appendChild(item);
   
   navPoint.item = item;
};

Sidebar.prototype.notifyAddNote = function(note) {
   var context = note.point;
   while (context.parent && !context.next) {
      context = context.parent;
   }
   if (!context.parent) {
      // we're at the end
      this.addNavigationPoint(this.bookSpec.tocData, this.bookSpec.toc.firstChild.nextSibling, note.point, "note");
   } else {
      context = context.next;
      // we have a next element
      // item = XUL TreeItem, item.firstChild = TreeRow, item.firstChild.firstChild = TreeCell
      // TODO: Add behavior to DAISYNavigationPoint to avoid having to do such nested references
      var index = parseInt(context.item.firstChild.firstChild.getAttribute("value"));
      // splice in the new data
      this.bookSpec.tocData.splice(index,0,{ point: note.point});
      // update the tocdata position
      for (var i=index+1; i<this.bookSpec.tocData.length; i++) {
         this.bookSpec.tocData[i].point.item.firstChild.firstChild.setAttribute("value",""+i);
      }
      // construct tree item
      var item = this.constructNavigationPoint(note.point, ""+index, "note");

      context.item.parentNode.insertBefore(item, context.item);
      note.point.item = item;
   }
   this.updateNavigationPosition();
};

/**
 * Pull a user note out of the TOC tree.
 * @param note a user note
 * @return null
 */
Sidebar.prototype.notifyRemoveNote = function(note) {
	var context = note.point;
	
	var currentIndex = this.bookSpec.toc.view.selection.currentIndex;
	    
    if (currentIndex > 0) {
        // TODO: This belongs within the DAISYNavigationPoint object
        context.item.parentNode.removeChild(context.item);
        
    	this.bookSpec.toc.view.selection.select(currentIndex - 1);
    	// XXX: Do we need to do this kind of update? (code is from updateContext()
    	//this.bookSpec.toc.treeBoxObject.ensureRowIsVisible(index);
    	//if (!this.bookSpec.context.playContext) {
    	   //this.bookSpec.context.currentPoint = this.bookSpec.tocData[pos].point;
    	//}
    }

	this.updateNavigationPosition();
};

// TODO: This really belongs in a method on bookSpec, since that's what's being manipulated
Sidebar.prototype.updateContext = function(scrollY,expand) {
   this.console.debug("Sidebar.updateContext: scrollY = " + scrollY);
   if (this.tocSelect || !this.bookSpec || this.bookSpec.toc.view.rowCount==0) {
      return;
   }
   // First, expand all first-level tree rows
   this.expandLevels(this.bookSpec.toc.view, 1);
   
   var pos = 0;
   // XXX: Is this trying to make up for the "window.scrolly - DAISYHelper.positionOffset" 
   // calcs done in DAISYHelper's onscroll()? If so, that's a dangerous long distance assumption
   var testPos = scrollY + Sidebar.positionOffset;
   for (; pos<this.bookSpec.tocData.length; pos++) {
      if (this.bookSpec.tocData[pos].scrollY>testPos) {
         break;
      }
   }
   pos--;
   this.console.debug("sidebar TOC position: "+pos+" scrollY="+testPos);
   if (pos<0) {
      pos = 0;
   }
   if (this.bookSpec.toc.view.rowCount==0) {
      return;
   }
   var index = pos>=this.bookSpec.toc.view.rowCount ? this.bookSpec.toc.view.rowCount-1 : pos;
   var rowPos = parseInt(this.bookSpec.toc.view.getCellValue(index,this.bookSpec.toc.columns.getFirstColumn()));
   while (rowPos>pos && index>0) {
      index--;
      rowPos = parseInt(this.bookSpec.toc.view.getCellValue(index,this.bookSpec.toc.columns.getFirstColumn()));
   }
   this.console.debug("Seeked to: "+rowPos);

   while (expand && rowPos!=pos) {
      if (this.bookSpec.toc.view.isContainerOpen(index)) {
         // we can't find the item
         this.console.debug("Stopping at item row "+rowPos+" as we've found an open ancestor.");
         break;
      } else {
         this.console.debug("**** Toggling tree at row index " + index);
         this.bookSpec.toc.view.toggleOpenState(index);
         // seek forward in the tree to find all items before the position that are now open
         while (rowPos<pos && index<this.bookSpec.toc.view.rowCount) {
            index++;
            if (index<this.bookSpec.toc.view.rowCount) {
               rowPos = parseInt(this.bookSpec.toc.view.getCellValue(index, this.bookSpec.toc.columns.getFirstColumn()));
            }
         }
         if (rowPos!=pos) {
            // go back one if we haven't found the target
            index--;
            rowPos = parseInt(this.bookSpec.toc.view.getCellValue(index, this.bookSpec.toc.columns.getFirstColumn()));
         }
      }
   }
   this.tocSelectFromScroll = true;
   this.bookSpec.toc.view.selection.select(index);
   this.bookSpec.toc.treeBoxObject.ensureRowIsVisible(index);
   if (!this.bookSpec.context.playContext) {
      this.bookSpec.context.currentPoint = this.bookSpec.tocData[pos].point;
   }
   this.tocSelectFromScroll = false;

};

/**
 * Expand a tree widget out a given number of levels.
 * If a child is already expanded beyond levels, it will be left as is
 * and not collapsed.
 * @param treeView a tree widget
 * @param levels number of levels deep to expand the tree
 */
Sidebar.prototype.expandLevels = function(treeView, levels) {
   this.console.debug("**** expanding treeview by " + levels + " levels");
   for (var levelIndex = 0; levelIndex < levels; levelIndex++) {
      // Work from the bottom of the tree up so that the row index
      // isn't thrown off when the tree expands
      for (var i = treeView.rowCount-1; i >= 0 ; i--) {
         // Check if the row is one we should expand 
         // (meaning it is 'levels' level deep)
         if (this.getAncestorIndex(treeView, i, levelIndex+1) === -1) {
//            this.console.debug("**** Found expandable row index: " + i + ", levelIndex: " + levelIndex);
            if (!treeView.isContainerOpen(i)) {
//               this.console.debug("---- Row was closed, opening");
               treeView.toggleOpenState(i);
            } else {
//               this.console.debug("---- Row was open, leaving alone");
            }
         } else {
//            this.console.debug("**** Found leaf-level row index: " + i + ", parent: " + treeView.getParentIndex(i));
         }
      }
   }
};

/**
 * Walk up the tree to get the ancestor of the element at rowIndex.
 * @param treeView a tree widget
 * @param rowIndex int
 * @param levels number of ancestor levels to backtrack
 * @return row index of the ancestor, or -1 if there is none
 */
Sidebar.prototype.getAncestorIndex = function(treeView, rowIndex, levels) {
   var parentIndex = -1;
   var childIndex = rowIndex;
   for (var i = 0; i < levels; i++) {
      parentIndex = treeView.getParentIndex(childIndex);
      childIndex = parentIndex;
      
      if (parentIndex == -1) {
         break;
      }
   }
   return parentIndex;
};

Sidebar.prototype.updateNavigationPosition = function() {
   if (!this.bookSpec) {
      return;
   }
   var missing = [];
   this.console.debug("Updating navigation positions from document.");

    var spec;
    var smilObj;
   for (var i=0; i<this.bookSpec.tocData.length; i++) {
      var point = this.bookSpec.tocData[i].point;
//      this.console.debug(point.content.id + " -> " + this.bookSpec.tocData[i].scrollY);

      var target = this.bookSpec.contentDocument.getElementById(point.content.id);
      if (target) {
         this.bookSpec.tocData[i].scrollY = target.offsetTop;
         this.bookSpec.tocData[i].point.smilId = point.content.id;
      } else {
       //todo: this needs to be made more efficient and cleaned up. just wanted to check in for now
       if (!smilObj) {
          smilObj = this.bookSpec.context.getSMIL(point.content.href);
        }
       var myURL = this.bookSpec.context.baseURI.resolve(point.content.href);
       //this.console.log("myURL.spec = " + myURL.spec);
       spec = smilObj.resourceManager.load(myURL.spec);
       //this.console.log("spec=" + spec);
         var elem = spec.getElementById(point.content.id);
          //this.console.log("elem=" + elem);
        var quirks = this.bookSpec.context.quirky || false;
        var util = DOMUtil.getInstance();
         var newId;
       var src;
       util.forChildNS(elem,"text",quirks ? null : this.SMIL_NS,function(content) {
          src = content.getAttribute("src");
          var pos = src.indexOf('#');
          newId = src.substring(pos+1);
       });
         //this.console.log("newId=" + newId);
         if (newId) {
            target = this.bookSpec.contentDocument.getElementById(newId);
            if (target) {
                 this.bookSpec.tocData[i].scrollY = target.offsetTop;
                 this.bookSpec.tocData[i].point.smilId = newId;
            } else {
                missing.push(point.content.id);
            }
         } else {
            missing.push(point.content.id);
         }
      }
   }
   if (missing.length>0) {
      this.console.log("Cannot find navigation point(s): "+missing);
   }
   // DEBUG
//   this.dumpTOCNav();
};

Sidebar.prototype._newTab = function(url) {
  var tabBrowser = this._windowMediator.getMostRecentWindow("navigator:browser").getBrowser();
  var tab = tabBrowser.addTab(url);
  tabBrowser.selectedTab = tab;
  tab.linkedBrowser.contentWindow.focus();
  return tab;
};

Sidebar.prototype.resize = function() {
   this.console.log("resize()");
   if (this.bookSpec && this.bookSpec.contentWindow.daisyRendered) {
      this.updateNavigationPosition();
   }
};

Sidebar.prototype.openFeedback = function() {
    var myUrl = "http://bookshare.uservoice.com/forums/91435-anydaisy-user-feedback";
    var openTab = function () {
            gBrowser.selectedTab = gBrowser.addTab(myUrl);
        };

    window.setTimeout(openTab, 1500);
};

Sidebar.prototype.browseForFile = function() {
   this.service.tts.cancel();

   var fp = null;
   var nsIFilePicker = Components.interfaces.nsIFilePicker;
   if (this.service.readComprehensive()) {
      fp = new FilePicker();
      fp.title = "Choose Book (zip, opf or bks2)";
   } else {
      fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
      fp.init(window, "Choose Daisy 3 Text Only Book (zip, opf or bks2)", nsIFilePicker.modeOpen);
   }
   fp.appendFilter("DAISY Book","*.zip;*.bks2;*.opf");
   if (fp.show() == nsIFilePicker.returnOK) {
      var opfTest = /\.opf$/;
      var zipTest = /\.zip$/;
      var bks2Test = /\.bks2$/;
      if (fp.file.leafName.match(opfTest)) {
         var url = this.bookURL(fp.file);
         this.openDocument(url);
      } else if (fp.file.leafName.match(zipTest) || fp.file.leafName.match(bks2Test)) {
         var bookDir = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
         bookDir.initWithPath(fp.file.parent.path);
         var pos = fp.file.leafName.lastIndexOf(".zip");
         if (pos<0) {
            pos = fp.file.leafName.lastIndexOf(".bks2");
         }
         var dirName = fp.file.leafName.substring(0,pos);
         bookDir.appendRelativePath(dirName);
         if (bookDir.exists()) {
            var opfFile = this.service.findPackagingInDirectory(bookDir);
            var url = this.bookURL(opfFile);
            this.openDocument(url);
         } else {
            var result = this.service.readZipPackaging(fp.file);
            if (result.document) {
               var book = this.service.newBook();
               book.init();
               book.loadPackaging(result.document,result.baseURI);
               book.zipFile = fp.file;
               this.openBook(book);
            } else {
               alert("This zip file does not seem to contain a DAISY book.");
            }

         }
      }
   }
};

/**
 * Open up the Help manual to the section with the given ID.
 * Relative anchors are interpreted in AnyDAISY as id attribute values, not anchor names.
 * @param elementId if null, then just use the base URL of the Help manual
 */
Sidebar.prototype.onHelp = function(elementId) {
   var url = this.fileURL(this.helpOPF);
   if (elementId) {
      url.spec += "#"+elementId;
   }
   this.openDocument(url.spec);
};

Sidebar.prototype.onBookshare = function(relativePath) {
	var url = "http://www.bookshare.org/";
	if (relativePath) {
		url = url + relativePath;
	}
	
   this.openDocument(url, true);
};

/**
 * Handle opening the toolbar from a menu or button choice.
 * If the current tab is a DAISY book, load its table of contents.
 * Otherwise, load the Help document.
 */
Sidebar.prototype.onOpen = function() {
   var tabBrowser = this.mainWindow.getBrowser();
   var tabUrl = tabBrowser.selectedTab.linkedBrowser.contentWindow.location.href;
   this.url = this.getBaseBookURL(tabUrl);
   var book = this.service.getBook(this.url);
   if (book) {
      // Shouldn't have to do anything; the TOC will already be set up
   } else {
      this.onHelp();
   }
};

Sidebar.prototype.onOpenCue = function(oncomplete) {
   if (!this.service.cueSidebarOpen) {
      return;
   }
   var soundWindow = this.soundContext.contentWindow;
   var current = this;
   var helper = this.getHelper();
   var soundCount = 0;
   var tryCount = 0;
   var waitForSoundManager = function() {
      if (soundWindow.soundManager && soundWindow.soundManager._didInit && !current.inSoundManagerInit) {
         if (soundWindow.soundManager.supported()) {
            helper.playSound("content/loaded.mp3");
         } else if (tryCount<2) {
            current.console.log("soundManager didn't load, retrying...");
            tryCount++;
            soundCount = 0;
            helper.initSoundManager(true);
            setTimeout(waitForSoundManager,100);
         } else {
            current.console.log("soundManager is not supported.");
            current.skipSoundManager = true;
            current.writeContent();
         }
      } else if (soundCount<30) {
         soundCount++;
         setTimeout(waitForSoundManager,100);
      } else {
         current.console.log("No soundManager instance could be found in sound context.");
         current.skipSoundManager = true;
         current.writeContent();
      }
   };
   waitForSoundManager();
};

var theSidebar = Sidebar.getInstance();
