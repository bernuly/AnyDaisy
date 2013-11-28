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
};

const MILLISECONDS = 1000;

function ChangeSettings() {
   var theClass = Components.classes["@benetech.org/daisy;1"];
   var theComponent = theClass.getService(Components.interfaces.nsISupports);
   this.service = theComponent.wrappedJSObject;
}

ChangeSettings.getInstance = function() {
   if (!ChangeSettings.instance) {
      ChangeSettings.instance = new ChangeSettings();
   }
   return ChangeSettings.instance;
};

ChangeSettings.prototype.init = function(data) {
   this.data = data;
   this.uivoice = new UIVoice();
   this.uivoice.init();
   this.uivoice.attach(document);
   this.uivoice.introduce(document.title);

   this.initVoiceSettings();
   this.initAdvancedSettings();
   this.initAudioSettings();
   
   this.updateUI();
   
   // Make note of any changes made by global key commands
   var current = this;
   this.prefListener = {
      onChange: function(name) {
         // If we're on the voice mode dialog while they change it, update the UI
         if (name === "voicingMode" && current.voicingMode && current.voicingMode.selectedItem) {
            if (current.service.voicingMode != current.voicingMode.selectedItem.id) {
               current.data.voicingMode = current.service.voicingMode;
               current.updateAudioSettingsUI();
            }
         }
      }
   };
   
   this.service.addPreferenceObserver(this.prefListener);
};

ChangeSettings.prototype.initAdvancedSettings = function() {
   this.quirksCheck = document.getElementById("quirks-checkbox");
   this.useNarrationCheck = document.getElementById("use-narration-checkbox");
   this.showImagesCheck = document.getElementById("show-images-checkbox");
};

ChangeSettings.prototype.initAudioSettings = function() {
   this.voicingMode = document.getElementById("voicing-radiogroup");
   this.soundNavigationCheck = document.getElementById("sound-navigation-checkbox");
   this.cueSidebarOpenCheck = document.getElementById("cue-sidebar-open-checkbox");
};

ChangeSettings.prototype.initVoiceSettings = function() {
   this.speechRate = document.getElementById("speech-rate");
   if (this.speechRate) {
      // Put in choices based on the range available on the current system.
      var increments = 20;
      var span = this.data.speechRate.maximum - this.data.speechRate.minimum;
      var increment = span/increments;
      var itemValue = 0;
      var itemName = "";

      for (var i = 20; i >= 0; i--) {
         itemValue = this.data.speechRate.minimum + Math.round(increment * i);
         itemName = (this.data.speechRate.unit === "wpm") ? itemValue + " words per minute" : itemValue;
         // Console.log("Speech rate menu: " + itemName + " -> " + itemValue);
         // Create a new menu item for this value and add to the popup.
         var menuItem = this.speechRate.appendItem(itemName, itemValue);
      }
   }
      
   this.playbackPauseTime = document.getElementById("playback-pause-time");
};

ChangeSettings.prototype.updateUI = function() {
   this.updateVoiceSettingsUI();
   this.updateAdvancedSettingsUI();
   this.updateAudioSettingsUI();
};

ChangeSettings.prototype.updateAdvancedSettingsUI = function() {
   if (this.quirksCheck) {
      this.quirksCheck.checked = this.data.quirks;
   }
   if (this.useNarrationCheck) {
      this.useNarrationCheck.checked = this.data.useNarration;   
   }
   if (this.showImagesCheck) {
      this.showImagesCheck.checked = this.data.showImages;
   }
};

ChangeSettings.prototype.updateAudioSettingsUI = function() {
   if (this.voicingMode) {
      for (var i = 0; i < this.voicingMode.childNodes.length; i++) {
         if (this.voicingMode.childNodes[i].id === this.data.voicingMode) {
            this.voicingMode.selectedIndex = i;
            break;
         }
      }
   }
   if (this.soundNavigationCheck) {
      this.soundNavigationCheck.checked = this.data.soundNavigation;
   }
   if (this.cueSidebarOpenCheck) {
      this.cueSidebarOpenCheck.checked = this.data.cueSidebarOpen;
   }
};

