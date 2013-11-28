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

function Notify() {
   
}

Notify.getInstance = function() {
   if (!Notify.instance) {
      Notify.instance = new Notify();
   }
   return Notify.instance;
}

Notify.prototype.init = function(data) {
   this.data = data;
   document.title = this.data.title;
   document.getElementById("message").value = data.message;
   this.uivoice = new UIVoice();
   this.uivoice.init();
   var okButton = document.getElementById("ok")
   var current = this;

   this.uivoice.service.tts.cancel();
   var myDoc = document;
   setTimeout(function() {
      var attachCallback = current.uivoice.makeCallback(
         function() {
            Console.debug("attached callback fired");
            current.uivoice.attach(myDoc);
            okButton.focus();
         }
      );

      current.uivoice.speak(
         current.data.title,
         current.uivoice.makeCallback(
            function() {
               Console.debug("title callback fired");
               current.uivoice.speak(
                  current.data.message,
                  attachCallback
               );
            }
         )
      );
   },500);
   if (!this.uivoice.service.readUI) {
      okButton.focus();
   }
}

Notify.prototype.onOK = function() {
   setTimeout(function() {
      window.close();
   },10);
}
