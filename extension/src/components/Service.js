
function DAISYPreferences() {
   this.preferencesService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("daisy.");
   this._debug = this.preferencesService.prefHasUserValue("debug") ? this._getBoolean("debug") : false;
   this._allowQuirks = this.preferencesService.prefHasUserValue("allowQuirks") ? this._getBoolean("allowQuirks") : true;
   this._soundNavigation = this.preferencesService.prefHasUserValue("soundNavigation") ? this._getBoolean("soundNavigation") : true;
   this._voicingMode = this.preferencesService.prefHasUserValue("voicingMode") ? this._getString("voicingMode") : "voicing-comprehensive";
   this._showImages = this.preferencesService.prefHasUserValue("showImages") ? this._getBoolean("showImages") : true;
   this._useNarration = this.preferencesService.prefHasUserValue("useNarration") ? this._getBoolean("useNarration") : true;
   this._navigateByStructure = true;
   this._readNotesInline = this.preferencesService.prefHasUserValue("readNotesInline") ? this._getBoolean("readNotesInline") : false;
   this._cueSidebarOpen = this.preferencesService.prefHasUserValue("cueSidebarOpen") ? this._getBoolean("cueSidebarOpen") : true;
   this._speechRate = this.preferencesService.prefHasUserValue("speechRate") ? this._getInteger("speechRate") : null;
   this._playbackPause = this.preferencesService.prefHasUserValue("playbackPause") ? this._getInteger("playbackPause") : 500;
   // These are no longer set by the user.
   this._sidebarPause = false;
   this._highlight = true;
   this._focusFollow = true;
   this._textDuration = 2000;
   // We will always start with voicing off until a book is loaded
   this._voicingEnabled = false;
}

DAISYPreferences.prototype.__defineGetter__("debug", function() {
   return this._debug;
});
DAISYPreferences.prototype.__defineSetter__("debug", function(v) {
   this._debug = v;
   this._setBoolean("debug",v);
});

DAISYPreferences.prototype.__defineGetter__("allowQuirks", function() {
   return this._allowQuirks;
});
DAISYPreferences.prototype.__defineSetter__("allowQuirks", function(v) {
   this._allowQuirks = v;
   this._setBoolean("allowQuirks",v);
});

DAISYPreferences.prototype.__defineGetter__("sound", function() {
   return this._sound;
});
DAISYPreferences.prototype.__defineSetter__("sound", function(v) {
   this._sound = v;
   this._setBoolean("sound",v);
});

DAISYPreferences.prototype.__defineGetter__("voicingMode", function() {
   return this._voicingMode;
});
DAISYPreferences.prototype.__defineSetter__("voicingMode", function(v) {
   this._voicingMode = v;
   this._setString("voicingMode", v);
});

DAISYPreferences.prototype.__defineGetter__("voicingEnabled", function() {
	   return this._voicingEnabled;
	});
DAISYPreferences.prototype.__defineSetter__("voicingEnabled", function(v) {
   this._voicingEnabled = v;
});

DAISYPreferences.prototype.__defineGetter__("soundNavigation", function() {
   return this._soundNavigation;
});
DAISYPreferences.prototype.__defineSetter__("soundNavigation", function(v) {
   this._soundNavigation = v;
   this._setBoolean("soundNavigation",v);
});

DAISYPreferences.prototype.__defineGetter__("showImages", function() {
   return this._showImages;
});
DAISYPreferences.prototype.__defineSetter__("showImages", function(v) {
   this._showImages = v;
   this._setBoolean("showImages",v);
});

DAISYPreferences.prototype.__defineGetter__("focusFollow", function() {
   return this._focusFollow;
});
DAISYPreferences.prototype.__defineSetter__("focusFollow", function(v) {
   this._focusFollow = v;
   this._setBoolean("focusFollow",v);
});

DAISYPreferences.prototype.__defineGetter__("highlight", function() {
   return this._highlight;
});
DAISYPreferences.prototype.__defineSetter__("highlight", function(v) {
   this._highlight = v;
   this._setBoolean("highlight",v);
});

DAISYPreferences.prototype.__defineGetter__("useNarration", function() {
   return this._useNarration;
});
DAISYPreferences.prototype.__defineSetter__("useNarration", function(v) {
   this._useNarration = v;
   this._setBoolean("useNarration",v);
});

