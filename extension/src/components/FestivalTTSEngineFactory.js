Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
Console = {
   preferencesService: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("espeak.tts."),
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
};

const CLASSID = Components.ID("{ebe24c2b-866f-4835-ae01-8225e1b3c275}");
const CLASSNAME = "A festival based TTS Engine Factory";
const CONTRACTID = "@benetech.org/tts-engine-factory;1?name=festival";

FestivalTTSEngineFactory.prototype.classDescription = CLASSNAME;
FestivalTTSEngineFactory.prototype.classID = CLASSID;
FestivalTTSEngineFactory.prototype.contractID = CONTRACTID;

function GenericComponentFactory(ctor, params) {
  this._ctor = ctor;
  this._params = params;
}
GenericComponentFactory.prototype = {
  _ctor: null,
  _params: null,

  createInstance: function GCF_createInstance(outer, iid) {
    if (outer != null)
      throw Cr.NS_ERROR_NO_AGGREGATION;
    return (new this._ctor(this._params)).QueryInterface(iid);
  },

  QueryInterface: function GCF_QueryInterface(iid) {
    if (iid.equals(Components.interfaces.nsIFactory) ||
        iid.equals(Components.interfaces.nsISupports))
      return this;
    throw Cr.NS_ERROR_NO_INTERFACE;
  }
};

//var components = [FestivalTTSEngineFactory];
//function NSGetModule(compMgr, fileSpec) {
//    return XPCOMUtils.generateModule(components);
//}

/**
* XPCOMUtils.generateNSGetFactory was introduced in Mozilla 2 (Firefox 4).
* XPCOMUtils.generateNSGetModule is for Mozilla 1.9.2 (Firefox 3.6).
*/
if (XPCOMUtils.generateNSGetFactory)
    var NSGetFactory = XPCOMUtils.generateNSGetFactory([FestivalTTSEngineFactory]);
else
    var NSGetModule = XPCOMUtils.generateNSGetModule([FestivalTTSEngineFactory]);


function FestivalTTSEngineFactory() {

}

FestivalTTSEngineFactory.prototype.QueryInterface = function(iid) {
    if (iid.equals(Components.interfaces.nsISupports) ||
        iid.equals(Components.interfaces.nsITTSEngineFactory) ||
        iid.equals(Components.interfaces.nsIClassInfo)) {
       return this;
    }
    throw Components.results.NS_ERROR_NO_INTERFACE;
};


FestivalTTSEngineFactory.prototype.implementationLanguage = Components.interfaces.nsIProgrammingLanguage.JAVASCRIPT;
FestivalTTSEngineFactory.prototype.flags = Components.interfaces.nsIClassInfo.DOM_OBJECT;
FestivalTTSEngineFactory.prototype.getHelperForLanguage = function() { return null; }
FestivalTTSEngineFactory.prototype.getInterfaces = function(countRef) {
   var interfaces = [Components.interfaces.nsITTSEngineFactory, Components.interfaces.nsIClassInfo, Components.interfaces.nsISupports];
   countRef.value = interfaces.length;
   return interfaces;
}

FestivalTTSEngineFactory.prototype.priority = 5;
FestivalTTSEngineFactory.prototype.name = "festival";

FestivalTTSEngineFactory.prototype.initialize = function() {
   this.binary =  Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
   this.binary.initWithPath("/usr/bin/festival");
   return true;
}

FestivalTTSEngineFactory.prototype.isAvailable = function() {
   // we don't check for the binary because festival might be installed after firefox is installed
   //return this.binary.exists();
   return true;
}

FestivalTTSEngineFactory.prototype.createEngine = function() {
   if (this.binary.exists()) {
      return new FestivalTTSEngine(this.binary);
   } else {
      return null;
   }
}

function FestivalTTSEngine(binary) {
   this.binary = binary;
   this.process = null;
   this.speaking = false;
   this.rate = 170;
   this.minimumRate = 80;
   this.normalRate = 170;
   this.maximumRate = 390;
   this.rateUnit = "wpm";
   var tm = Components.classes["@mozilla.org/thread-manager;1"].getService(Components.interfaces.nsIThreadManager);
   this.currentThread = tm.currentThread;
   this.thread = tm.newThread(0);
}

FestivalTTSEngine.prototype.QueryInterface = function(iid) {
    if (iid.equals(Components.interfaces.nsISupports) ||
        iid.equals(Components.interfaces.nsITTSEngine)) {
       return this;
    }
    throw Components.results.NS_ERROR_NO_INTERFACE;
};

FestivalTTSEngine.prototype.name = FestivalTTSEngineFactory.prototype.name;

FestivalTTSEngine.prototype.isSpeaking = function() {
   return this.speaking;
}

FestivalTTSEngine.prototype.cancel = function() {
   if (this.process) {
      this.process.cancel();
      this.process = null;
   }
}

FestivalTTSEngine.prototype.speak = function(text,callback) {
   if (this.process) {
      this.process.cancel();
      this.process = null;
   }
   var current = this;

   // Create a unique file name
   var file = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("TmpD", Components.interfaces.nsIFile);
   file.append("tts."+(new Date()).getTime()+".txt");
   file.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0666);

   // write the text to a file
   var fileStream = Components.classes['@mozilla.org/network/file-output-stream;1'].createInstance(Components.interfaces.nsIFileOutputStream);
   fileStream.init(file, 2, 0x200, false);
   var converterStream = Components.classes['@mozilla.org/intl/converter-output-stream;1'].createInstance(Components.interfaces.nsIConverterOutputStream);
   converterStream.init(fileStream, "UTF-8", text.length,Components.interfaces.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);
   converterStream.writeString(text);
   converterStream.close();
   fileStream.close();

   // create the runnable
   this.process = {
      running: false,
      cancelled: false,
      run: function() {
         this.process = Components.classes["@mozilla.org/process/util;1"].createInstance(Components.interfaces.nsIProcess);
         this.process.init(current.binary);
         
         var argv = [ "-b", "--tts", file.path ];

         current.speaking = true;
         this.running = true;
         this.process.run(true, argv, argv.length);
         current.speaking = false;
         this.running = false;
         if (callback) {
            var myProcess = this;
            current.currentThread.dispatch({
               run: function() {
                  callback.onFinish(myProcess.cancelled);
               }
            },current.currentThread.DISPATCH_NORMAL);
         }
         file.remove(false);
         current.process = null;
      },
      cancel: function() {
         this.cancelled = true;
         if (this.running) {
            this.process.kill();
         }
      }
   };
   this.thread.dispatch(this.process,this.thread.DISPATCH_NORMAL);
}




