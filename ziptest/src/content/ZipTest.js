

function App() {
}

App.getInstance = function() {
   if (!App.instance) {
      App.instance = new App();
   }
   return App.instance;
}

App.prototype.init = function() {
   //this.content = document.getElementById("content");
   this.filename = document.getElementById("filename");
   this.directory = document.getElementById("directory");
   this.password = document.getElementById("password");
}

App.prototype.browseForFile = function() {

   var nsIFilePicker = Components.interfaces.nsIFilePicker;
   var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
   fp.init(window, "Choose File to UnZip", nsIFilePicker.modeOpen);
   if(fp.show() == nsIFilePicker.returnOK) {
      this.filename.value = fp.file.path;
   }
}

App.prototype.browseForDirectory = function() {

   var nsIFilePicker = Components.interfaces.nsIFilePicker;
   var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
   fp.init(window, "Choose Target Directory", nsIFilePicker.modeGetFolder);
   if(fp.show() == nsIFilePicker.returnOK) {
      this.directory.value = fp.file.path;
   }
}

App.prototype.disable = function(flag) {
   this.filename.disabled = flag;
   this.directory.disabled = flag;
   this.password.disabled = flag;
   document.getElementById("browse-file").disabled = flag;
   document.getElementById("browse-directory").disabled = flag;
   document.getElementById("decode").disabled = flag;
}


App.prototype.decode = function() {

   if (!this.filename.value || this.filename.value.length==0) {
      return;
   }

   if (!this.directory.value || this.directory.value.length==0) {
      return;
   }

   /*
   while (this.content.firstChild) {
      this.content.removeChild(this.content.firstChild);
   }
   */

   var exec = new ZipExec();
   var current = this;
   exec.onComplete = function(status) {
      current.disable(false);
      if (status==82) {
         alert("Incorrect password for zip file.");
      } else if (status!=0) {
         alert("Cannot extract zip file, status="+status);
      }
   }
   try {
      this.disable(true);
      var status = exec.extract(this.filename.value,this.directory.value,this.password.value);

   } catch (ex) {
      this.disable(false);
      throw ex;
   }

/*
   // Javascript Zip implementation variant
   var zipReader = new ZipReader();
   zipReader.password = "12345";
   zipReader.openFile(this.filename.value);

   var current = this;
   zipReader.onEntry = function(entry) {
      var p = current.content.ownerDocument.createElementNS("http://www.w3.org/1999/xhtml","p");
      current.content.appendChild(p);
      var text = current.content.ownerDocument.createTextNode("Zip Info: \nfile: ("+entry.fileNameLength+") "+entry.fileName+"\nversion needed: "+entry.versionNeeded.major+"."+entry.versionNeeded.minor+"\nflags: "+entry.flags+"\nmethod: "+entry.method+"\nencrypted: "+entry.encrypted+"\ncrc32:"+entry.crc32+"\nsize:"+entry.compressedSize+"\nuncompressed size: "+entry.uncompressedSize+"\ndata specific: "+entry.dataSpecificCRC);
      p.appendChild(text);
   }

   zipReader.extract();

   */




/*

   // ZipReader variant
   var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
   file.initWithPath(this.filename.value);
   var zipReader = Components.classes["@mozilla.org/libjar/zip-reader;1"].createInstance(Components.interfaces.nsIZipReader);
   zipReader.open(file)

   var entries = zipReader.findEntries(null);

   while (entries.hasMore()) {
      var entry = entries.getNext();
      var p = this.content.ownerDocument.createElementNS("http://www.w3.org/1999/xhtml","p");
      this.content.appendChild(p);
      var text = null;
      try {

         var entryFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
         entryFile.initWithPath(this.directory.value);
         var segments = entry.split("/");
         for (var i=0; i<segments.length; i++) {
            entryFile.append(segments[i]);
         }

         var is = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
         is.setInputStream(zipReader.getInputStream(entry));
         while (is.available()>0) {
            is.read8();
         }
         is.close();
         zipReader.extract(entry,entryFile);
         text = this.content.ownerDocument.createTextNode(entryFile.path);
         p.appendChild(text);
         text.nodeValue = text.nodeValue+" - OK";
      } catch (ex) {
         if (text==null) {
            text = this.content.ownerDocument.createTextNode(entry);
            p.appendChild(text);
         }
         text.nodeValue = text.nodeValue+" - ERROR: "+ex;
      }
   }
   zipReader.close();
   */
   
}