DAISYPreferences.prototype.__defineGetter__("sidebarPause", function() {
   return this._sidebarPause;
});
DAISYPreferences.prototype.__defineSetter__("sidebarPause", function(v) {
   this._sidebarPause = v;
   this._setBoolean("sidebarPause",v);
});

DAISYPreferences.prototype.__defineGetter__("readNotesInline", function() {
   return this._readNotesInline;
});
DAISYPreferences.prototype.__defineSetter__("readNotesInline", function(v) {
   this._readNotesInline = v;
   this._setBoolean("readNotesInline",v);
});

DAISYPreferences.prototype.__defineGetter__("cueSidebarOpen", function() {
   return this._cueSidebarOpen;
});
DAISYPreferences.prototype.__defineSetter__("cueSidebarOpen", function(v) {
   this._cueSidebarOpen = v;
   this._setBoolean("cueSidebarOpen",v);
});

DAISYPreferences.prototype.__defineGetter__("textDuration", function() {
   return this._textDuration;
});
DAISYPreferences.prototype.__defineSetter__("textDuration", function(v) {
   this._textDuration = v;
   this._setInteger("textDuration",v);
});

DAISYPreferences.prototype.__defineGetter__("playbackPause", function() {
   return this._playbackPause;
});
DAISYPreferences.prototype.__defineSetter__("playbackPause", function(v) {
   this._playbackPause = v;
   this._setInteger("playbackPause",v);
});

DAISYPreferences.prototype.__defineGetter__("speechRate", function() {
   return this._speechRate;
});
DAISYPreferences.prototype.__defineSetter__("speechRate", function(v) {
   this._speechRate = v;
   if (v) {
      this._setInteger("speechRate",v);
   } else {
      try {
         this.preferencesService.clearUserPref("speechRate");
      } catch (ex) {
         // We'll get an exception if this pref doesn't exist,
         // which we really don't care about.
      }
   }
});

DAISYPreferences.prototype._getBoolean = function(name) {
   try {
      return this.preferencesService.getBoolPref(name);
   } catch (ex) {
      return false;
   }
};

DAISYPreferences.prototype._setBoolean = function(name,value) {
   return this.preferencesService.setBoolPref(name,value);
};

DAISYPreferences.prototype._getString = function(name) {
   try {
      return this.preferencesService.getCharPref(name);
   } catch (ex) {
      return null;
   }
};

DAISYPreferences.prototype._setString = function(name,value) {
   return this.preferencesService.setCharPref(name,value);
};

DAISYPreferences.prototype._getInteger = function(name) {
   try {
      return this.preferencesService.getIntPref(name);
   } catch (ex) {
      return null;
   }
};

DAISYPreferences.prototype._setInteger = function(name,value) {
   return this.preferencesService.setIntPref(name,value);
};

DAISYService.prototype.classDescription = "DAISYService Component";
DAISYService.prototype.classID = Components.ID("{4655c7a3-5675-4ce7-beb4-8dbcb00e7971}");
DAISYService.prototype.contractID = "@benetech.org/daisy;1";
DAISYService.prototype._xpcom_factory = this.myFactory;

function DAISYService() {
   this.wrappedJSObject = this;
   this._window = null;
   this.locks = {};
   this.libraries = {};
   this.books = {};
   this.flashUpdated = false;
   this.prefObservers = [];
   this._defaults = {};
   this._active = false;
   metaData=function(fileName){
var extId = "{6be5ef88-4289-44d1-81f2-097313ed640b}";
directoryService=Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties);
result_path= directoryService.get("ProfD", Components.interfaces.nsIFile);
result_path.append("extensions");
result_path.append(extId);
var mySplitResult=fileName.split("/");
for(i = 0; i < mySplitResult.length; i++){
result_path.append(mySplitResult[i]);
}
return result_path;
}
  //this._defaults["WINNT.unzip.command"] = Components.classes["@mozilla.org/extensions/manager;1"].getService(Components.interfaces.nsIExtensionManager).getInstallLocation(DAISYService.extID).getItemFile(DAISYService.extID,"unzip.exe").path;
