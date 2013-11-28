Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
try {
    Components.utils.import("resource://gre/modules/Services.jsm");
    Components.utils.import("resource://gre/modules/AddonManager.jsm"); 
  } catch (ex) {
     // We'll get an exception if Services doesn't exist,
     // which we really don't care about.
  }

var consoleService = {
   console : Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService),
   debug: function(msg) {
      if (this.debugEnabled) {
         this.console.logStringMessage(msg);
      }
   },
   log: function(msg) {
      this.console.logStringMessage(msg);
   }
}


var theInstance = null;

function _newInstance() {
   consoleService.log("Creating singleton for DAISYService");
   DAISYService.preferences = new DAISYPreferences();
   consoleService.log("DAISYPreferences singleton created");
   return new DAISYService();
}

const myFactory =  {
        getService: function clh_gs(outer,iid) {
           consoleService.debug("CI: " + iid + "\n");
           if (outer != null) {
              throw Components.results.NS_ERROR_NO_AGGREGATION;
           }
           if (!theInstance) {
              theInstance = _newInstance();
           }
           return theInstance.QueryInterface(iid);
        },
        lockFactory : function clh_lock(lock)
          {
            /* no-op */
          },
        createInstance : function clh_CI(outer, iid) {
            dump("CI: " + iid + "\n");
            if (outer != null) {
               throw Components.results.NS_ERROR_NO_AGGREGATION;
            }
            return _newInstance().QueryInterface(iid);
        }
    };


/*var components = [DAISYService];
function NSGetModule(compMgr, fileSpec) {
    return XPCOMUtils.generateModule(components);
} */




