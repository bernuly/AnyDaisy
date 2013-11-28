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

const CLASSID = Components.ID("{ae9f0e64-9cce-43be-97bd-0cd15e31bb11}");
const CLASSNAME = "A espeak-based TTS Engine Factory";
const CONTRACTID = "@benetech.org/tts-engine-factory;1?name=espeak";

ESpeakTTSEngineFactory.prototype.classDescription = CLASSNAME;
ESpeakTTSEngineFactory.prototype.classID = CLASSID;
ESpeakTTSEngineFactory.prototype.contractID = CONTRACTID;

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

/*var components = [ESpeakTTSEngineFactory];
function NSGetModule(compMgr, fileSpec) {
    return XPCOMUtils.generateModule(components);
}*/

/**
* XPCOMUtils.generateNSGetFactory was introduced in Mozilla 2 (Firefox 4).
* XPCOMUtils.generateNSGetModule is for Mozilla 1.9.2 (Firefox 3.6).
*/
if (XPCOMUtils.generateNSGetFactory)
    var NSGetFactory = XPCOMUtils.generateNSGetFactory([ESpeakTTSEngineFactory]);
else
    var NSGetModule = XPCOMUtils.generateNSGetModule([ESpeakTTSEngineFactory]);



function setTimeout(handler,delay) {
    var timer = Components.classes["@mozilla.org/timer;1"].createInstance().QueryInterface(Components.interfaces.nsITimer);
    timer.initWithCallback(handler,delay,0);
    return timer;
}

function ESpeakTTSEngineFactory() {

}

ESpeakTTSEngineFactory.prototype.QueryInterface = function(iid) {
    if (iid.equals(Components.interfaces.nsISupports) ||
        iid.equals(Components.interfaces.nsITTSEngineFactory) ||
        iid.equals(Components.interfaces.nsIClassInfo)) {
       return this;
    }
    throw Components.results.NS_ERROR_NO_INTERFACE;
};


ESpeakTTSEngineFactory.prototype.implementationLanguage = Components.interfaces.nsIProgrammingLanguage.JAVASCRIPT;
ESpeakTTSEngineFactory.prototype.flags = Components.interfaces.nsIClassInfo.DOM_OBJECT;
ESpeakTTSEngineFactory.prototype.getHelperForLanguage = function() { return null; }
ESpeakTTSEngineFactory.prototype.getInterfaces = function(countRef) {
   var interfaces = [Components.interfaces.nsITTSEngineFactory, Components.interfaces.nsIClassInfo, Components.interfaces.nsISupports];
   countRef.value = interfaces.length;
   return interfaces;
}

ESpeakTTSEngineFactory.prototype.priority = 10;
ESpeakTTSEngineFactory.prototype.name = "espeak";

ESpeakTTSEngineFactory.prototype.initialize = function() {
   this.espeakBinary =  Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
   this.espeakBinary.initWithPath("/usr/bin/espeak");
   this.speakBinary =  Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
   this.speakBinary.initWithPath("/usr/bin/speak");
   return true;
}

ESpeakTTSEngineFactory.prototype.isAvailable = function() {
   // we don't check for the binary because espeak might be installed after firefox is installed
   //return this.espeakBinary.exists() || this.speakBinary.exists();
   return true;
}

ESpeakTTSEngineFactory.prototype.createEngine = function() {
   if (this.espeakBinary.exists()) {
      return new ESpeakTTSEngine(this.espeakBinary);
   } else if (this.speakBinary.exists()) {
      return new ESpeakTTSEngine(this.speakBinary);
   } else {
      return null;
   }
}

function ESpeakTTSEngine(binary) {
   this.binary = binary;
   this.speaking = false;
   this.cancelled=false;
   this.running=false;
   this.rate = 170;
   this.minimumRate = 80;
   this.normalRate = 170;
   this.maximumRate = 390;
   this.rateUnit = "wpm";
   this.espeakProcess = null;
   }

ESpeakTTSEngine.prototype.QueryInterface = function(iid) {
    if (iid.equals(Components.interfaces.nsISupports) ||
        iid.equals(Components.interfaces.nsITTSEngine)) {
       return this;
    }
    throw Components.results.NS_ERROR_NO_INTERFACE;
};

ESpeakTTSEngine.prototype.name = ESpeakTTSEngineFactory.prototype.name;

ESpeakTTSEngine.prototype.isSpeaking = function() {
   return this.speaking;
}

ESpeakTTSEngine.prototype.cancel = function() {
var console = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
   console.logStringMessage("inside cancel");  
this.cancelled=true;

   if (this.espeakProcess && this.running) {
try {
            	// nsIProcess.kill() does not work, so we'll be blunt and use /usr/bin/killall to do it
            	var killer = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
            	killer.initWithPath("/usr/bin/killall");

                var killProc = Components.classes['@mozilla.org/process/util;1'].createInstance(Components.interfaces.nsIProcess);
                killProc.init(killer);
                var arguments = ["espeak"];
                killProc.runwAsync(arguments, arguments.length);            	
            } catch (ex) {
                          console.logStringMessage("espeak cancel error"+ex);  
                          }//catch
  }//if

}//cancel

ESpeakTTSEngine.prototype.speak = function(text,callback) {
current=this;
var console = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
 this.speaking=true;
// nsIObserver
var myObserver = {
  observe: function (aSubject, aTopic, aData) {
  if (aTopic == "process-finished") { 
    
    }
  },

  QueryInterface: function(aIID) {
    if(!aIID.equals(CI.nsISupports) && !aIID.equals(CI.nsIObserver))
      throw CR.NS_ERROR_NO_INTERFACE;
    return this;
  }
};
  
   if (this.espeakProcess) {
      this.cancel();
      this.espeakProcess = null;
   }
this.running=true;
this.espeakProcess=Components.classes["@mozilla.org/process/util;1"].createInstance(Components.interfaces.nsIProcess);
this.espeakProcess.init(this.binary);
var argv = this.rate != this.normalRate ? ["-s", this.rate+"", "-v", "en-us", text] : [ "-v", "en-us", text ];
current.speaking=true;
// Process will run asynchronously with blocking =false in order to be able to interrupt it
this.espeakProcess.runwAsync(argv, argv.length,myObserver);
// Set up vars to be visible inside of our function that checks if the process is still running
var espeakProc = this.espeakProcess;
 var checkRunning = function() {
        	 if (espeakProc.isRunning) {
        		 setTimeout(checkRunning, 200);
        	 } else {
                 current.speaking = false;
                 current.running=false;
                 if (callback) {
                   callback.onFinish(current.cancelled);
                               } 
                 current.espeakProcess = null;
        	 }
         };
         checkRunning();
         
}