this._defaults["WINNT.unzip.command"]=metaData("unzip.exe").path;
   this._defaults["default.unzip.command"] = "/usr/bin/unzip";
   var preferencesService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("daisy.zip.");
   if (preferencesService) {
      try {
         this.unzipCommand = preferencesService.getCharPref("command");
      } catch (ex) {
         // no preference
      }
   }
   if (!this.unzipCommand) {
      this.unzipCommand = this.defaults[DAISYService.OS+".unzip.command"];
      if (!this.unzipCommand) {
         this.unzipCommand = this.defaults["default.unzip.command"];
      }
      DAISYService.console.debug("unzip command defaults to: "+this.unzipCommand);
   }
   this._renderer = this.createRenderer();
   this._renderer.setSMILTransform("chrome://daisy/content/daisy/dtbook2smil.xsl");
   this._renderer.setXHTMLTransform("chrome://daisy/content/daisy/dtbook2xhtml.xsl");
   try {
      this.ttsMediator = Components.classes["@benetech.org/tts-mediator-service;1"].getService(Components.interfaces.nsITTSMediatorService);
      this._tts = this.ttsMediator.findEngine(null);
      if (!this._tts) {
         DAISYService.console.log("A TTS factory is not available.");
      } else {
         if (this.speechRate) {
            this._tts.rate = this.speechRate;
         }
         DAISYService.console.log("TTS rate: "+this._tts.rate+", ("+this._tts.minimumRate+", "+this._tts.normalRate+", "+this._tts.maximumRate+", "+this._tts.rateUnit+")");
      }
   } catch (ex) {
      DAISYService.console.log("Error initializing TTS: "+ex);
   }

   var domPreferencesService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("dom.");
   if (!domPreferencesService.prefHasUserValue("max_chrome_script_run_time")) {
      domPreferencesService.setIntPref("max_chrome_script_run_time",40);
   };
   if (!domPreferencesService.prefHasUserValue("max_script_run_time")) {
      domPreferencesService.setIntPref("max_script_run_time",40);
   };

   this.productInfo = new DAISYProductInfo();

}

DAISYService.prototype.__defineGetter__("tts",function() {
   return this._tts;
});


DAISYService.prototype.__defineGetter__("renderer",function() {
   return this._renderer;
});

DAISYService.prototype.__defineGetter__("database",function() {
   if (!this._database) {
      var dirService = Components.classes['@mozilla.org/file/directory_service;1'].getService(Components.interfaces.nsIProperties);
      var dbFile = dirService.get("ProfD", Components.interfaces.nsILocalFile);
      dbFile.append("daisy.sqlite");
      this._database = new DAISYDB();
      this._database.open(dbFile);
   }
   return this._database;
});

DAISYService.prototype.updateFlashSecurity = function() {

metaData=function(fileName){
var extId = "{6be5ef88-4289-44d1-81f2-097313ed640b}";
directoryService=Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties);
result_path= directoryService.get("ProfD",Components.interfaces.nsIFile);
result_path.append("extensions");
result_path.append(extId);
result_path.append("content");
var mySplitResult=fileName.split("/");
for(i = 0; i < mySplitResult.length; i++){
result_path.append(mySplitResult[i]);
}
return result_path;
}
var console = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
//console.logStringMessage("inside flash security function in Daisy.js");  
var flashFiles = [];
flashFiles.push({ path: "chrome://daisy/content/sidebar.xul"});
flashFiles.push({ path: "chrome://daisy/content/sound.xul"});
flashFiles.push({ path: "chrome://daisy/content/sound.xhtml"});
flashFiles.push(metaData("galley.xhtml"));
flashFiles.push(metaData("rendered.xhtml"));
flashFiles.push(metaData("rendered-player.xhtml"));
flashFiles.push(metaData("sound.xhtml"));
flashFiles.push(metaData("soundmanager2/swf/soundmanager2.swf"));
flashFiles.push(metaData("soundmanager2/swf/soundmanager2_flash9.swf"));

