var Prefs = Components.classes["@mozilla.org/preferences-service;1"]
                   .getService(Components.interfaces.nsIPrefService);
Prefs = Prefs.getBranch("daisy.");

var console = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);

var Overlay = {
  init: function(){
    var ver = -1, firstrun = true;
    var startupPage = "http://www.bookshare.org/_/help/faq/anyDaisy";
    var id = "{6be5ef88-4289-44d1-81f2-097313ed640b}";

    
 AddonManager.getAddonByID(id, function(aAddon) {
var current= aAddon.version;
try{
    ver = Prefs.getCharPref("version");
    firstrun = Prefs.getBoolPref("firstrun");
    }catch(e){
      //nothing
    }finally{
      if (ver!=current){
        Prefs.setBoolPref("firstrun",false);
        Prefs.setCharPref("version",current);
    var helpOPF = aAddon.getResourceURI("content/help/help.opf").QueryInterface(Components.interfaces.nsIFileURL).file;
 
       var ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
       var fileUrl = ios.newFileURI(helpOPF);
       fileUrl.spec += "#" + "getting_started";

        var myUrl = startupPage;
        //comment out following line to open web page instead of help daisy book
        //myUrl = fileUrl.spec;
        var openTab = function () {
            gBrowser.selectedTab = gBrowser.addTab(myUrl);
        };

        window.setTimeout(openTab, 1500);

      }

}
 if (ver!=current && !firstrun){ // !firstrun ensures that this section does not get loaded if its a first run.
        Prefs.setCharPref("version",current);
      }
});

         
         
      

     
    
    window.removeEventListener("load",function(){ Overlay.init(); },true);
  }
};

window.addEventListener("load",function(){ Overlay.init(); },true);
