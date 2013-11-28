
function Settings() {

}

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
