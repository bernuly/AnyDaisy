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

function ManageNotes() {
   var theClass = Components.classes["@benetech.org/daisy;1"];
   var theComponent = theClass.getService(Components.interfaces.nsISupports);
   this.service = theComponent.wrappedJSObject;
}

ManageNotes.getInstance = function() {
   if (!ManageNotes.instance) {
      ManageNotes.instance = new ManageNotes();
   }
   return ManageNotes.instance;
}

ManageNotes.prototype.init = function(data) {
   this.context = data.wrappedJSObject;
   this.list = document.getElementById("note-list");
   this.name = document.getElementById("name");
   this.note = document.getElementById("note");
   this.currentNote = data.note;
   this.setNote();
   while (this.list.firstChild) {
      this.list.removeChild(this.list.firstChild);      
   }
   for (var i=0; i< this.context.notes.length; i++) {
      this.list.appendItem(this.context.notes[i].name,this.context.notes[i].id+"");
   }
   var current = this;
   this.list.onselect = function() {
      if (!this.selectedItem) {
         return;
      }
      var id = parseInt(this.selectedItem.value);
      for (var i=0; i<current.context.notes.length; i++) {
         if (current.context.notes[i].id==id) {
            current.currentNote = current.context.notes[i];
            current.setNote();
            break;
         }
      }
   }
   
   var introText = document.title + " Dialog. ";
   introText += "Choose note. ";
   introText += "Tab to edit the note, up or down to choose a different note. ";
   introText += "Esc to exit dialog. ";
   
   this.uivoice = new UIVoice();
   this.uivoice.init();
   this.uivoice.attach(document);
   this.uivoice.introduce(introText);
   
   this.list.selectedIndex = 0;
   this.list.focus();
}

ManageNotes.prototype.setNote = function() {
   if (this.currentNote) {
      this.name.value = this.currentNote.name;
      this.note.value = this.currentNote.note;
      this.name.disabled = false;
      this.note.disabled = false;
   } else {
      this.name.value = "";
      this.note.value = "";
      this.name.disabled = true;
      this.note.disabled = true;
   }
}

ManageNotes.prototype.onKeyPress = function(event) {
   if (event.keyCode==13) {
      this.onOK();
   }
}

ManageNotes.prototype.onCancel = function() {
   setTimeout(function() {
      window.close();
   },10);
}

ManageNotes.prototype.onSave = function() {
   if (this.currentNote) {
      this.currentNote.name = this.name.value;
      this.currentNote.note = this.note.value;
      this.context.updateNote(this.currentNote);
      var sid = this.currentNote.id+"";
      var item = this.list.firstChild;
      while (item) {
         if (item.value==sid) {
            item.label = this.currentNote.name;
            break;
         }
         item = item.nextSibling;
      }
   }
}

ManageNotes.prototype.onRemove = function() {
   if (this.currentNote) {
      try {
      this.context.removeNote(this.currentNote);
      var sid = this.currentNote.id+"";
      var item = this.list.firstChild;
      var next = null;
      while (item) {
         if (item.value==sid) {
            next = item.nextSibling;
            if (!next) {
               next = item.previousSibling;
            }
            this.list.removeChild(item);
            if (next) {
               this.list.selectedItem = next;
            }
            break;
         }
         item = item.nextSibling;
      }
      if (!next) {
         this.currentNote = null;
         this.setNote();
      }
      } catch (ex) {
         alert(ex);
      }
   }
}
