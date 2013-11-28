//Loads a JS module(here XPCOMUtils.jsm) into the current script
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm"); 
const nsISupports = Components.interfaces.nsISupports;  
var theInstance= new _newInstance();


function _newInstance() {
  var console = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
   console.logStringMessage("inside _newInstance()");
   return new SMIL();
} 

//class constructor  
function SMIL() {
var console = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
 console.logStringMessage("inside constructor in SMIL");
this.wrappedJSObject = this;
}
//class definition 
SMIL.prototype.QueryInterface=function(aIID)  
  { 
var console8 =Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
console8.logStringMessage("inside QueryInterface in SMIL");  
if (!aIID.equals(nsISupports))  
      throw Components.results.NS_ERROR_NO_INTERFACE;  
    return this;  
  };
SMIL.prototype.classID=Components.ID("{34a3927a-d587-47dc-97ba-59ca4f252c4b}"); 
SMIL.prototype.classDescription="DAISY SMIL Engine Component";
SMIL.prototype.contractID="@benetech.org/daisy-smil-engine;1";  
SMIL.prototype._xpcom_factory=this.myFactory;


 
 
/*********************************************************** 
class factory 
 
This object is a member of the global-scope Components.classes. 
It is keyed off of the contract ID. Eg: 
 
myHelloWorld = Components.classes["@dietrich.ganx4.com/helloworld;1"]. 
                          createInstance(Components.interfaces.nsIHelloWorld); 
 
***********************************************************/  
var  myFactory  = { 
getService: function(outer,iid) {
           
          var console3 = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
console3.logStringMessage("inside getService() in SMIL");  
           if (outer != null) {
              throw Components.results.NS_ERROR_NO_AGGREGATION;
           }
           return theInstance.QueryInterface(iid);
        },
 
  createInstance: function (aOuter, aIID)  
  {  
var console7= Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
 console7.logStringMessage("inside create instance in factory in SMIL");  
    if (aOuter != null)  
      throw Components.results.NS_ERROR_NO_AGGREGATION;  
       return new _newInstance().QueryInterface(aIID);  
  }  
};  
  

//javascript object "HelloWorldModule" definition (xpcom registration) 
 
var SMILModule = {  
registerSelf: function(aCompMgr, aFileSpec, aLocation, aType)  
  {  
var console2 = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
   
    aCompMgr = aCompMgr.  
        QueryInterface(Components.interfaces.nsIComponentRegistrar);  
        aCompMgr.registerFactoryLocation(CLASS_ID, CLASS_NAME,   
        CONTRACT_ID, aFileSpec, aLocation, aType);  
  },  
  
  unregisterSelf: function(aCompMgr, aLocation, aType)  
  {  
var console3 = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
 
    aCompMgr = aCompMgr.  
        QueryInterface(Components.interfaces.nsIComponentRegistrar);  
    aCompMgr.unregisterFactoryLocation(CLASS_ID, aLocation);          
  },  
    
  getClassObject: function(aCompMgr, aCID, aIID)  
  {  
var console4 = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
  
    if (!aIID.equals(Components.interfaces.nsIFactory))  
      throw Components.results.NS_ERROR_NOT_IMPLEMENTED;  
  
    if (aCID.equals(CLASS_ID))  
      return  myFactory ;  
  
    throw Components.results.NS_ERROR_NO_INTERFACE;  
  },  
  
  canUnload: function(aCompMgr) { return true; }   
};  
  
/*********************************************************** 
module initialization 
 
When the application registers the component, this function 
is called. 
***********************************************************/  
if(XPCOMUtils.generateNSGetFactory){
   var console = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
  
  var NSGetFactory = XPCOMUtils.generateNSGetFactory([SMIL]);
}
else
  var NSGetModule = XPCOMUtils.generateNSGetModule([SMIL]);