ChangeSettings.prototype.updateVoiceSettingsUI = function() {
   // Our menu choices are all integer values
   if (this.speechRate) {
      var value = Math.round(this.data.speechRate.rate);
      for (var i = 0; i < this.speechRate.itemCount; i++) {
         // The menu choices are in descending order, so if go past
         // our stored value without an exact match, take one close to it.
         if (this.speechRate.menupopup.childNodes[i].value <= value) {
            this.speechRate.selectedIndex = i;
            break;
         }
      }
   }

   if (this.data.playbackPause) {
      var pauseValue = (this.data.playbackPause/MILLISECONDS)+"";
      for (i = 0; i < this.playbackPauseTime.itemCount; i++) {
         if (this.playbackPauseTime.menupopup.childNodes[i].value == pauseValue) {
            this.playbackPauseTime.selectedIndex = i;
            break;
         }
      }
   }
};

/**
 * Map a given speech rate to the nearest increment of the voice UI control.
 */
ChangeSettings.prototype.calculateVoiceControlSetting = function(rate, normal, min, max) {
   var value = 0;
   if (rate != normal) {
      value = min;
      while (value <= max && rate > this.calculateSpeechRate(value)) {
         value++;
      }
   }
   return value;
};

ChangeSettings.prototype.updateAdvancedData = function() {
   if (this.quirksCheck) {
      this.data.quirks = this.quirksCheck.checked;
   }
   
   if (this.useNarrationCheck) {
      this.data.useNarration = this.useNarrationCheck.checked;
   }
      
   if (this.showImagesCheck) {
      this.data.showImages = this.showImagesCheck.checked;
   }   
};

ChangeSettings.prototype.updateAudioData = function() {
   if (this.voicingMode) {
      this.data.voicingMode = this.voicingMode.selectedItem.id;
   }
   if (this.soundNavigationCheck) {
      this.data.soundNavigation = this.soundNavigationCheck.checked;
   }
   if (this.cueSidebarOpenCheck) {
      this.data.cueSidebarOpen = this.cueSidebarOpenCheck.checked;   
   }
};

ChangeSettings.prototype.updateVoiceData = function() {
   if (this.speechRate) {
      this.data.speechRate.preferredRate = this.calculateSpeechRate();
   }   

   if (this.playbackPauseTime) {
      this.data.playbackPause = parseFloat(this.playbackPauseTime.value) * MILLISECONDS;
   }   
};

ChangeSettings.prototype.calculateSpeechRate = function(avalue) {
   var value = avalue ? avalue : this.speechRate.value;
   if (value == 0) {
      return this.data.speechRate.normal;
   } else if (value < this.data.speechRate.minimum) {
      return this.data.speechRate.minimum;
   } else if (value > this.data.speechRate.maximum) {
      return this.data.speechRate.maximum;
   } else {
      return value;
   }

};

ChangeSettings.prototype.testTTS = function() {
   var savedRate = this.uivoice.service.speechRate;
   var current = this;
   try {
      this.uivoice.service.speechRate = this.calculateSpeechRate();
//      Console.log("Testing speech rate = " + this.uivoice.service.speechRate);
      this.uivoice.speak("Hello, this is a test of my voice speed.");
   } catch (ex) {
      Console.log("Error testing speech:" + ex);
   }
   setTimeout(function() {
      current.uivoice.service.speechRate = savedRate;
   }, 300);
//   Console.log("Speech rate set back after test to " + savedRate);
};

ChangeSettings.prototype.onCancel = function() {
   this.close();
}

ChangeSettings.prototype.close = function() {
   var current = this;
   setTimeout(function() {
      current.service.removePreferenceObserver(current.prefListener);
      window.close();
   },10);   
};

ChangeSettings.prototype.onApplyVoiceSettings = function() {
   this.updateVoiceData();
   this.data.onUpdate();
   this.close();
};

ChangeSettings.prototype.onApplyAdvancedSettings = function() {
   this.updateAdvancedData();
   this.data.onUpdate();
   this.close();
};

ChangeSettings.prototype.onApplyAudioSettings = function() {
   this.updateAudioData();
   this.data.onUpdate();
   this.close();
};
