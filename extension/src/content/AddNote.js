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

function AddNote() {
   var theClass = Components.classes["@benetech.org/daisy;1"];
   var theComponent = theClass.getService(Components.interfaces.nsISupports);
   this.service = theComponent.wrappedJSObject;
}

AddNote.getInstance = function() {
   if (!AddNote.instance) {
      AddNote.instance = new AddNote();
   }
   return AddNote.instance;
}

AddNote.prototype.init = function(data) {
   this.data = data.wrappedJSObject;
   
   this.nameField = document.getElementById("name");
   this.nameField.value = this.data.name;
   
   this.noteField = document.getElementById("note");
   this.saveButton = document.getElementById("save");
   
   // Keep the save button disabled unless there is text entered
   this.saveButton.disabled = true;
   
   this.uivoice = new UIVoice();
   this.uivoice.init();
   this.uivoice.attach(document);
   this.uivoice.introduce(document.title);
   
   this.nameField.select();
   this.nameField.focus();
}

AddNote.prototype.onKeyPress = function(event) {
   if (event.keyCode==13) {
      this.onOK();
   }
}

AddNote.prototype.onInput = function(event) {
   if (this.noteField.textLength > 0) {
      this.saveButton.disabled = false;
   } else {
      this.saveButton.disabled = true;
   }   
}

AddNote.prototype.onCancel = function() {
   var current = this;
   setTimeout(function() {
      window.close();
      current.data.onClose();
   },10);
   this.data.success = false;
}

AddNote.prototype.onOK = function() {
   this.data.success = true;
   this.data.name = this.nameField.value;
   this.data.note = this.noteField.value;
   var current = this;
   setTimeout(function() {
      window.close();
      current.data.onClose();
   },10);
}