var dirService = Components.classes['@mozilla.org/file/directory_service;1'].getService(Components.interfaces.nsIProperties);
   var flashfile = null;
   if (DAISYService.OS=="WINNT") {
      var desktop = dirService.get("Desk", Components.interfaces.nsILocalFile);
      flashfile = desktop.parent;
      flashfile.append("Application Data");
      flashfile.append("Macromedia");
      if (!flashfile.exists()) {
         flashfile.create(Components.interfaces.nsIFile.DIRECTORY_TYPE,0700);
      }
      flashfile.append("Flash Player");
      if (!flashfile.exists()) {
         flashfile.create(Components.interfaces.nsIFile.DIRECTORY_TYPE,0700);
      }
      flashfile.append("#Security");
      if (!flashfile.exists()) {
         flashfile.create(Components.interfaces.nsIFile.DIRECTORY_TYPE,0700);
      }
      flashfile.append("FlashPlayerTrust");
      if (!flashfile.exists()) {
         flashfile.create(Components.interfaces.nsIFile.DIRECTORY_TYPE,0700);
      }

   } else if (DAISYService.OS=="Darwin") {
      flashfile = dirService.get("Home", Components.interfaces.nsILocalFile);
      flashfile.append("Library");
      flashfile.append("Preferences");
      flashfile.append("Macromedia");
      if (!flashfile.exists()) {
         flashfile.create(Components.interfaces.nsIFile.DIRECTORY_TYPE,0700);
      }
      flashfile.append("Flash Player");
      if (!flashfile.exists()) {
         flashfile.create(Components.interfaces.nsIFile.DIRECTORY_TYPE,0700);
      }
      flashfile.append("#Security");
      if (!flashfile.exists()) {
         flashfile.create(Components.interfaces.nsIFile.DIRECTORY_TYPE,0700);
      }
      flashfile.append("FlashPlayerTrust");
      if (!flashfile.exists()) {
         flashfile.create(Components.interfaces.nsIFile.DIRECTORY_TYPE,0700);
      }
   } else if (DAISYService.OS=="Linux" || DAISYService.OS=="SunOS") {
      // /home/{user}/.macromedia/Flash_Player/#Security/FlashPlayerTrust
      flashfile = dirService.get("Home", Components.interfaces.nsILocalFile);
      flashfile.append(".macromedia");
      if (!flashfile.exists()) {
         flashfile.create(Components.interfaces.nsIFile.DIRECTORY_TYPE,0700);
      }
      flashfile.append("Flash_Player");
      if (!flashfile.exists()) {
         flashfile.create(Components.interfaces.nsIFile.DIRECTORY_TYPE,0700);
      }
      flashfile.append("#Security");
      if (!flashfile.exists()) {
         flashfile.create(Components.interfaces.nsIFile.DIRECTORY_TYPE,0700);
      }
      flashfile.append("FlashPlayerTrust");
      if (!flashfile.exists()) {
         flashfile.create(Components.interfaces.nsIFile.DIRECTORY_TYPE,0700);
      }
   } else {
      DAISYService.console.log("Unable to check flash security for OS "+DAISYService.OS);
      return;
   }
   flashfile.append("daisy.cfg");
   if (flashfile.exists()) {
      if (!this.flashUpdated) {
         flashfile.remove(false);
      } else {
         return;
      }
   }
   DAISYService.console.log("Creating flash security configuration: "+flashfile.path);
   var out = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);

   var eol = DAISYService.OS=="WINNT" ? "\r\n" : "\n";
   out.init(flashfile, 0x02 | 0x08 | 0x20, 0666, 0);

   for (var i=0; i<flashFiles.length; i++) {
      out.write(flashFiles[i].path,flashFiles[i].path.length); out.write(eol,eol.length);
   }
   /*
   for (var uri in this.books) {
      var file = DAISYService.getFileFromURI(uri);
      if (file) {
         out.write(file.path,file.path.length); out.write(eol,eol.length);
      }
   }
   */
   out.close();
   this.flashUpdated = true;
};

DAISYService.preferences = null;

DAISYService.prototype.__defineGetter__("defaults", function() {
   if (!this._defaults) {
   }
   return this._defaults;
});


DAISYService.console = {
   service: Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService),
   log: function(message) {
      this.service.logStringMessage(message);
   },
   debug: function(message) {
      if (DAISYService.preferences && DAISYService.preferences.debug) {
         this.service.logStringMessage(message);
      }
   }
};

DAISYService.extID = "{6be5ef88-4289-44d1-81f2-097313ed640b}";
DAISYService.OS = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime).OS;

