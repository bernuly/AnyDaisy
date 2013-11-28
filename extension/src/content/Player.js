Player.prototype = new BookManager();
Player.prototype.constructor = Player;

Player.ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
Player.fileURL = function(file) {
   return Player.ios.newFileURI(file);
}


function Player() {
   this.pageNo = document.getElementById("page-no");
   this.renderer = this.service.createRenderer();
   this.renderer.setSMILTransform("chrome://daisy/content/daisy/dtbook2smil.xsl");
   this.renderer.setXHTMLTransform("chrome://daisy/content/daisy/dtbook2xhtml.xsl");
}

Player.getInstance = function() {
   if (!Player.instance) {
      Player.instance = new Player();
   }
   return Player.instance;
}

Player.prototype.init = function() {
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
   this.playButton = document.getElementById("play");
   this.filename = document.getElementById("filename");
   this.booklist = document.getElementById("booklist");
   var current = this;
   this.booklist.ondblclick = function() {
      var book = current.library.findByURI(current.booklist.selectedItem.value);
      if (book) {
         current.openBook(book);
      }
   };
   this.booklist.onkeypress = function(event) {
      if (event.keyCode==13) {
         var book = current.library.findByURI(current.booklist.selectedItem.value);
         if (book) {
            current.openBook(book);
         }
      }
   };

   for (var i=0; i<this.library.books.length; i++) {
      this.showBook(this.library.books[i]);
   }

   this.bookDeck = document.getElementById("book-deck");
   document.getElementById("book-deck-hack").addEventListener('focus',function() {
      //this.console.log("book deck focused");
      current.bookDeck.selectedPanel.contentWindow.focus();
   },true);
   this.bookTOCDeck = document.getElementById("book-toc-deck");
   document.getElementById("book-toc-deck-hack").addEventListener('focus',function() {
      //this.console.log("book toc deck focused");
      if (current.openBooks.length==0) {
         return;
      }
      current.openBooks[current.currentBook].toc.focus();
   },true);
   this.tabs = document.getElementById("main-tabs");
   this.bookMenuPopup = document.getElementById("book-menu-popup");
   this.bookMenuPopup.addEventListener('popupshown',function() {
      current.openBookMenuList.selectedIndex = current.currentBook;
      current.openBookMenuList.focus();
   },true);
   this.openBookMenuList = document.getElementById("book-menu-list");
   this.openBookMenuList.addEventListener('keypress',function(event) {
      if (current.openBookMenuList.selectedIndex<0) {
         return;
      }
      var bookSpec = current.openBooks[current.openBookMenuList.selectedIndex];
      if (event.keyCode==8 || event.keyCode==46) {
         //this.console.log("Delete: "+bookSpec.book.title);
         current.closeBook(bookSpec.position);
         current.bookMenuPopup.hidePopup();
      } else if (event.keyCode==13) {
         //this.console.log("Open: "+bookSpec.book.title);
         current.showBookInDeck(bookSpec.position);
         current.bookMenuPopup.hidePopup();
      }
   },true);
   this.selectingDeck = false;

   var searchValue = document.getElementById("search");
   searchValue.onkeypress = function(event) {
      if (event.keyCode==13) {
         current.onBookSearch(searchValue.value);
       }
   };
   document.getElementById("search-action").onclick = function() {
      current.onBookSearch(searchValue.value);
   }
   var pageValue = document.getElementById("page");
   pageValue.onkeypress = function(event) {
      if (event.keyCode==13) {
         current.onGotoPage(pageValue.value);
      }
   };
   document.getElementById("page-action").onclick = function() {
      current.onGotoPage(pageValue.value);
   }
   document.getElementById("bookmark-action").onclick = function() {
      current.onBookmark();
   }

   document.getElementById("toc-splitter").addEventListener('mouseup',function(event) {
      current.onTOCResize();
   },true);
}

Player.prototype.showBook = function(book) {
   this.booklist.appendItem(book.title,book.uris["opf"]);
}


/**
 * Constructs UI specific elements for the book spec
 */
