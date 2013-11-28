function DAISYOverlay() {
   var theClass = Components.classes["@benetech.org/daisy;1"];
   var theComponent = theClass.getService(Components.interfaces.nsISupports);
   this.count = 0;
   this.service = theComponent.wrappedJSObject;
   this.console = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
   this._windowMediator = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
   this.mainWindow = this._windowMediator.getMostRecentWindow("navigator:browser");
   this.tts = null;
   
   this.uivoice = new UIVoice();
   this.uivoice.init();
   
   var current = this;
      
   this.tabListener = function(event) {
      if (current.service.currentHelper) {
         //current.console.logStringMessage("Calling onStop on current helper.");
         current.service.currentHelper.onStop();
         current.service.tts.cancel();
         //} else {
         //current.console.logStringMessage("No current helper.");
      }
      var href = event.target.linkedBrowser.contentWindow.location.href;
      var hash = href.indexOf("#");
      if (hash>0) {
         href = href.substring(0,hash);
      }
      var book = current.service.getBook(href);
      //if (href.match(/.opf$/)==".opf") {
      var mainWindow = current._windowMediator.getMostRecentWindow("navigator:browser");
      var validPanel = mainWindow.document.getElementById("daisy-status-bar-valid");
      var quirkyPanel= mainWindow.document.getElementById("daisy-status-bar-quirky");
      if (book) {
         //current.console.logStringMessage("Selected DAISY Book tab.");
         if (book.quirky) {
            validPanel.style.display = "none";
            quirkyPanel.style.display = "block";
         } else {
            validPanel.style.display = "block";
            quirkyPanel.style.display = "none";
         }
      } else {
         if (current.service.readComprehensive() && current.service.tts && current.service.active) {
            var text = "Tab, "+event.target.label;
            current.service.tts.speak(text,null);
         }
         var sidebar  = mainWindow.document.getElementById("sidebar");
         if (sidebar.contentWindow.location.href=="chrome://daisy/content/sidebar.xul") {
            mainWindow.toggleSidebar();
         }
         validPanel.style.display = "none";
         quirkyPanel.style.display = "none";
         //current.console.logStringMessage("Selected web page tab.");
      }
   };
   var quitObserver = {
      QueryInterface: function(aIID) {
         if (aIID.equals(Components.interfaces.nsIObserver) || aIID.equals(Components.interfaces.nsISupports)) {
            return this;
         }
         throw Components.results.NS_NOINTERFACE;
      },
      observe: function(aSubject,aTopic,aData ) {
         current.console.logStringMessage("Topic: "+aTopic);
         // TODO: does this need to iterate all windows?
         var mainWindow = current._windowMediator.getMostRecentWindow("navigator:browser");
         var tabBrowser = mainWindow.getBrowser();
         for (var i=0; i<tabBrowser.tabContainer.itemCount; i++) {
            var tab = tabBrowser.tabContainer.getItemAtIndex(i);
            if (tab.linkedBrowser.contentWindow.helper && tab.linkedBrowser.contentWindow.helper.uitts) {
               try {
                  tab.linkedBrowser.contentWindow.helper.uitts.cancel();
               } catch (ex) {
               }
            }
         }
         var sidebar  = mainWindow.document.getElementById("sidebar");
         if (sidebar.contentWindow.location.href == "chrome://daisy/content/sidebar.xul") {
            if (sidebar.contentWindow.theSidebar && sidebar.contentWindow.theSidebar.tts) {
               sidebar.contentWindow.theSidebar.tts.cancel();
            }
            mainWindow.toggleSidebar();
         }
      }
   };

   setTimeout(function() {
      var mainWindow = current._windowMediator.getMostRecentWindow("navigator:browser");
      var tabBrowser = mainWindow.getBrowser();
      tabBrowser.tabContainer.addEventListener("TabSelect",current.tabListener,false);
      var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
      observerService.addObserver(quitObserver,"quit-application-requested",false);
   },2000);
}

DAISYOverlay.getInstance = function() {
   if (!DAISYOverlay.instance) {
      DAISYOverlay.instance = new DAISYOverlay();
   }
   return DAISYOverlay.instance;
}

DAISYOverlay.prototype.useCount = function() {
   return this.count++;
}

//TODO: Remove, this is old prototype code
DAISYOverlay.prototype.show = function() {
   var window = this.service.window;
   if (window) {
      window.focus();
   } else {
      this.console.logStringMessage("Cannot get DAISY player window.");
   }
}

DAISYOverlay.prototype.getSidebar = function() {
   var mainWindow = this._windowMediator.getMostRecentWindow("navigator:browser");
   var sidebar  = mainWindow.document.getElementById("sidebar");
   return sidebar.contentWindow.theSidebar;
}

DAISYOverlay.prototype.toggleSidebar = function() {
   var mainWindow = this._windowMediator.getMostRecentWindow("navigator:browser");

   mainWindow.toggleSidebar('openDaisySidebar');

   var sidebar  = mainWindow.document.getElementById("sidebar");
   var current = this;
   setTimeout(function() {
      if (sidebar.contentWindow.location.href=="chrome://daisy/content/sidebar.xul" && sidebar.contentWindow.theSidebar) {
         sidebar.contentWindow.theSidebar.onOpen();
      }
   },250);
}

