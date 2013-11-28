Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");
Console = {
   preferencesService: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("freetts."),
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

const CLASSID = Components.ID("{b88dd184-14c1-4430-a6b1-3b71b31f7348}");
const CLASSNAME = "A FreeTTS TTS Engine Factory";
const CONTRACTID = "@benetech.org/tts-engine-factory;1?name=freetts";

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

/*var components = [FreeTTSEngineFactory];
function NSGetModule(compMgr, fileSpec) {
    return XPCOMUtils.generateModule(components);
}*/

/**
* XPCOMUtils.generateNSGetFactory was introduced in Mozilla 2 (Firefox 4).
* XPCOMUtils.generateNSGetModule is for Mozilla 1.9.2 (Firefox 3.6).
*/
if (XPCOMUtils.generateNSGetFactory)
    var NSGetFactory = XPCOMUtils.generateNSGetFactory([FreeTTSEngineFactory]);
else
    var NSGetModule = XPCOMUtils.generateNSGetModule([FreeTTSEngineFactory]);


function FreeTTSEngineFactory() {

}

FreeTTSEngineFactory.prototype.QueryInterface = function(iid) {
    if (iid.equals(Components.interfaces.nsISupports) ||
        iid.equals(Components.interfaces.nsITTSEngineFactory) ||
        iid.equals(Components.interfaces.nsIClassInfo)) {
       return this;
    }
    throw Components.results.NS_ERROR_NO_INTERFACE;
};

FreeTTSEngineFactory.prototype.classDescription = CLASSNAME;
FreeTTSEngineFactory.prototype.classID = CLASSID;
FreeTTSEngineFactory.prototype.contractID = CONTRACTID;
FreeTTSEngineFactory.prototype.implementationLanguage = Components.interfaces.nsIProgrammingLanguage.JAVASCRIPT;
FreeTTSEngineFactory.prototype.flags = Components.interfaces.nsIClassInfo.DOM_OBJECT;
FreeTTSEngineFactory.prototype.getHelperForLanguage = function() { return null; }
FreeTTSEngineFactory.prototype.getInterfaces = function(countRef) {
   var interfaces = [Components.interfaces.nsITTSEngineFactory, Components.interfaces.nsIClassInfo, Components.interfaces.nsISupports];
   countRef.value = interfaces.length;
   return interfaces;
}

FreeTTSEngineFactory.prototype.priority = 0;
FreeTTSEngineFactory.prototype.name = "freetts";

FreeTTSEngineFactory.prototype.initialize = function() {
   if (this.tts) {
      return true;
   }

   var browser = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator).getMostRecentWindow("navigator:browser").getBrowser();
   this.java = browser.ownerDocument.defaultView.java;

   if (!this.java) {
      Console.log("Java is not available for freetts.");
      return false;
   }

   this.java.lang.System.setProperty("freetts.voices","com.sun.speech.freetts.en.us.cmu_us_kal.KevinVoiceDirectory");

   this.tts = new TTS();
   this.voice = "kevin16";
   if (this.tts.initialize(this.java)) {
      var test = this.tts.getContext(this.voice);
      if (!test) {
         Console.debug("Cannot load voice: "+this.voice);
      }
      return test!=null;
   } else {
      Console.debug("Could not initialize freeTTS engine.");
      return false;
   }
}

FreeTTSEngineFactory.prototype.isAvailable = function() {
   return this.java!=null && this.tts!=null && this.tts._engine!=null;
}

FreeTTSEngineFactory.prototype.createEngine = function() {
   return new FreeTTSEngine(this.tts,this.voice);
}

function FreeTTSEngine(tts,voiceName) {
   this.tts = tts;
   this.voiceName = voiceName;
   this.context = null;
   this.rate = 170;
   this.minimumRate = 80;
   this.normalRate = 170;
   this.maximumRate = 390;
   this.rateUnit = "wpm";
}

FreeTTSEngine.prototype.QueryInterface = function(iid) {
    if (iid.equals(Components.interfaces.nsISupports) ||
        iid.equals(Components.interfaces.nsITTSEngine)) {
       return this;
    }
    throw Components.results.NS_ERROR_NO_INTERFACE;
};

FreeTTSEngine.prototype.name = FreeTTSEngineFactory.prototype.name;

FreeTTSEngine.prototype.isSpeaking = function() {
   return this.context!=null && !this.context.isDone();
}

FreeTTSEngine.prototype.cancel = function() {
   if (this.context) {
      this.context.stop();
      this.context = null;
      this.cancelled = true;
   }
}

FreeTTSEngine.prototype.speak = function(text,callback) {
   this.cancelled = false;
   this.context = this.tts.getContext(this.voiceName);
   this.context.speak(text);
   if (callback) {
      var current = this;
      var checker = function() {
         try {
            if (!current.context || current.context.isDone()) {
               current.timer = null;
               callback.onFinish(this.cancelled);
            } else {
               current.timer = setTimeout(checker,50);
            }
         } catch (ex) {
            Console.log(ex);
            callback.onFinish(this.cancelled);
         }
      };
      checker();
   }
}