Player.prototype.constructBook = function(spec) {
   var current = this;
   
   spec.browser =  document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul","browser");
   spec.browser.disablehistory = true;
   spec.browser.disablesecurity = true;

   spec.richitem = this.openBookMenuList.appendItem(spec.book.title);

   this.bookTOCDeck.appendChild(spec.sidebar);
   this.bookTOCDeck.selectedIndex = spec.position;

   this.bookDeck.appendChild(spec.browser);
   this.bookDeck.selectedIndex = spec.position;

   spec.richitem.addEventListener('mouseover',function(event) {
      current.openBookMenuList.selectedIndex = spec.position;
      //this.console.log("Selected: ("+current.openBookMenuList.selectedIndex+") "+book.title);
   },true);
   spec.richitem.addEventListener('click',function(event) {
      current.showBookInDeck(spec.position);
      current.bookMenuPopup.hidePopup();
      //this.console.log("Open: ("+current.openBookMenuList.selectedIndex+") "+book.title);
   },true);
   spec.richitem.className = "current";
   if (this.currentBook>=0) {
      var oldSpec = this.openBooks[this.currentBook];
      if (oldSpec) {
         oldSpec.richitem.className = "";
      }
   }
}

/**
 * update after the book has been setup and render has been initiated (but not necessarily complete)
 */
Player.prototype.onAfterNewBookUpdate = function(spec) {

   document.getElementById("page").value = "";
   document.getElementById("search").value = "";
   spec.collapsed = false;
   if (spec.navigation.navMap.children.length==1) {
      spec.collapsed = true;
      document.getElementById("toc-splitter").setAttribute("state","collapsed");
   } else {
      document.getElementById("toc-splitter").setAttribute("state","open");
      spec.toc.focus();
   }

   this.showTab(1);

}

// Saves the current book's state
Player.prototype.saveCurrentBook = function() {
   if (this.openBooks.length==0) {
      return;
   }
   var bookSpec = this.openBooks[this.currentBook];
   bookSpec.collapsed = document.getElementById("toc-splitter").getAttribute("state")=="collapsed";
   bookSpec.pageText = document.getElementById("page").value;
   bookSpec.searchText = document.getElementById("search").value;
}

Player.prototype.showBookInDeck = function(pos,nosave) {
   if (!nosave) {
      this.saveCurrentBook();
   }
   this.bookDeck.selectedIndex = pos;
   this.bookTOCDeck.selectedIndex = pos;
   if (this.currentBook>=0) {
      var oldSpec = this.openBooks[this.currentBook];
      if (oldSpec) {
         oldSpec.richitem.className = "";
      }
   }
   this.currentBook = pos;
   //this.selectOpenBook();
   this.showTab(1);
   this.calculatePage();
   var bookSpec = this.openBooks[this.currentBook];
   bookSpec.richitem.className = "current";
   document.getElementById("toc-splitter").setAttribute("state",bookSpec.collapsed ? "collapsed" : "open");
   document.getElementById("page").value = bookSpec.pageText;
   document.getElementById("search").value = bookSpec.searchText;
}