DAISYOverlay.prototype.moveTo = function() {
   var mainWindow = this._windowMediator.getMostRecentWindow("navigator:browser");
   var sidebar  = mainWindow.document.getElementById("sidebar");
   if (sidebar.contentWindow.location.href!="chrome://daisy/content/sidebar.xul") {
      mainWindow.toggleSidebar('openDaisySidebar',true);
   }
   var current = this;
   setTimeout(function() {
      if (sidebar.contentWindow.theSidebar) {
         sidebar.contentWindow.theSidebar.focus();
      }
   },250);
}

DAISYOverlay.prototype.moveToBook = function() {
	var sidebar = this.getSidebar();
	if (sidebar) {
		sidebar.onMoveToContent();
	}
}

DAISYOverlay.prototype.createBooksMenu = function() {
	var booksMenu = document.getElementById("daisy-history-menu-popup");
	// If it has already been built, there's nothing too do
	if (booksMenu.hasChildNodes()) {
		return;
	} else {
		Sidebar.getInstance().populateBooksMenu();
	}	
}

DAISYOverlay.prototype.setVoiceMode = function(mode) {
   this.service.voicingMode = mode;
   this.service.voicingEnabled = true;
   this.console.logStringMessage("VoiceMode set to " + this.service.voicingMode);
   
   // Announce the mode
   this.uivoice.voiceMode(mode);
   
   var sidebar = this.getSidebar();
   if (sidebar && sidebar.getHelper()) {
	   sidebar.getHelper().initPlaybackWidgets();
	   sidebar.getHelper().initPagingWidgets();
   }
}

DAISYOverlay.prototype.onAudioSettings = function() {
   var current = this;
   var sidebar = this.getSidebar();
   var data = {
      debug: current.service.debug,
      voicingMode: current.service.voicingMode,
      soundNavigation: current.service.soundNavigation,
      cueSidebarOpen: current.service.cueSidebarOpen,
      onUpdate: function() {
         current.service.voicingMode = this.voicingMode;
         current.service.soundNavigation = this.soundNavigation;
         current.service.cueSidebarOpen = this.cueSidebarOpen;
         current.service.voicingEnabled = true;
         
         if (sidebar && sidebar.getHelper()) {
        	 sidebar.getHelper().initPlaybackWidgets();
        	 sidebar.getHelper().initPagingWidgets();
         }
      }
   }

   this.settingsWindow = window.openDialog("chrome://daisy/content/audio-settings.xul", 'daisy-settings', "chrome,resizable", data);
}

DAISYOverlay.prototype.onVoiceSettings = function() {
   var current = this;
   var data = {
      debug: current.service.debug,
      playbackPause: current.service.playbackPause,
      speechRate: {
         preferredRate: current.service.speechRate,
         hasTTS: current.service._tts ? true : false,
         unit: current.service._tts ? current.service._tts.rateUnit : null,
         rate: current.service._tts ? current.service._tts.rate : null,
         minimum: current.service._tts ? current.service._tts.minimumRate : null,
         normal: current.service._tts ? current.service._tts.normalRate : null,
         maximum: current.service._tts ? current.service._tts.maximumRate : null
      },
      onUpdate: function() {
         current.service.speechRate = this.speechRate.preferredRate;
         current.service.playbackPause = this.playbackPause;
      }
   };

   this.settingsWindow = window.openDialog("chrome://daisy/content/voice-settings.xul",'daisy-settings',"chrome,resizable",data);
}

DAISYOverlay.prototype.onAdvancedSettings = function() {
   var current = this;
   var data = {
      debug: current.service.debug,
      showImages: current.service.showImages,
      quirks: current.service.allowQuirks,
      useNarration: current.service.useNarration,
      onUpdate: function() {
         current.service.showImages = this.showImages;
         current.service.allowQuirks = this.quirks;
         current.service.useNarration = this.useNarration;
      }
   };

   this.settingsWindow = window.openDialog("chrome://daisy/content/advanced-settings.xul",'daisy-settings',"chrome,resizable",data);
}

/**
 * Add voicing hooks to the browser menus.
 */
DAISYOverlay.prototype.attachVoiceHandlers = function() {
   var current = this;
   var ffMenuBar = this.mainWindow.document.getElementById("main-menubar");
   this.uivoice.attachMenus(ffMenuBar);
}

DAISYOverlay.initialize = function() {
   var catManager = Components.classes["@mozilla.org/categorymanager;1"].getService(Components.interfaces.nsICategoryManager);
   catManager.addCategoryEntry("ext-to-type-mapping","opf","application/oebps-package+xml",false,true);
   catManager.addCategoryEntry("ext-to-type-mapping","ncx","application/x-dtbncx+xml",false,true);
   catManager.addCategoryEntry("ext-to-type-mapping","dtb","application/x-dtbook+xml",false,true);

   DAISYOverlay.getInstance().service.updateFlashSecurity();
   // test of handler
   //catManager.addCategoryEntry("ext-to-type-mapping","atom","application/vnd.mozilla.maybe.feed",false,true);
   
   DAISYOverlay.getInstance().attachVoiceHandlers();
}

