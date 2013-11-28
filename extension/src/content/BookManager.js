BookManager.prototype = new Settings();
BookManager.prototype.constructor = BookManager;

BookManager.positionOffset = 50;

function BookManager() {

   this.generateSMIL = false;
   this.focusFollow = true;
   this.highlight = true;
   this.sound = true;
   this.useTTS = false;

   this.openBooks = [];

   this.currentBook = -1;

}

BookManager.prototype.addBook = function(filename) {
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

BookManager.prototype.onHelp = function() {
   window.openDialog("chrome://daisy/content/help/help.xul",'daisy-help',"chrome,resizable",{});
}

BookManager.prototype.onSettings = function() {
   var current = this;
   var data = {
      debug: current.service.debug,
      focusFollow: current.focusFollow,
      highlight: current.highlight,
      selectText: current.service.smil.selectHighlight,
      sound: current.sound,
      generateSMIL: current.generateSMIL,
      highlightTime: current.service.smil.textOnlyPause/1000,
      quirks: current.service.allowQuirks,
      onUpdate: function() {
         current.service.debug = this.debug;
         current.focusFollow = this.focusFollow;
         current.highlight = this.highlight;
         current.service.smil.selectHighlight = this.selectText;
         current.sound = this.sound;
         current.generateSMIL = this.generateSMIL;
         current.service.smil.textOnlyPause = this.highlightTime*1000;
         current.service.allowQuirks = this.quirks;
      }
   };

   this.settingsWindow = window.openDialog("chrome://daisy/content/settings.xul",'daisy-settings',"chrome,resizable",data);
}

BookManager.prototype.calculatePage = function(bookSpec) {
   if (!bookSpec) {
      if (this.openBooks.length==0) {
         return;
      }
      bookSpec = this.openBooks[this.currentBook];
   }

   if (!bookSpec.contentWindow.pagelist || bookSpec.contentWindow.pagelist.length==0) {
      this.onUpdatePage();
      return;
   }
   try {
      var last = null;
      var i=0;
      for (; i<bookSpec.contentWindow.pagelist.length; i++) {
         if (!bookSpec.contentWindow.pagelist[i].element) {
            continue;
         }
         if (bookSpec.contentWindow.pagelist[i].element.offsetTop<(bookSpec.contentWindow.scrollY+BookManager.positionOffset)) {
            last = bookSpec.contentWindow.pagelist[i];
         } else {
            break;
         }
      }
      if (!last) {
         last = bookSpec.contentWindow.pagelist[0];
      }
      //this.console.log("last.element="+last.element.localName+" "+last.element.getAttribute("id"));
      this.onUpdatePage(last ? last.element.getAttribute("id") : null,last ? last.number : 0,bookSpec.contentWindow.pagelist[bookSpec.contentWindow.pagelist.length-1].number);
   } catch (ex) {
      this.console.log(ex);
   }
}

BookManager.prototype.updateContext = function(scrollY,bookSpec) {
   if (this.tocSelect) {
      return;
   }
   if (!bookSpec) {
      if (this.openBooks.length==0) {
         return;
      }
      bookSpec = this.openBooks[this.currentBook];
   }
   var pos = 0;
   var testPos = scrollY+BookManager.positionOffset;
   for (; pos<bookSpec.tocData.length; pos++) {
      if (bookSpec.tocData[pos].scrollY>testPos) {
         break;
      }
   }
   pos--;
   this.console.debug("TOC position: "+pos+" scrollY="+testPos);
   if (pos<0) {
      pos = 0;
   }
   var index = pos>=bookSpec.toc.view.rowCount ? bookSpec.toc.view.rowCount-1 : pos;
   var rowPos = parseInt(bookSpec.toc.view.getCellValue(index,bookSpec.toc.columns.getFirstColumn()));
   while (rowPos>pos && index>0) {
      //this.console.log(pos+" vs "+rowPos);
      index--;
      rowPos = parseInt(bookSpec.toc.view.getCellValue(index,bookSpec.toc.columns.getFirstColumn()));
   }
   /*
   if (pos!=rowPos) {
      this.console.log(pos+" vs "+rowPos);
   }*/
   this.onTOCContextChange(bookSpec,index);
}

BookManager.prototype.onTOCContextChange = function(bookSpec,index) {
   this.tocSelectFromScroll = true;
   bookSpec.toc.view.selection.select(index);
   bookSpec.toc.treeBoxObject.ensureRowIsVisible(index);
   this.tocSelectFromScroll = false;
}


BookManager.prototype.populateTOC = function(spec) {
   var treechildren = spec.toc.firstChild.nextSibling;
   for (var i=0; i<spec.navigation.navMap.children.length; i++) {
      this.addNavigationPoint(spec.tocData,treechildren,spec.navigation.navMap.children[i],"toc-item");
   }
   /*
   for (var p=0; p<spec.navigation.pages.list.length; p++) {
      this.addNavigationPoint(spec.tocData,treechildren,spec.navigation.pages.list[p],"page","Page ");
   }
   for (var f=0; f<spec.navigation.navList.list.length; f++) {
      this.addNavigationPoint(spec.tocData,treechildren,spec.navigation.navList.list[f],"figure", "Figure ");
   }
   */
}

BookManager.prototype.addNavigationPoint = function(tocData,parent,navPoint,className,prefix) {
   tocData.push({
      point: navPoint
   });
   var item = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul","treeitem");
   if (navPoint.children.length>0) {
      item.setAttribute("container","true");
   }
   item.setAttribute("class",className);
   var row = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul","treerow");
   item.appendChild(row);
   var name = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul","treecell");
   row.appendChild(name);
   name.setAttribute("label",prefix ? prefix+navPoint.labels[0].text : navPoint.labels[0].text);
   name.setAttribute("value",""+(tocData.length-1));

   var children = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul","treechildren");
   item.appendChild(children);
   for (var i=0; i<navPoint.children.length; i++) {
      this.addNavigationPoint(tocData,children,navPoint.children[i],className);
   }

   parent.appendChild(item);
}

BookManager.prototype.updateNavigationPosition = function(spec) {
   if (!spec || !spec.contentDocument) {
      return;
   }
   this.console.debug("Updating navigation positions from document.");
   for (var i=0; i<spec.tocData.length; i++) {
      var point = spec.tocData[i].point;
      var target = spec.contentDocument.getElementById(point.content.id);
      if (target) {
         spec.tocData[i].scrollY = target.offsetTop;
         this.console.debug(point.content.id+" -> "+spec.tocData[i].scrollY);
      } else {
         this.console.log("Cannot find navigation point "+point.content.id);
      }
   }
}

BookManager.prototype.resize = function() {
   for (var i=0; i<this.openBooks.length; i++) {
      this.updateNavigationPosition(this.openBooks[i]);
   }
}


BookManager.prototype.openBook = function(book,onComplete) {
   if (!book) {
      return;
   }

   var pos = 0;
   var opfURI = book.uris["opf"];
   for (; pos<this.openBooks.length; pos++) {
      if (this.openBooks[pos].book.uris["opf"]==opfURI) {
         break;
      }
   }
   if (pos<this.openBooks.length) {
      this.showBookInDeck(pos);
      return;
   }

   if (!this.ensureUnpacked(book)) {
      return;
   }

   // save settings for current book
   this.saveCurrentBook();

   var spec = {
      book: book,
      navigation: book.loadNavigation(),
      sidebar: document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul","vbox"),
      toc: document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul","tree"),
      tocData: [],
      position: 0,
      searchText: "",
      pageText: ""
   }

   // setup the sidebar
   spec.sidebar.setAttribute("flex","1");

   var title = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul","description");
   title.setAttribute("class","title");
   title.appendChild(document.createTextNode(book.title));
   spec.sidebar.appendChild(title);

   var heading = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul","label");
   heading.appendChild(document.createTextNode("Table of Contents"));
   heading.setAttribute("class","heading");
   spec.sidebar.appendChild(heading);

   // make shell of toc tree
   spec.sidebar.appendChild(spec.toc);
   spec.toc.setAttribute("flex","1");
   spec.toc.setAttribute("accesskey","t");
   spec.toc.setAttribute("hidecolumnpicker","true");
   var treecols = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul","treecols");
   spec.toc.appendChild(treecols);
   var namecol = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul","treecol");
   namecol.setAttribute("label","Item");
   namecol.setAttribute("flex","4");
   namecol.setAttribute("primary","true");
   treecols.appendChild(namecol);
   var treechildren = document.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul","treechildren");
   spec.toc.appendChild(treechildren);

   spec.position = this.openBooks.length;

   this.constructBook(spec);

   var current = this;
   spec.toc.onselect = function() {
      if (!current.tocSelectFromScroll) {
         current.tocSelect = true;
         var pos = parseInt(spec.toc.view.getCellValue(spec.toc.view.selection.currentIndex,spec.toc.columns.getFirstColumn()));
         current.onStop();
         current.moveTo(spec,spec.tocData[pos].point);
         current.ensureBookVisible();
         setTimeout(function() {
            current.tocSelect = false;
         },500);
      }
   }

   this.openBooks.push(spec);

   this.currentBook = spec.position;
   this.populateTOC(spec);
   spec.toc.view.selection.select(0);

   this.openRenderedView(spec,onComplete);

   this.onAfterNewBookUpdate(spec);
}

BookManager.prototype.ensureBookVisible = function() {

}

BookManager.prototype.closeBook = function(index) {
   this.console.debug("Close: "+this.currentBook+", "+index);
   if (this.currentBook==index) {
      if (this.currentBook>0) {
         this.currentBook--;
      } else if (this.openBooks.length==1) {
         this.currentBook = -1;
      }
   } else if (this.currentBook>index) {
      this.currentBook--;
   }
   //this.console.log("Move to: "+this.currentBook);
   var bookSpec = this.openBooks.splice(index,1)[0];
   for (var i=0; i<this.openBooks.length; i++) {
      this.openBooks[i].position = i;
   }
   this.closeBookUI(bookSpec,index);
}


BookManager.prototype.moveTo = function(bookSpec,navPoint) {
   if (bookSpec.context) {
      bookSpec.context.stop();
      bookSpec.context.moveTo(navPoint.content.id,-BookManager.positionOffset);
   }
}

BookManager.prototype.onGotoPage = function(page,bookSpec) {
   if (!bookSpec) {
      //this.console.log("Goto page: "+page);
      if (this.openBooks.length==0) {
         return;
      }
      bookSpec = this.openBooks[this.currentBook];
   }
   this.onStop();
   bookSpec.context.moveToPage(page,true,true);
   // Note: scrolling causes the document to "flash"
   setTimeout(function() {
      bookSpec.contentWindow.scroll(0,bookSpec.contentWindow.scrollY-BookManager.positionOffset);
   },100);
}

BookManager.prototype.moveToTOC = function() {
   if (this.openBooks.length==0) {
      return;
   }
   var toc = this.openBooks[this.currentBook].toc;
   toc.focus();
   toc.view.selection.select(0);
   toc.treeBoxObject.ensureRowIsVisible(0);
   this.onStop();
}

BookManager.prototype.onStop = function(bookSpec) {
   if (!bookSpec) {
      if (this.openBooks.length==0) {
         return;
      }
      bookSpec = this.openBooks[this.currentBook];
   }
   bookSpec.playing = false;
   if (bookSpec.context) {
      bookSpec.context.stop();
   }
   this.togglePlayButton(true);
}



BookManager.prototype.onPrevious = function(bookSpec) {
   if (!bookSpec) {
      if (this.openBooks.length==0) {
         return;
      }
      bookSpec = this.openBooks[this.currentBook];
   }
   if (bookSpec.toc.view.selection.currentIndex>0) {
      var row = bookSpec.toc.view.selection.currentIndex-1;
      bookSpec.toc.view.selection.select(row);
      bookSpec.toc.treeBoxObject.ensureRowIsVisible(row);
      bookSpec.playing = false;
      this.onPlayCurrent(bookSpec);
   }
}

BookManager.prototype.onNext = function(bookSpec) {
   if (!bookSpec) {
      if (this.openBooks.length==0) {
         return;
      }
      bookSpec = this.openBooks[this.currentBook];
   }
   if (bookSpec.toc.view.selection.currentIndex<(bookSpec.toc.view.rowCount-1)) {
      var row = bookSpec.toc.view.selection.currentIndex+1;
      bookSpec.toc.view.selection.select(row);
      bookSpec.toc.treeBoxObject.ensureRowIsVisible(row);
      bookSpec.playing = false;
      this.onPlayCurrent(bookSpec);
   }
}

BookManager.prototype.onPlayCurrent = function(bookSpec) {
   if (!bookSpec) {
      if (this.openBooks.length==0) {
         return;
      }
      bookSpec = this.openBooks[this.currentBook];
   }
   if (bookSpec.playing) {
      bookSpec.playing = false;
      bookSpec.context.stop();
      this.togglePlayButton(true);
   } else {
      if (bookSpec.context) {
         try {
            bookSpec.context.stop();
            bookSpec.playIndex = bookSpec.toc.view.selection.currentIndex;
            var pos = parseInt(bookSpec.toc.view.getCellValue(bookSpec.toc.view.selection.currentIndex,bookSpec.toc.columns.getFirstColumn()));
            var navPoint = bookSpec.tocData[pos].point;
            this.moveTo(bookSpec,navPoint);
            this.console.debug("Calling play on context "+navPoint.content.id);
            bookSpec.context.play(navPoint);
            bookSpec.playing = true;
            this.togglePlayButton(false);
         } catch (ex) {
            this.console.log(ex);
         }
      } else {
         this.console.log("No context for play.");
      }
   }
}

BookManager.prototype.togglePlayButton = function(flag) {
   if (!this.playButton) {
      return;
   }
   if (flag) {
      this.playButton.image = "images/play-button.png";
      this.playButton.label = "Play";
   } else {
      this.playButton.image = "images/pause-button.png";
      this.playButton.label = "Pause";
   }
}