function packageLoader(java,urlStrings) {
    Console.debug("packageLoader {");

    var urlClass = (new java.net.URL("http://localhost/")).getClass();
    var toUrlArray = function(a) {
        var urlArray = java.lang.reflect.Array.newInstance(urlClass, a.length);
        for (var i = 0; i < a.length; i++) {
            var url = a[i];
            java.lang.reflect.Array.set(
                urlArray,
                i,
                (typeof url == "string") ? new java.net.URL(url) : url
            );
        }
        return urlArray;
    };

    var firefoxClassLoaderURL =
        new java.net.URL(
            getExtensionPath("daisy") +
            "java/javaFirefoxExtensionUtils.jar");

    Console.debug("classLoaderURL " + firefoxClassLoaderURL);

    //===== Stage 1. Prepare to Give All Permission to the Java Code to be Loaded =====

        /*
         *  Step 1. Load the bootstraping firefoxClassLoader.jar, which contains URLSetPolicy.
         *  We need URLSetPolicy so that we can give ourselves more permission.
         */
        var bootstrapClassLoader = java.net.URLClassLoader.newInstance(toUrlArray([ firefoxClassLoaderURL ]));
        Console.debug("created loader");

        /*
         *  Step 2. Instantiate a URLSetPolicy object from firefoxClassLoader.jar.
         */
        var policyClass = java.lang.Class.forName(
            "edu.mit.simile.javaFirefoxExtensionUtils.URLSetPolicy",
            true,
            bootstrapClassLoader
        );
        var policy = policyClass.newInstance();
        Console.debug("policy");

        /*
         *  Step 3. Now, the trick: We wrap our own URLSetPolicy around the current security policy
         *  of the JVM security manager. This allows us to give our own Java code whatever permission
         *  we want, even though Firefox doesn't give us any permission.
         */
        policy.setOuterPolicy(java.security.Policy.getPolicy());
        java.security.Policy.setPolicy(policy);
        Console.debug("set policy");

        /*
         *  Step 4. Give ourselves all permission. Yay!
         */
        policy.addPermission(new java.security.AllPermission());
        Console.debug("got all permissions");

        /*
         *  That's pretty much it for the security bootstraping hack. But we want to do a little more.
         *  We want our own class loader for subsequent JARs that we load.
         */


    //===== Stage 2. Create Our Own Class Loader so We Can Do Things Like Tracing Class Loading =====

        /*
         *  Reload firefoxClassLoader.jar and so we can make use of TracingClassLoader. We
         *  need to reload it because when it was loaded previously, we had not yet set the policy
         *  to give it enough permission for loading classes.
         */

        policy.addURL(firefoxClassLoaderURL);
        Console.debug("added url");

        var urlClassLoader = java.net.URLClassLoader.newInstance(toUrlArray([ firefoxClassLoaderURL ]));
        Console.debug("url class loader: "+urlClassLoader);
        var firefoxClassLoaderPackages = new WrappedPackages(java,urlClassLoader);
        Console.debug("wrapped loader");

        var tracingClassLoaderClass =
            firefoxClassLoaderPackages.getClass("edu.mit.simile.javaFirefoxExtensionUtils.TracingClassLoader");
        Console.debug("got class");

        var classLoader = tracingClassLoaderClass.m("newInstance")(Console._debug);
        Console.debug("got new loader: "+classLoader);

    //===== Stage 3. Actually Load the Code We Were Asked to Load =====

        var urls = toUrlArray(urlStrings);

        /*
         *  Give it the JARs we were asked to load - should now load them with
         *  all permissions.
         */
        classLoader.add(firefoxClassLoaderURL);

        for (var i = 0; i < urls.length; i++) {
            var url = java.lang.reflect.Array.get(urls, i);
            classLoader.add(url);
            policy.addURL(url);
        }
        Console.debug("added urls");
        java.lang.Thread.currentThread().setContextClassLoader(classLoader);
        Console.debug("set context");

        /*
         *  Wrap up the class loader and return
         */
        var packages = new WrappedPackages(java,classLoader);
        Console.debug("wrapped");

        Console.debug("} packageLoader");

        return packages;
};

/*
 *  Wraps a class loader and allows easy access to the classes that it loads.
 */
function WrappedPackages(java,classLoader) {
    var packages = classLoader.loadClass("edu.mit.simile.javaFirefoxExtensionUtils.Packages").newInstance();

    var objectClass = (new java.lang.Object()).getClass();
    var argumentsToArray = function(args) {
        var a = java.lang.reflect.Array.newInstance(objectClass, args.length);
        for (var i = 0; i < args.length; i++) {
            java.lang.reflect.Array.set(a, i, args[i]);
        }
        return a;
    }

    this.getClass = function(className) {
        var classWrapper = packages.getClass(className);
        if (classWrapper) {
            return {
                n : function() {
                    return classWrapper.callConstructor(argumentsToArray(arguments));
                },
                f : function(fieldName) {
                    return classWrapper.getField(fieldName);
                },
                m : function(methodName) {
                    return function() {
                        return classWrapper.callMethod(methodName, argumentsToArray(arguments));
                    };
                }
            };
        } else {
            return null;
        }
    };

    this.setTracing = function(enable) {
        classLoader.setTracing((enable) ? true : false);
    };
}


