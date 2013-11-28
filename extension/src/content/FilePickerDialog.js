Console = {
   preferencesService: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("daisy.client."),
   _initialized: false,
   _debug: false,
   service: Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService),
   log: function(message) {
      this.service.logStringMessage(message);
   },
   debug: function(message) {
      if (!this._initialized) {
         if (Console.preferencesService) {
            try {
               //Console.log(Console.preferencesService.prefHasUserValue("debug"));
               Console._debug = Console.preferencesService.getBoolPref("debug");
            } catch (ex) {
               // no preference
            }
         }
         this._initialized = true;
      }
      if (this._debug) {
         this.service.logStringMessage(message);
      }
   }
}

function FilePickerDialog() {
}

FilePickerDialog.XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

FilePickerDialog.getInstance = function() {
   if (!FilePickerDialog.instance) {
      FilePickerDialog.instance = new FilePickerDialog();
   }
   return FilePickerDialog.instance;
}

FilePickerDialog.prototype.init = function(data) {
   this.data = data;
   document.getElementById("title").value = data.title;
   this.dirMenu = document.getElementById("dirs");
   this.filesTree = document.getElementById("files");
   this.matches = [];
   if (this.data.filters) {
      for (var i=0; i<this.data.filters.types.length; i++) {
         var patterns = this.data.filters.types[i].split(";");
         for (var j=0; j<patterns.length; j++) {
            if (patterns[j].substring(0,2)=="*.") {
               this.matches.push(new RegExp(patterns[j].substring(1)+"$"));
            } else {
               this.matches.push(new RegExp(patterns[j]));
            }
         }
      }
   }
   this.onDirectoryChange();
   var current = this;
   
   // The listbox component doesn't seem to handle the keypress event
   // by default, so we'll have to attach a specific handler.
   this.dirMenu.addEventListener("keypress", function(event) {
      // Only worry about handling the 'return' key
      if (event.keyCode == 13) {
         current.onDirectorySelect();
      }
   }, false);
   this.dirMenu.ondblclick = function(event) {
      current.onDirectorySelect();
   };

   this.filesTree.onkeypress = function(event) {
      // Only worry about handling the 'return' key
      if (event.keyCode == 13) {
         current.onFileSelect();
      }
   };
   this.filesTree.ondblclick = function(event) {
      current.onFileSelect();
   };

   this.filesTree.onselect = function() {
      if (current.inDirectoryChange) {
         return;
      }
      var leafName = current.getCurrentFileSelection();
      current.voiceText(leafName);
   }
   this.filesTree.onfocus = function() {
      var leafName = current.getCurrentFileSelection();
      current.voiceText("File List, " + leafName + " selected.");
   }

   this.uivoice = new UIVoice();
   this.uivoice.init();
   this.uivoice.attach(document);
   this.uivoice.introduce("Browse dialog, " + data.title);
   
   this.filesTree.focus();
}

/**
 * Utility method to get the text of the currently selected element in
 * the file selection list, assumed to be a one-column tree.
 */
FilePickerDialog.prototype.getCurrentFileSelection = function() {
	var tree = this.filesTree;
	var index = tree.view.selection.currentIndex;
	var column = tree.columns.getNamedColumn("name");
	return tree.view.getCellText(index, column);
}

/**
 * Select a single file to be returned from the dialog.
 */
FilePickerDialog.prototype.onFileSelect = function() {
   var leafName = this.getCurrentFileSelection();
   Console.debug("onFileSelect leafName = " + leafName);
   var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
   file.initWithPath(this.data.directory.path);
   file.append(leafName);
   if (file.isDirectory()) {
      this.inDirectoryChange = true;
      this.data.directory = file;
      this.onDirectoryChange();
      this.inDirectoryChange = false;

      var leafName = this.getCurrentFileSelection();
      this.voiceText("Changed directory to " + this.dirMenu.selectedItem.label + ", " + leafName + " selected.");
   } else {
      this.onOpen();
   }   
}

/**
 * Select a directory whose contents should display in the file tree.
 */
FilePickerDialog.prototype.onDirectorySelect = function() {
   Console.debug("Selecting directory, inDirectoryChange = " + this.inDirectoryChange);
   if (this.inDirectoryChange) {
      return;
   }
   this.inDirectoryChange = true;
   var path = this.dirMenu.selectedItem.value;
   this.data.directory = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
   this.data.directory.initWithPath(path);
   this.onDirectoryChange();
   this.inDirectoryChange = false;
   this.voiceText("Changed directory to " + this.dirMenu.selectedItem.label);
}

/**
 * Update the contents of the file list widget based on the current directory selection.
 */
FilePickerDialog.prototype.onDirectoryChange = function() {
   Console.debug("Changing directories");
   var current = this;
   while (this.dirMenu.itemCount>0) {
      this.dirMenu.removeItemAt(0);
   }
   var currentDir = this.data.directory;
   while (currentDir) {
      var item = this.dirMenu.appendItem(currentDir.leafName,currentDir.path);
      currentDir = currentDir.parent;
   }
   this.dirMenu.selectedIndex = 0;
   var treechildren = this.filesTree.firstChild.nextSibling;
   var child = treechildren.firstChild;
   while (child) {
      var next = child.nextSibling;
      treechildren.removeChild(child);
      child = next;
   }
   var dirEntries = this.data.directory.directoryEntries;
   var count = 0;
   while (dirEntries.hasMoreElements()) {
      count++;
      var file = dirEntries.getNext().QueryInterface(Components.interfaces.nsIFile);
      if (file.leafName.charAt(0)==".") {
         //Console.debug("Skipping "+file.path);
         continue;
      }
      if (!file.exists()) {
         //Console.debug("Skipping "+file.path);
         continue;
      }
      if (this.matches.length>0 && !file.isDirectory()) {
         var match = false;
         for (var i=0; !match && i<this.matches.length; i++) {
            match = this.matches[i].test(file.leafName);
         }
         if (!match) {
            continue;
         }
      }
      var item = document.createElementNS(FilePickerDialog.XUL_NS,"treeitem");
      var row = document.createElementNS(FilePickerDialog.XUL_NS,"treerow");
      item.appendChild(row);
      var nameCell = document.createElementNS(FilePickerDialog.XUL_NS,"treecell");
      nameCell.setAttribute("label",file.leafName);
      nameCell.setAttribute("properties",file.isDirectory() ? "directory" : "file");
      row.appendChild(nameCell);
      var modDate = new Date(file.lastModifiedTime);
      var modCell = document.createElementNS(FilePickerDialog.XUL_NS,"treecell");
      modCell.setAttribute("label",modDate.toLocaleString());
      row.appendChild(modCell);
      var children = document.createElementNS(FilePickerDialog.XUL_NS,"treechildren");
      item.appendChild(children);
      treechildren.appendChild(item);
   }
   if (count>0) {
      this.filesTree.view.selection.select(0);
   }

}

FilePickerDialog.prototype.onCancel = function() {
   this.data.result = false;
   setTimeout(function() {
      window.close();
   },10);
}

FilePickerDialog.prototype.onOpen = function() {
   this.data.result = true;
   
   // Convert the tree selection into an actual file object to return
   var leafName = this.getCurrentFileSelection();
   var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
   Console.debug("onOpen leafName = " + leafName);
   file.initWithPath(this.data.directory.path);
   file.append(leafName);
   this.data.file = file;

   setTimeout(function() {
      window.close();
   },10);
}

FilePickerDialog.prototype.voiceText = function(text) {
	if (this.uivoice) {
		this.uivoice.voiceText(text);
	}
};
