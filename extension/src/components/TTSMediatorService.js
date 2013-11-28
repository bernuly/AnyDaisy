Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
Console = {
   preferencesService: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("tts.mediator."),
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

const CLASSID = Components.ID("{f45d85fc-014d-4147-a6c8-a81c9b054ad6}");
const CLASSNAME = "The TTS mediator for DAISY";
const CONTRACTID = "@benetech.org/tts-mediator-service;1";

TTSMediatorService.prototype.classDescription = CLASSNAME;
TTSMediatorService.prototype.classID = CLASSID;
TTSMediatorService.prototype.contractID = CONTRACTID;

var theInstance = null;

function GenericComponentFactory(ctor, params) {
  this._ctor = ctor;
  this._params = params;
}
GenericComponentFactory.prototype = {
  _ctor: null,
  _params: null,

  getService: function(outer,iid) {
     if (outer != null) {
        throw Components.results.NS_ERROR_NO_AGGREGATION;
     }
     if (!theInstance) {
        theInstance = new TTSMediatorService();
     }
     return theInstance.QueryInterface(iid);
  },
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


/*var components = [TTSMediatorService];
function NSGetModule(compMgr, fileSpec) {
    return XPCOMUtils.generateModule(components);  
}*/

/**
* XPCOMUtils.generateNSGetFactory was introduced in Mozilla 2 (Firefox 4).
* XPCOMUtils.generateNSGetModule is for Mozilla 1.9.2 (Firefox 3.6).
*/
if (XPCOMUtils.generateNSGetFactory)
    var NSGetFactory = XPCOMUtils.generateNSGetFactory([TTSMediatorService]);
else
    var NSGetModule = XPCOMUtils.generateNSGetModule([TTSMediatorService]);


function bootstrap() {
   var preferencesService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("tts.mediator.");
   if (preferencesService) {
      try {
         var engines = preferencesService.getCharPref("engines");
         var names = engines.split(",");
         var classes = [];
         for (var i=0; i<names.length; i++) {
            var name = names[i];
            var eq = name.indexOf("=");
            var priority = -1;
            if (eq>0) {
               priority = parseInt(name.substring(eq+1));
               name = name.substring(0,eq);
            }
            if (name.indexOf('@')<0) {
               name = "@benetech.org/tts-engine-factory;1?name="+name;
            }
            classes.push({
               name: name,
               priority: priority
            })
         }
         return classes;
      } catch (ex) {

      }
   }
   var OS = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime).OS;
   if (OS=="WINNT") {
      return [{ name: "@benetech.org/tts-engine-factory;1?name=sapi", priority: -1}];
   } else if (OS=="Darwin") {
      return [{ name: "@benetech.org/tts-engine-factory;1?name=mactts", priority: -1},{ name: "@benetech.org/tts-engine-factory;1?name=espeak", priority: -1}];
   } else if (OS=="Linux" || OS=="SunOS") {
      return [{ name: "@benetech.org/tts-engine-factory;1?name=espeak", priority: -1},{ name: "@benetech.org/tts-engine-factory;1?name=festival", priority: -1}];
   } else {
      return [{ name: "@benetech.org/tts-engine-factory;1?name=freetts", priority: -1}];
   }
}

function sortByPriority(a,b) {
   return b.priority-a.priority;
}



function TTSMediatorService() {
   this.factories = [];
   var classList = bootstrap();
   Console.log("Found " + classList.length + " tts factories");
   for (var i=0; i<classList.length; i++) {
      Console.log("TTS Factory: "+classList[i].name);
      var theClass = Components.classes[classList[i].name]
      if (theClass) {
         var ttsFactory = theClass.createInstance(Components.interfaces.nsITTSEngineFactory);
         if (ttsFactory.initialize()) {
            if (classList[i].priority>=0) {
               ttsFactory.priority = classList[i].priority;
            }
            Console.debug("TTS Factory: "+classList[i].name+" -> "+ttsFactory.priority);
            this.factories.push(ttsFactory);
         } else {
            Console.log("Cannot initialize TTS factory: "+classList[i]);
         }
      } else {
         Console.log("Cannot get TTS factory class: "+classList[i].name);
      }
   }
   this.factories.sort(sortByPriority);
}

TTSMediatorService.prototype.QueryInterface = function(iid) {
    if (iid.equals(Components.interfaces.nsISupports) ||
        iid.equals(Components.interfaces.nsITTSMediatorService) ||
        iid.equals(Components.interfaces.nsIClassInfo)) {
       return this;
    }
    throw Components.results.NS_ERROR_NO_INTERFACE;
};


TTSMediatorService.prototype.implementationLanguage = Components.interfaces.nsIProgrammingLanguage.JAVASCRIPT;
TTSMediatorService.prototype.flags = Components.interfaces.nsIClassInfo.DOM_OBJECT;
TTSMediatorService.prototype.getHelperForLanguage = function() { return null; }
TTSMediatorService.prototype.getInterfaces = function(countRef) {
   var interfaces = [Components.interfaces.nsITTSMediatorService, Components.interfaces.nsIClassInfo, Components.interfaces.nsISupports];
   countRef.value = interfaces.length;
   return interfaces;
}

TTSMediatorService.prototype.getFactories = function() {
   return new FactoryIterator(this.factories);
}

TTSMediatorService.prototype.register = function(factory) {
   var inserted = false;
   for (var i=0; i<this.factories.length; i++) {
      if (this.factories[i].name==factory.name) {
         this.factories[i] = factory;
         inserted = true;
         break;
      }
   }
   if (!inserted) {
      this.factories.push(factory);
   }
   this.factories.sort(sortByPriority);
}

TTSMediatorService.prototype.getEngine = function(name) {
   for (var i=0; i<this.factories.length; i++) {
      if (this.factories[i].name==name) {
         if (this.factories[i].isAvailable()) {
            return this.factories[i].createEngine();
         } else {
            break;
         }
      }
   }
   return null;
}

TTSMediatorService.prototype.findEngine = function(name) {
   if (name) {
      for (var i=0; i<this.factories.length; i++) {
         if (this.factories[i].name==name) {
            if (this.factories[i].isAvailable()) {
               Console.debug("Requested "+name+" and engine is available.");
               var engine =  this.factories[i].createEngine();
               if (engine) {
                  return engine;
               } else {
                  break;
               }
            } else {
               break;
            }
         }
      }
   }
   for (var i=0; i<this.factories.length; i++) {
      if (this.factories[i].isAvailable()) {
         Console.log(this.factories[i].name+" is still available.");
         var engine = this.factories[i].createEngine();
         if (engine) {
            return engine;
         }
      } else {
         Console.log(this.factories[i].name+" is not available.");
      }
   }
   return null;
}

function FactoryIterator(factories) {
   this.factories = factories;
   this.index = 0;
}

FactoryIterator.prototype.QueryInterface = function(iid) {
    if (iid.equals(Components.interfaces.nsISupports) ||
        iid.equals(Components.interfaces.nsISimpleEnumerator)) {
       return this;
    }
    throw Components.results.NS_ERROR_NO_INTERFACE;
}

FactoryIterator.prototype.hasMoreElements = function() {
   return this.index<this.factories.length;
}

FactoryIterator.prototype.getNext = function() {
   return this.index<this.factories.length ? this.factories[this.index++] : null;
}