function TTS() {
    /*
     *  This is a XPCOM-in-Javascript trick: Clients using an XPCOM
     *  implemented in Javascript can access its wrappedJSObject field
     *  and then from there, access its Javascript methods that are
     *  not declared in any of the IDL interfaces that it implements.
     *
     *  Being able to call directly the methods of a Javascript-based
     *  XPCOM allows clients to pass to it and receive from it
     *  objects of types not supported by IDL.
     */
    this.wrappedJSObject = this;
    
    this._initialized = false;
    this._packages = null;
}

/*
 *  nsISupports.QueryInterface
 */
TTS.prototype.QueryInterface = function(iid) {
    /*
     *  This code specifies that the component supports 2 interfaces:
     *  nsIHelloWorld and nsISupports.
     */
    if (!iid.equals(Components.interfaces.nsISupports)) {
        throw Components.results.NS_ERROR_NO_INTERFACE;
    }
    return this;
};

/*
 *  Initializes this component, including loading JARs.
 */
TTS.prototype.initialize = function (java) {
    if (this._initialized) {
        Console.log("TTS.initialize already called before");
        return true;
    }
    
    this._traceFlag = (Console._debug);
    
    Console.debug("TTS.initialize {");
    try {
        var extensionPath = getExtensionPath("daisy");

        Console.debug("Extension path: "+extensionPath);
        /*
         *  Enumerate URLs to our JARs and class directories
         */
        var javaPath = extensionPath + "java/";
        var jarFilepaths = [
            javaPath + "classes/", // our own classes, compiled from java-firefox-extension/src
            javaPath + "lib/freetts.jar",    // free tts
            javaPath + "lib/cmu_us_kal.jar", // free tts
            javaPath + "lib/cmudict04.jar",  // free tts
            javaPath + "lib/cmulex.jar",     // free tts
            javaPath + "lib/cmutimelex.jar", // free tts
            javaPath + "lib/en_us.jar"       // free tts
        ];
        this._packages = packageLoader(java,jarFilepaths, this._traceFlag);
        
        /*
         *  Test out a static method
         */
        /*
        this._trace("Greetings: " + 
            this._packages.getClass("edu.mit.simile.javaFirefoxExtension.Test").m("getGreetings")()
        );*/
        
        /*
         *  Create a sample Java object
         */
        this._engine = this._packages.getClass("org.benetech.daisyfox.tts.TTSEngine").n();
        Console.debug("_engine="+this._engine);
         
        this._initialized = true;
    } catch (e) {
        Console.debug(e);
    }
    Console.debug("} TTS.initialize");
    
    return this._initialized;
};

/*
 *  Returns the Test object instantiated by default.
 */
TTS.prototype.getContext = function(voiceName) {
    //this._trace("TTS.getContext");
    return this._engine.getContext(voiceName);
};


/*
 *  Get the file path to the installation directory of this 
 *  extension.
 */
function getExtensionPath(extensionName) {
    var chromeRegistry =
        Components.classes["@mozilla.org/chrome/chrome-registry;1"]
            .getService(Components.interfaces.nsIChromeRegistry);
            
    var uri =
        Components.classes["@mozilla.org/network/standard-url;1"]
            .createInstance(Components.interfaces.nsIURI);
    
    uri.spec = "chrome://" + extensionName + "/content/";
    
    var path = chromeRegistry.convertChromeURL(uri);
    if (typeof(path) == "object") {
        path = path.spec;
    }

    //this._trace(path);
    
    path = path.substring(0, path.indexOf("/content/") + 1);
    
    return path;
};
    
/*
 *  Retrieve the file path to the user's profile directory.
 *  We don't really use it here but it might come in handy
 *  for you.
 */
TTS.prototype._getProfilePath = function() {
    var fileLocator =
        Components.classes["@mozilla.org/file/directory_service;1"]
            .getService(Components.interfaces.nsIProperties);
    
    var path = escape(fileLocator.get("ProfD", Components.interfaces.nsIFile).path.replace(/\\/g, "/")) + "/";
    if (path.indexOf("/") == 0) {
        path = 'file://' + path;
    } else {
        path = 'file:///' + path;
    }
    
    return path;
};

function setTimeout(handler,delay) {
    var timer = Components.classes["@mozilla.org/timer;1"].createInstance().QueryInterface(Components.interfaces.nsITimer);
    timer.initWithCallback(handler,delay,0);
    return timer;
}

function clearTimeout(timer) {
   timer.cancel();
}


