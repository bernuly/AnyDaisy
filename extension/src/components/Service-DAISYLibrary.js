function DAISYLibrary(service,dir) {
   this.service = service;
   this.dir = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
   this.dir.initWithPath(dir);
   this.booksByURI = {};
   this.books = [];
}

DAISYLibrary.prototype.findByURI = function(uri) {
   return this.booksByURI[uri];
}

DAISYLibrary.prototype.load = function() {
   var dirEntries = this.dir.directoryEntries;
   var zipTest = /\.zip$/;
   var bks2Test = /\.bks2$/;
   var bookDirs = {};
   var bookZips = {};
   while (dirEntries.hasMoreElements()) {
      var file = dirEntries.getNext().QueryInterface(Components.interfaces.nsIFile);
      if (file.leafName.match(zipTest) || file.leafName.match(bks2Test)) {
         bookZips[file.path] = file;
      } else if (file.isDirectory()) {
         DAISYService.console.debug("Loading book from directory "+file.path);
         bookDirs[file.path] = file;
         var bookDirEntries = file.directoryEntries;
         var opfTest = /\.opf$/;
         var current = this;
         while (bookDirEntries.hasMoreElements()) {
            var bookFile = bookDirEntries.getNext().QueryInterface(Components.interfaces.nsIFile);
            if (bookFile.leafName.match(opfTest)) {
               DAISYService.console.debug("Found OPF document "+bookFile.path);
               var url = DAISYService.fileURL(bookFile);
               HTTP("GET",url.spec,{
                  synchronizedRequest: true,
                  overrideMimeType: "text/xml",
                  onSuccess: function(status,doc) {
                     var book = new DAISYBook(current);
                     book.init();
                     book.loadPackaging(doc,url.spec);
                     current.books.push(book);
                     current.booksByURI[book.uris["opf"]] = book;
                     DAISYService.console.debug("Book "+file.path+" loaded.");
                  },
                  onFailure: function(status,doc) {
                     DAISYService.console.log("Cannot load opf document "+url.spec+", status="+status);
                  }
               });
               break;
            }
         }
      }
   }
   for (var z in bookZips) {
      var zipFile = bookZips[z];
      try {
         var bookDir = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
         bookDir.initWithPath(this.dir.path);
         var pos = zipFile.leafName.lastIndexOf(".zip");
         if (pos<0) {
            pos = zipFile.leafName.lastIndexOf(".bks2");
         }
         var dirName = zipFile.leafName.substring(0,pos)
         bookDir.appendRelativePath(dirName);
         if (!bookDirs[bookDir.path]) {
            DAISYService.console.debug("Loading possible book zip "+zipFile.path);
            try {
               var result = this.service.readZipPackaging(zipFile);
               if (result.document) {
                  var book = new DAISYBook();
                  book.init();
                  book.loadPackaging(result.document,result.baseURI);
                  book.zipFile = zipFile;
                  this.books.push(book);
                  this.booksByURI[book.uris["opf"]] = book;
                  DAISYService.console.debug("Book "+zipFile.path+" loaded.");
               } else {
                  DAISYService.console.debug("No OPF document in zip "+zipFile.path);
               }
            } catch (ex) {
               DAISYService.console.log("Cannot read opf document from "+zipFile.path+" due to: "+ex);
            }
         } else {
            DAISYService.console.debug("Skipping zip "+zipFile.path+" as book is extracted.");
         }
      } catch (ex) {
         DAISYService.console.log("Cannot load book "+zipFile.leafName+" due to: "+ex);
      }

   }
   
}


DAISYLibrary.prototype.readZipManifest = function(zipFile) {
   var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
   file.initWithPath(zipFile);
   var zipReader = Components.classes["@mozilla.org/libjar/zip-reader;1"].createInstance(Components.interfaces.nsIZipReader);
   zipReader.open(file)

   var manifest = {
      entries: []
   };

   try {

      var entryIterator = zipReader.findEntries(null);

      var extensionTest = /\.([^\.]+)$/;
      while (entryIterator.hasMore()) {
         var entry = {
            path: entryIterator.getNext()
         };
         var ext = entry.path.match(extensionTest);
         if (ext) {
            entry.extension = ext[1];
            entry.metadata = DAISYBook.extensions[entry.extension];
         } else if (entry.path.charAt(entry.path.length-1)=='/') {
            entry.isFolder = true;
         }
         if (!entry.metadata) {
            entry.metadata = entry._unknown;
         }
         DAISYService.console.debug(entry.path+" -> "+entry.extension);
         manifest.entries.push(entry);
         if (entry.extension=="opf") {
            manifest.opfEntry = entry;
         }
      }

   } catch (ex) {
      zipReader.close();
      throw ex;
   }
   zipReader.close();
   return manifest;
}


DAISYLibrary.prototype.addBookFromZip = function(filename) {

   var bookFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
   bookFile.initWithPath(filename);
   if (!bookFile.exists()) {
      throw "File "+bookFile.path+" does not exist.";
   }

   var result = this.service.readZipPackaging(bookFile);
   if (!result.document) {
      throw "No OPF document in zip "+filename+".  It is possible this is not a packaged DAISY book.";
   }

   var libraryFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
   libraryFile.initWithPath(this.dir.path);
   libraryFile.appendRelativePath(bookFile.leafName);

   if (libraryFile.exists()) {
      throw "The book "+bookFile.leafName+" already exists.";
   }

   bookFile.copyTo(this.dir,bookFile.leafName);

   // re-read from library location
   result = this.service.readZipPackaging(libraryFile);
   if (!result.document) {
      throw "No OPF document in zip "+filename+".  It is possible this is not a packaged DAISY book.";
   }

   var book = new DAISYBook();
   book.init();
   book.loadPackaging(result.document,result.baseURI);
   book.zipFile = libraryFile;
   this.books.push(book);
   this.booksByURI[book.uris["opf"]] = book;
   DAISYService.console.debug("Book "+libraryFile.path+" loaded.");
   return book;
}