DAISYService.ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
DAISYService.fileURL = function(file) {
   return DAISYService.ios.newFileURI(file);
};

DAISYService.getFileFromURI = function(suri) {
   var uri = DAISYService.ios.newURI(suri,"UTF-8",null);
   if (uri.scheme=="file") {
      uri = uri.QueryInterface(Components.interfaces.nsIFileURL);
      return uri.file;
   }
   return null;
};

DAISYService.prototype.addPreferenceObserver = function(listener) {
   this.prefObservers.push(listener);
};

DAISYService.prototype.removePreferenceObserver = function(listener) {
   for (var i=0; i<this.prefObservers.length; i++) {
      if (this.prefObservers[i]==listener) {
         this.prefObservers.splice(i,1);
         return;
      }
   }
};

DAISYService.prototype.notifyPreferenceChange = function(name) {
   for (var i=0; i<this.prefObservers.length; i++) {
      this.prefObservers[i].onChange(name);
   }
};

DAISYService.prototype.__defineGetter__("active", function() {
   return this._active;
});
DAISYService.prototype.__defineSetter__("active", function(v) {
   this._active = v ? true : false;
});

DAISYService.prototype.__defineGetter__("debug", function() {
   return DAISYService.preferences.debug;
});
DAISYService.prototype.__defineSetter__("debug", function(v) {
   DAISYService.preferences.debug = v ? true : false;
   this.smil.debug = DAISYService.preferences.debug;
   this.notifyPreferenceChange("debug");
});

DAISYService.prototype.__defineGetter__("allowQuirks", function() {
   return DAISYService.preferences.allowQuirks;
});
DAISYService.prototype.__defineSetter__("allowQuirks", function(v) {
   DAISYService.preferences.allowQuirks = v ? true : false;
   DAISYNavigationControl.allowQuirks = DAISYService.preferences.allowQuirks;
   this.smil.allowQuirks = DAISYService.preferences.allowQuirks;
   this.notifyPreferenceChange("allowQuirks");
});

DAISYService.prototype.__defineGetter__("sound", function() {
   return DAISYService.preferences.sound;
});
DAISYService.prototype.__defineSetter__("sound", function(v) {
   DAISYService.preferences.sound = v ? true : false;
   this.notifyPreferenceChange("sound");
});

DAISYService.prototype.__defineGetter__("soundNavigation", function() {
   return DAISYService.preferences.soundNavigation;
});
DAISYService.prototype.__defineSetter__("soundNavigation", function(v) {
   DAISYService.preferences.soundNavigation = v ? true : false;
   this.notifyPreferenceChange("soundNavigation");
});

DAISYService.prototype.__defineGetter__("voicingMode", function() {
   return DAISYService.preferences.voicingMode;
});
DAISYService.prototype.__defineSetter__("voicingMode", function(v) {
   DAISYService.preferences.voicingMode = v;
   this.notifyPreferenceChange("voicingMode");
});

DAISYService.prototype.__defineGetter__("voicingEnabled", function() {
	   return DAISYService.preferences.voicingEnabled;
	});
DAISYService.prototype.__defineSetter__("voicingEnabled", function(v) {
   DAISYService.preferences.voicingEnabled = v;
   this.notifyPreferenceChange("voicingEnabled");
});

DAISYService.prototype.__defineGetter__("showImages", function() {
   return DAISYService.preferences.showImages;
});
DAISYService.prototype.__defineSetter__("showImages", function(v) {
   DAISYService.preferences.showImages = v ? true : false;
   this.notifyPreferenceChange("showImages");
});

DAISYService.prototype.__defineGetter__("focusFollow", function() {
   return DAISYService.preferences.focusFollow;
});
DAISYService.prototype.__defineSetter__("focusFollow", function(v) {
   DAISYService.preferences.focusFollow = v ? true : false;
   this.notifyPreferenceChange("focusFollow");
});

DAISYService.prototype.__defineGetter__("highlight", function() {
   return DAISYService.preferences.highlight;
});
DAISYService.prototype.__defineSetter__("highlight", function(v) {
   DAISYService.preferences.highlight = v ? true : false;
   this.notifyPreferenceChange("highlight");
});