Player.prototype.openRenderedView = function(spec,onComplete) {
   var browser = spec.browser;
   browser.fastFind.init(browser.docShell);
   browser.fastFind.setSelectionModeAndRepaint(Components.interfaces.nsISelectionController.SELECTION_ON);
   var book = spec.book;
   var navigation = spec.navigation;
   var renderedURL = Player.fileURL(this.renderedPlayerFile).spec;

   var current = this;
   var onLoad = function() {
      //this.console.log("onLoad()");
      var bookTarget = browser.contentDocument.getElementById("book");
      spec.contentWindow = browser.contentWindow;
      spec.contentDocument = browser.contentDocument;
      browser.contentWindow.onscroll = function() {
         current.calculatePage();
         current.updateContext(browser.contentWindow.scrollY+BookManager.positionOffset);
      }
      var soundWindow = browser.contentWindow;
      var trySound = 0;
      var soundManager = null;
      var doShow = function() {
         spec.soundManager = soundManager;
         spec.context = current.renderer.createNavigationContext(book,navigation,{
            soundManager: soundManager,
            sound: current.sound,
            region: bookTarget,
            focusFollow: current.focusFollow,
            highlight: current.highlight,
            onFinish: function() { current.onFinishPlay(); }
         });
         spec.context.document = browser.contentDocument;
         browser.contentDocument.body.style.color = "rgb(0,0,0)";
         var smDebug = browser.contentDocument.getElementById("soundmanager-debug");
         if (smDebug) {
            smDebug.style.display = "none";
         }
         var smDebugToggle = browser.contentDocument.getElementById("soundmanager-debug-toggle");
         if (smDebugToggle) {
            smDebugToggle.style.display = "none";
         }
         //browser.contentWindow.renderApp.init(navContext);
         var renderContext = current.renderer.xhtmlRender(book,bookTarget);
         renderContext.onload = function() {
            current.calculatePage();
            setTimeout(function() {
               current.updateNavigation(spec);
               if (onComplete) {
                  onComplete();
               }
            },500);
            setTimeout(function() {
               current.updateNavigation(spec);
            },1000);
            setTimeout(function() {
               current.updateNavigation(spec);
            },5000);
            if (spec.context.onload) {
               spec.context.onload();
            }
         }
         renderContext.show();
      };
      var waitForSoundManager = function() {
         if (soundWindow.soundManager && soundWindow.soundManager._didInit) {
            if (soundWindow.soundManager.supported()) {
               soundManager = soundWindow.soundManager;
               //soundWindow.soundManager.play("test",Player.fileURL(current.soundTest).spec);
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

   };

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
           //this.console.log(aFlag+" "+aStatus);
           onLoad();
         }
         return 0;
      },

      onLocationChange: function(aProgress, aRequest, aURI) { return 0; },
      onProgressChange: function() {return 0;},
      onStatusChange: function() {return 0;},
      onSecurityChange: function() {return 0;},
      onLinkIconAvailable: function() {return 0;}
   };
   browser.addProgressListener(myListener,Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);
   browser.loadURI(renderedURL,null,null);
   return;
}

Player.prototype.browseForFile = function() {
   
   var nsIFilePicker = Components.interfaces.nsIFilePicker;
   var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
   fp.init(window, "Choose Book Zip File", nsIFilePicker.modeOpen);
   fp.appendFilter("DAISY Book","*.zip;*.bks2;*.opf");
   if(fp.show() == nsIFilePicker.returnOK) {
      this.filename.value = fp.file.path;
   }
}

Player.prototype.onPlay = function() {
   switch (this.tabs.selectedIndex) {
      case 0:
         var book = this.library.findByURI(this.booklist.selectedItem.value);
         if (book) {
            var current = this;
            this.openBook(book,function() {
               current.onPlayCurrent();
            });
         }
         break;
      case 1:
         this.onPlayCurrent();
         break;
   }
}

Player.prototype.focusOn = function(navPoint) {
   if (this.openBooks.length==0) {
      return;
   }
   var bookSpec = this.openBooks[this.currentBook];
   var target = bookSpec.browser.contentDocument.getElementById(navPoint.content.id);
   target.focus();
}

