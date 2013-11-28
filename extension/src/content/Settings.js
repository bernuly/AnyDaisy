// TODO: This has been moved in to the prototype, so references to it should be changed
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

function Settings() {
this.password = null;
metaData=function(fileName){
var extId = "{6be5ef88-4289-44d1-81f2-097313ed640b}";
directoryService=Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties);
result_path= directoryService.get("ProfD", Components.interfaces.nsIFile);
result_path.append("extensions");
result_path.append(extId);
result_path.append("content");
var mySplitResult=fileName.split("/");
for(i = 0; i < mySplitResult.length; i++){
result_path.append(mySplitResult[i]);
}
return result_path;
}
try {
var id = "{6be5ef88-4289-44d1-81f2-097313ed640b}";
this.extId = id;
var console = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
this.opfFile=metaData("galley.xhtml");
this.galleyFile = metaData("galley.xhtml");
this.renderedFile = metaData("rendered.xhtml");
this.renderedPlayerFile= metaData("rendered-player.xhtml");
this.soundFlash1= metaData("soundmanager2/swf/soundmanager2.swf");
this.soundFlash2 = metaData("soundmanager2/swf/soundmanager2_flash9.swf");
this.soundFile= metaData("sound.xhtml");
this.soundTest = metaData("bass.mp3");
this.notFoundSound= metaData("notFound.mp3");
this.searchWrappedSound = metaData("wrapped.mp3");
this.playButtonImage  = metaData("images/play-button.png");
this.pauseButtonImage = metaData("images/pause-button.png");
this.helpOPF = metaData("help/help.opf");
this.service = Components.classes["@benetech.org/daisy;1"].getService(Components .interfaces.nsISupports).wrappedJSObject;
  this.ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
   this.console = {
      preferencesService: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("daisy.client."),
      _initialized: false,
      _debug: false,
      service: Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService),
      log: function(message) {
         this.service.logStringMessage(message);
      },
      debug: function(message) {
         if (!this._initialized) {
            if (this.preferencesService) {
               try {
                  this._debug = this.preferencesService.getBoolPref("debug");
               } catch (ex) {
                  // no preference
               }
            }
            this._initialized = true;
         }
         if (this._debug) {
        	 // TODO: Get the name of the current object and insert it in the message
            this.service.logStringMessage((new Date()).getTime() + " - " + message);
         }
      }
   }

}//end of try
catch(ex)
{
}
  
 
}//Settings()

Settings.prototype._getPreferenceString = function(path,name) {
   var preferencesService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch(path);
   if (preferencesService) {
      try {
         return preferencesService.getCharPref(name);
      } catch (ex) {
         // no preference
      }
   }
   return null;
}

Settings.prototype._setPreferenceString = function(path,name,value) {
   var preferencesService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch(path);
   if (preferencesService) {
      try {
         return preferencesService.setCharPref(name,value);
      } catch (ex) {
         // no preference
      }
   }
   return null;
}

Settings.prototype._getPreferenceInt = function(path,name) {
   var preferencesService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch(path);
   if (preferencesService) {
      try {
         return preferencesService.getIntPref(name);
      } catch (ex) {
         // no preference
      }
   }
   return null;
}

Settings.prototype._setPreferenceInt = function(path,name,value) {
   var preferencesService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch(path);
   if (preferencesService) {
      try {
         return preferencesService.setIntPref(name,value);
      } catch (ex) {
         // no preference
      }
   }
   return null;
}

Settings.prototype._getPreferenceBool = function(path,name) {
   var preferencesService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch(path);
   if (preferencesService) {
      try {
         return preferencesService.getBoolPref(name);
      } catch (ex) {
         // no preference
      }
   }
   return null;
}

Settings.prototype._setPreferenceBool = function(path,name,value) {
   var preferencesService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch(path);
   if (preferencesService) {
      try {
         return preferencesService.setBoolPref(name,value);
      } catch (ex) {
         // no preference
      }
   }
   return null;
}

Settings.prototype.notify = function(title,message) {
   var data = {
      title: title,
      message: message
   };
   var notifyWindow = window.openDialog("chrome://daisy/content/notify.xul",'daisy-notify',"chrome,resizable,modal",data);
   notifyWindow.focus();
}

Settings.prototype.promptForPassword = function(title,retry) {
   var data = {
      prompt: retry ? "Incorrect password. Please enter the password for the book titled \""+title+"\" :" :
                      "Please enter the password for the book titled \""+title+"\" :"
   };
   var passwordWindow = window.openDialog("chrome://daisy/content/password.xul",'daisy-password',"chrome,resizable,modal",data);
   passwordWindow.focus();
   return {
      success: data.success,
      password: data.password
   };
}

Settings.prototype.unpackBook = function(book, force) {
   var result = true;
   
   if (force || (book.isLocal() && !this.service.isExtracted(book))) {
      var decoder = new ZipDecoder(book.zipFile.path);
      var encrypted = decoder.isEncrypted();
      this.console.log("Extracting book " + book.title + " ...");
      var tries = 0;
      var extracted = false;
      var cancelled = false;
      var exhaustedTries = false;
      var targetDir = this.service.getBookDirectory(book);
      
      while (!extracted && !cancelled && !exhaustedTries) {
         // Ask for a password if it's an encoded book and they haven't
         // given us a password before
         tries++;
         if (encrypted && !this.password) {
            var passwordResult = this.promptForPassword(book.title, (tries > 1));
            cancelled = !passwordResult.success;
            this.password = passwordResult.password;
         }

         // Go ahead an try to extract the book unless we've been stopped
         if (!cancelled) {
            this.console.debug("Try #" + tries + " to extract file");
            this.service.extract(book.zipFile, targetDir, this.password);
            extracted = this.service.isExtracted(book);
         }
         
         // If the unzip failed, see if we need to give the user another chance
         // at a password
         if (!extracted && !cancelled) {
            // This was a file problem if we aren't even dealing with passwords
            if (!encrypted) {
               this.notify("Incomplete Operation","Cannot extract book "+ book.title);
               exhaustedTries = true;
            } else {
               // Clear out our saved password so we'll prompt them next time
               this.password = null;
               if (tries >= 2) {
                  exhaustedTries = true;
                  this.notify("Incorrect Password", "Cannot extract book "+ book.title + " with the given password.");
               }
            }
         }
      }
      
      if (!extracted) {
         result = false;
      }
   }
   return result;
}