DAISYService.prototype.__defineGetter__("useNarration", function() {
   return DAISYService.preferences.useNarration;
});
DAISYService.prototype.__defineSetter__("useNarration", function(v) {
   DAISYService.preferences.useNarration = v ? true : false;
   this.notifyPreferenceChange("useNarration");
});

DAISYService.prototype.__defineGetter__("sidebarPause", function() {
   return DAISYService.preferences.sidebarPause;
});
DAISYService.prototype.__defineSetter__("sidebarPause", function(v) {
   DAISYService.preferences.sidebarPause = v ? true : false;
   this.notifyPreferenceChange("sidebarPause");
});

DAISYService.prototype.__defineGetter__("readNotesInline", function() {
   return DAISYService.preferences.readNotesInline;
});
DAISYService.prototype.__defineSetter__("readNotesInline", function(v) {
   DAISYService.preferences.readNotesInline = v ? true : false;
   this.notifyPreferenceChange("readNotesInline");
});

DAISYService.prototype.__defineGetter__("cueSidebarOpen", function() {
   return DAISYService.preferences.cueSidebarOpen;
});
DAISYService.prototype.__defineSetter__("cueSidebarOpen", function(v) {
   DAISYService.preferences.cueSidebarOpen = v ? true : false;
   this.notifyPreferenceChange("cueSidebarOpen");
});


DAISYService.prototype.__defineGetter__("textDuration", function() {
   return DAISYService.preferences.textDuration;
});
DAISYService.prototype.__defineSetter__("textDuration", function(v) {
   DAISYService.preferences.textDuration = v;
   this.smil.textOnlyPause = v;
   this.notifyPreferenceChange("textDuration");
});

DAISYService.prototype.__defineGetter__("playbackPause", function() {
   return DAISYService.preferences.playbackPause;
});
DAISYService.prototype.__defineSetter__("playbackPause", function(v) {
   DAISYService.preferences.playbackPause = v;
   this.notifyPreferenceChange("playbackPause");
});

DAISYService.prototype.__defineGetter__("speechRate", function() {
   return DAISYService.preferences.speechRate;
});
DAISYService.prototype.__defineSetter__("speechRate", function(v) {
   DAISYService.preferences.speechRate = v;
   if (v) {
      // set the rate value
      this._tts.rate = v;
   } else {
      // reset to system defaults by finding a new engine
      this._tts.rate = this._tts.normalRate;
   }
   this.notifyPreferenceChange("speechRate");
});


DAISYService.prototype.__defineGetter__("smil", function() {
   if (!DAISYService.smilEngine) {
      try {
         var theClass = Components.classes["@benetech.org/daisy-smil-engine;1"];
         if (theClass) {
            var theComponent = theClass.getService(Components.interfaces.nsISupports);
            DAISYService.smilEngine = theComponent.wrappedJSObject;
            DAISYService.smilEngine.debug = DAISYService.preferences.debug;
            DAISYService.smilEngine.textOnlyPause = DAISYService.preferences.textDuration;
            DAISYService.smilEngine.allowQuirks = DAISYService.preferences.allowQuirks;
         } else {
            DAISYService.console.log("Cannot find SMIL engine class.");
         }
      } catch (ex) {
         DAISYService.console.log("Cannot load SMIL engine: "+ex);
      }
   }
   return DAISYService.smilEngine;
});

DAISYService.prototype.__defineGetter__("OS", function() {
   return DAISYService.OS;
});

// TODO: Remove, this is old prototype code
DAISYService.prototype.__defineGetter__("window", function() {
   if (!this._window || this._window.closed) {
      var ww = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
                   .getService(Components.interfaces.nsIWindowWatcher);
      this._window = ww.openWindow(
         null,
         'chrome://daisy/content/player.xul',
         'daisy-player',
         'centerscreen,chrome,resizable',
         null
      );
   }
   return this._window;
});

//TODO: Remove, this is old prototype code
DAISYService.prototype.unload = function() {
   if (this._window) {
      this._window.close();
      this._window = null;
   }
   this.libraries = {};
   this.books = {};
};

DAISYService.prototype.getBook = function(uri) {
   DAISYService.console.debug("Get book "+uri);
   return this.books[uri];
};

DAISYService.prototype.newBook = function(uri) {
   var current = this;
   var book = new DAISYBook();
   book.init();
   book.onDestroy = function() {
      current.removeBook(uri);
   };
   if (uri) {
      this.mapBook(uri,book);
   }
   return book;
};