Player.prototype.onBookSearch = function(value) {
  
   if (this.openBooks.length==0) {
      return;
   }
  
   var bookSpec = this.openBooks[this.currentBook];
  
   /*
   var result = 1;
   if (bookSpec.browser.fastFind.searchString!=value) {
      result = bookSpec.browser.fastFind.find(value,false);
   } else {
      result = bookSpec.browser.fastFind.findAgain(false,false);
   }
   switch (result) {
      case 0:
         document.getElementById("search").style.backgroundColor = "rgb(255,255,255)";
         break;
      case 1:
         if (bookSpec.soundManager) {
            bookSpec.soundManager.play("internal-search-notfound",Player.fileURL(this.notFoundSound).spec);
         }
         document.getElementById("search").style.backgroundColor = "rgb(255,0,0)";
         break;
      case 2:
         if (bookSpec.soundManager) {
            bookSpec.soundManager.play("internal-search-wrapped",Player.fileURL(this.searchWrappedSound).spec);
         }
         break;
   }
   */
 
   this.inSearchFade = false;
    
   document.getElementById("search").boxObject.firstChild.firstChild.style.backgroundColor = "rgb(255,255,255)";
   bookSpec.browser.webBrowserFind.searchString = value;
   bookSpec.browser.webBrowserFind.wrapFind = true;
   if (!bookSpec.browser.webBrowserFind.findNext()) { 
      if (bookSpec.soundManager) {
         bookSpec.soundManager.play("internal-search-notfound",Player.fileURL(this.notFoundSound).spec);
       }
      this.startFadeOut(document.getElementById("search").boxObject.firstChild.firstChild,255,150,150);
     } else {
      document.getElementById("search").boxObject.firstChild.firstChild.style.backgroundColor = "rgb(255,255,255)";
    }
   // Focus the searched element.
   bookSpec.browser.webBrowserFind.focus();
  }

Player.prototype.startFadeOut = function(target,red,green,blue) {
   this.inSearchFade = true;
   var current = this;
   var increment = function(red,green,blue) {
      if (!current.inSearchFade) {
         target.style.backgroundColor = "rgb(255,255,255)";
         return;
      }
      target.style.backgroundColor = "rgb("+red+","+green+","+blue+")";
      if (red<255 || green<255 || blue<255) {
         if (red<255) {
            red++;
         }
         if (green<255) {
            green++;
         }
         if (blue<255) {
            blue++;
         }
         setTimeout(function() {
            increment(red,green,blue);
         },25);
      }
   };
   increment(red,green,blue);
}

Player.prototype.onBookmark = function() {
   this.console.log("Bookmark");
}

Player.prototype.onOpenBookClick = function() {
   if (((new Date()).getTime()-this.openBookTimestamp)>500) {
      this.showOpenBookMenu();
   }
   this.openBookTimestamp = null;
}

Player.prototype.onOpenBookDown = function() {
   this.openBookTimestamp = (new Date()).getTime();
}

Player.prototype.showOpenBookMenu = function() {

   if (this.openBooks.length>0) {
      try {
         this.showTab(1);
         this.bookMenuPopup.openPopup(this.tabs.selectedTab,"after_start",0,0,false,false);
         var height = this.openBookMenuList.boxObject.height;
         if (height>250) {
            height = 250;
         }
         this.bookMenuPopup.sizeTo(250,height);
      } catch (ex) {
         this.console.log(ex);
      }
   }
}

Player.prototype.onUpdatePage = function(pageId,page,total) {
   this.pageNo.value = page>0 ? "Page "+page+" of "+total : "";
}

Player.prototype.showTab = function(index) {
   this.tabs.selectedIndex = index;
   this.onSelectTab(index);
}

Player.prototype.onSelectTab = function(index) {
   for (var i=0; i<this.tabs.tabs.itemCount; i++) {
      var tab = this.tabs.tabs.getItemAtIndex(i);
      if (i==index) {
         tab.setAttribute("tabindex","6");
      } else {
         tab.removeAttribute("tabindex");
      }
   }
   this.updateTitle();
   this.onStop();
   switch (index) {
      case 0:
         document.getElementById("previous").disabled = true;
         document.getElementById("next").disabled = true;
         document.getElementById("play").disabled = false;
         break;
      case 1:
         document.getElementById("previous").disabled = false;
         document.getElementById("next").disabled = false;
         document.getElementById("play").disabled = false;
         break;
      case 2:
         document.getElementById("previous").disabled = true;
         document.getElementById("next").disabled = true;
         document.getElementById("play").disabled = true;
         break;
   }
}
 
