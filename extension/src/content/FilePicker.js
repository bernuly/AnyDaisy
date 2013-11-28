function FilePicker() {
   this.window = window;
   this.title = "Pick File";
   this.id = "";
   this.mode = Components.interfaces.nsIFilePicker.modeOpen;
   this.directory = FilePicker.lastDirectory;
   if (!this.directory) {
      var dirService = Components.classes['@mozilla.org/file/directory_service;1'].getService(Components.interfaces.nsIProperties);
      this.directory = dirService.get("Home", Components.interfaces.nsILocalFile);
   }
   this.filters = [];
   this.filterTitles = [];
   this.allowURLs = false;
}

FilePicker.lastDirectory = null;

FilePicker.prototype.appendFilter = function(title, extensions) {
   this.filterTitles.push(title);
   this.filters.push(extensions);
}

FilePicker.prototype.show = function() {
    var data = new Object();
    data.title = this.title;
    data.directory = this.directory;
    data.filters = new Object();
    data.filters.titles = this.filterTitles;
    data.filters.types = this.filters;

    try {
      this.window.openDialog("chrome://daisy/content/filepicker.xul",
                        this.id,
                        "chrome,modal,resizable=yes,dependent=yes",
                        data);
      this._file = data.file;
      FilePicker.lastDirectory = data.directory;
      return data.result ? Components.interfaces.nsIFilePicker.returnOK : Components.interfaces.nsIFilePicker.returnCancel;
    } catch(ex) { alert("unable to open file picker\n" + ex + "\n"); }

    return null;
}

FilePicker.prototype.__defineGetter__("file",function() {
   return this._file;
});