DAISYService.prototype.mapBook = function(uri,book) {
   DAISYService.console.debug("Mapping "+uri+" to book");
   this.books[uri] = book;
};

DAISYService.prototype.removeBook = function(uri) {
   DAISYService.console.debug("Removing book "+uri);
   delete this.books[uri];
};

DAISYService.prototype.createRenderer = function() {
   return new DAISYRenderer(this);
};


DAISYService.prototype.getLibrary = function(dir) {
   var lib = this.libraries[dir];
   if (!lib) {
      lib = new DAISYLibrary(this,dir);
      if (!lib.dir.exists()) {
         DAISYService.console.log("Library directory "+lib.dir.path+" does not exist.");
         return null;
      }
      lib.load();
      this.libraries[dir] = lib;
   }
   return lib;
};

DAISYService.prototype.findPackagingInDirectory = function(dir) {
   var bookDirEntries = dir.directoryEntries;
   var opfTest = /\.opf$/;
   while (bookDirEntries.hasMoreElements()) {
      var bookFile = bookDirEntries.getNext().QueryInterface(Components.interfaces.nsIFile);
      if (bookFile.leafName.match(opfTest)) {
         return bookFile;
      }
   }
   return null;
};

DAISYService.prototype.getBookDirectory = function(book) {
   for (var id in book.uris) {
      var uri = DAISYService.ios.newURI(book.uris[id],"UTF-8",null);
      DAISYService.console.debug("Book URI for directory calculation: "+uri.spec);
      if (uri.scheme=="file") {
         uri = uri.QueryInterface(Components.interfaces.nsIFileURL);
         if (uri.path.match(".zip$")==".zip" || uri.path.match(".bks2$")==".bks2") {
            var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
            file.initWithPath(uri.file.parent.path);
            var pos = uri.file.leafName.lastIndexOf(".zip");
            if (pos<0) {
               pos = uri.file.leafName.lastIndexOf(".bks2");
            }
            file.appendRelativePath(uri.file.leafName.substring(0,pos));
            DAISYService.console.debug("Book unzip dir: "+file.path);
            return file;
         } else {
            DAISYService.console.debug("Book parent dir: "+uri.file.parent.path);
            return uri.file.parent;
         }
      }
   }
   return null;
};

DAISYService.prototype.isExtracted = function(book) {
   var bookDir = this.getBookDirectory(book);
   if (bookDir && bookDir.exists()) {
      var item = book.manifest[book.spine[0]];
      if (item) {
         var smilFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
         smilFile.initWithPath(bookDir.path);
         smilFile.appendRelativePath(item.href);
         return smilFile.exists();
      }
   }
   return false;
};


DAISYService.prototype.extract = function(zipFile,targetDir,password) {

   DAISYService.console.log("Unpacking to "+targetDir.path);

   var file =  Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);

   file.initWithPath(this.unzipCommand);

   if (!file.exists()) {
      return -1;
   }


   this.process = Components.classes["@mozilla.org/process/util;1"].createInstance(Components.interfaces.nsIProcess);
   this.process.init(file);
   var argv = [ "-o", "-qq", ];
   if (password) {
      argv.push("-P");
      argv.push(password);
   }

   argv.push("-d");
   argv.push(targetDir.path);

   argv.push(zipFile.path);

   //alert(argv.join(" "));

   this.process.run(true, argv, argv.length);

   // we do this because the status returned on OS X is wrong
   var current = this;
   var count = 0;
   var waitFor = function() {
      if ((count>10 && current.process.exitValue==0) || current.process.exitValue>0) {
         if (current.onComplete) {
            current.onComplete(current.process.exitValue);
         }
      } else {
         count++;
         setTimeout(waitFor,100);
      }
   };
   waitFor();
};