Player.prototype.updateTitle = function() {
   switch (this.tabs.selectedIndex) {
      case 0:
         document.documentElement.title = "DAISY - Bookshelf";
         break;
      case 1:
         if (this.openBooks.length==0) {
            document.documentElement.title = "DAISY - No Open Book";
         } else {
            var bookSpec = this.openBooks[this.currentBook];
            document.documentElement.title = "DAISY - "+bookSpec.book.title;
         }
         break;
      case 2:
         document.documentElement.title = "DAISY - Download New Book";
   }
   document.title = document.documentElement.title;
}

Player.prototype.onTOCResize = function() {
   if (this.openBooks.length==0) {
      return;
   }
   var bookSpec = this.openBooks[this.currentBook];
   this.resize();
   this.tocSelect = true;
   var pos = parseInt(bookSpec.toc.view.getCellValue(bookSpec.toc.view.selection.currentIndex,bookSpec.toc.columns.getFirstColumn()));
   this.onStop();
   this.moveTo(bookSpec,bookSpec.tocData[pos].point);
   var current = this;
   setTimeout(function() {
      current.tocSelect = false;
   },500);
}

Player.prototype.onResize = function(event) {
   if (event.eventPhase!=2) {
      return;
   }
   /*
   for (var id in event) {
      this.console.log(id+"="+event[id]);
   }
   */
   this.resizeTimestamp = (new Date()).getTime();
   //this.console.log("timestamp: "+this.resizeTimestamp);
   var current = this;
   setTimeout(function() {
      var now = (new Date()).getTime();
      //this.console.log("timer: "+now+" - "+current.resizeTimestamp+" = "+(now-current.resizeTimestamp));
      if ((now-current.resizeTimestamp)>450) {
         current.resize();
      }
   },500);
}


Player.prototype.onZoomIn = function() {
   if (this.openBooks.length==0) {
      return;
   }
   var bookSpec = this.openBooks[this.currentBook];
   bookSpec.browser.markupDocumentViewer.fullZoom = bookSpec.browser.markupDocumentViewer.fullZoom+0.25;
   this.console.debug("Zoom in: "+bookSpec.browser.markupDocumentViewer.fullZoom);
   bookSpec.browser.contentWindow.scrollBy(0,1);
   bookSpec.browser.contentWindow.scrollBy(0,-1);
}

Player.prototype.onZoomOut = function() {
   if (this.openBooks.length==0) {
      return;
   }
   var bookSpec = this.openBooks[this.currentBook];
   bookSpec.browser.markupDocumentViewer.fullZoom = bookSpec.browser.markupDocumentViewer.fullZoom-0.25;
   this.console.debug("Zoom out: "+bookSpec.browser.markupDocumentViewer.fullZoom);
   bookSpec.browser.contentWindow.scrollBy(0,1);
   bookSpec.browser.contentWindow.scrollBy(0,-1);
}

Player.prototype.onZoomReset = function() {
   if (this.openBooks.length==0) {
      return;
   }
   var bookSpec = this.openBooks[this.currentBook];
   bookSpec.browser.markupDocumentViewer.fullZoom = 1;
   this.console.debug("Zoom reset: "+bookSpec.browser.markupDocumentViewer.fullZoom);
   bookSpec.browser.contentWindow.scrollBy(0,1);
   bookSpec.browser.contentWindow.scrollBy(0,-1);
}

Player.prototype.onFinishPlay = function() {
   if (this.openBooks.length==0) {
      return;
   }
   var bookSpec = this.openBooks[this.currentBook];
   this.console.debug("Section finished ("+bookSpec.toc.view.selection.currentIndex+","+bookSpec.playIndex+")");
   bookSpec.playing = false;
   bookSpec.toc.view.selection.select(bookSpec.playIndex+1);
   this.onPlay();
}

Player.prototype.closeBookUI = function(bookSpec,index) {
   this.openBookMenuList.removeItemAt(index);
   this.bookTOCDeck.removeChild(bookSpec.sidebar);
   this.bookDeck.removeChild(bookSpec.browser);
   if (this.currentBook>=0) {
      this.showBookInDeck(this.currentBook,true);
   }
}