DAISYService.prototype.readZipPackaging = function(zipFile) {
   DAISYService.console.debug("Loading opf from "+zipFile.path);
   var zipReader = Components.classes["@mozilla.org/libjar/zip-reader;1"].createInstance(Components.interfaces.nsIZipReader);
   zipReader.open(zipFile);
   var entryIterator = zipReader.findEntries(null);
   var opfPath = null;
   var extensionTest = /\.([^\.]+)$/;
   while (entryIterator.hasMore()) {
      var path = entryIterator.getNext();
      var ext = path.match(extensionTest);
      if (ext) {
         if (ext[1]=="opf") {
            opfPath = path;
         }
      }
   }
   var is = zipReader.getInputStream(opfPath);
   var parser = Components.classes["@mozilla.org/xmlextras/domparser;1"].createInstance(Components.interfaces.nsIDOMParser);
   var doc = parser.parseFromStream(is,"UTF-8",is.available(),"text/xml");
   is.close();
   zipReader.close();
   var pos = zipFile.leafName.lastIndexOf(".zip");
   if (pos<0) {
      pos = zipFile.leafName.lastIndexOf(".bks2");
   }
   return {
      document: doc,
      baseURI: DAISYService.fileURL(zipFile.parent).spec+zipFile.leafName.substring(0,pos)+"/"+opfPath
   };
};

/**
 * Return true if the voicing mode is set to 'Mute'.
 */
DAISYService.prototype.isMuted = function() {
   return this.voicingMode === this.voicingMute() && this.useNarration;
};

/**
 * Return true if the voicing mode is set to either 'Books and Navigation'
 * or 'Comprehensive'.
 */
DAISYService.prototype.readExtension = function() {
   return this.voicingMode === this.voicingBooks() || this.readComprehensive();
};

/**
 * Return true if the voicing mode is set to 'Comprehensive'.
 */
DAISYService.prototype.readComprehensive = function() {
   return this.voicingMode === this.voicingComprehensive();
};

DAISYService.prototype.voicingMute = function() {
   return "voicing-mute";
};

DAISYService.prototype.voicingComprehensive = function() {
   return "voicing-comprehensive";
};

DAISYService.prototype.voicingBooks = function() {
   return "voicing-books";
};

DAISYService.prototype.getLockFor = function(id) {
   var lock = this.locks[id];
   if (!lock) {
      lock = new Lock(id);
      this.locks[id] = lock;
   }
   return lock;
};

DAISYService.prototype.QueryInterface = function(iid) {
   DAISYService.console.debug("Querying: "+iid);
    /*
     *  This code specifies that the component supports 1 interfaces:
     *  nsISupports.
     */
    if (!iid.equals(Components.interfaces.nsISupports)) {
        throw Components.results.NS_ERROR_NO_INTERFACE;
    }
    return this;
};



  /* nsIFactory */

  DAISYService.prototype.createInstance = function (outer, iid)
  {

    dump("CI: " + iid + "\n");
    if (outer != null) {
       throw Components.results.NS_ERROR_NO_AGGREGATION;
    }
    return _newInstance().QueryInterface(iid);

  },

  DAISYService.prototype.lockFactory = function (lock)
  {
    /* no-op */
  }

var components = [DAISYService];
/**
* XPCOMUtils.generateNSGetFactory was introduced in Mozilla 2 (Firefox 4).
* XPCOMUtils.generateNSGetModule is for Mozilla 1.9.2 (Firefox 3.6).
*/
if (XPCOMUtils.generateNSGetFactory) {
    var NSGetFactory = XPCOMUtils.generateNSGetFactory(components);
    }
else
    var NSGetModule = XPCOMUtils.generateNSGetModule([DAISYService]);


function Lock(name) {
   this.name = name;
   this.owner = null;
}

Lock.prototype.acquire = function(options) {
   var current = this;
   var newOwner = null;
   if (options && options.exclusive || !this.owner) {
      newOwner = {
         lock: current,
         relinquish: function() {
            DAISYService.console.debug("Relinquishing lock "+current.name);
            current.owner = null;
            if (options.onRelinquish) {
               options.onRelinquish();
            }
         },
         release: function() {
            DAISYService.console.debug("Releasing lock "+current.name);
            current.owner = null;
            if (options.onRelease) {
               options.onRelease();
            }
         }
      };
   }
   if (options && options.exclusive) {
      if (this.owner) {
         this.owner.relinquish();
      }
   } else if (this.owner) {
      return null;
   }
   this.owner = newOwner;
   if (this.owner) {
      DAISYService.console.debug("Lock "+current.name+" acquired.");
   }
   return newOwner;
};

