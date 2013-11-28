
const TYPE_ANY = "*/*";

const OPF_CLASSID = Components.ID("{38abb30a-73fe-4e3d-9154-30acb5474480}");
const OPF_CLASSNAME = "Open e-Book Packaging Stream Converter";
const TYPE_OPF = "application/oebps-package+xml";

const NCX_CLASSID = Components.ID("{86aaefd3-4f84-4e34-a18d-33b00f32cc87}");
const NCX_CLASSNAME = "DAISY Navigation Control Stream Converter";
const TYPE_NCX = "application/x-dtbncx+xml";

const DTB_CLASSID = Components.ID("{d1150440-1cc4-460d-ab26-fb779520ca35}");
const DTB_CLASSNAME = "DAISY DTBook Stream Converter";
const TYPE_DTB = "application/x-dtbook+xml";

Console = {
   preferencesService: Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("daisy.converter."),
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


/**
 * The XMLContentHandler is an XPCOM that implements SAXContentHandler and SAXErrorHandler
 * to load an XML data stream into a DOM.
 */

function XMLContentHandler() {
   this.level = -1;
}

XMLContentHandler.prototype.QueryInterface =  function(iid) {
    if (iid.equals(Components.interfaces.nsISAXContentHandler) ||
        iid.equals(Components.interfaces.nsISAXErrorHandler) ||
        iid.equals(Components.interfaces.nsISupports))
      return this;
    throw Components.results.NS_ERROR_NO_INTERFACE;
}

XMLContentHandler.prototype.startDocument = function() {
   this.level++;
   this.prefixes = {};
   //Console.log("Starting document.");
   try {
      this.document = Components.classes["@mozilla.org/xml/xml-document;1"].createInstance(Components.interfaces.nsIDOMXMLDocument);
      this.parent = this.document;
   } catch (ex) {
      Console.log(ex);
   }
}
XMLContentHandler.prototype.endDocument = function() {
   this.level--;
}


XMLContentHandler.prototype.startElement = function(ns ,localName ,qName ,attributes) {
   this.level++;
   //Console.log("Starting element {"+uri+"}"+localName);

   /**
    * Create the element
    */
   try {
      var child = this.document.createElementNS(ns,qName);
      this.parent.appendChild(child);
      this.parent = child;
      for (var i=0; i<attributes.length; i++) {
         var attQName = attributes.getQName(i);
         var attValue = attributes.getValue(i);
         var attNS    = attributes.getURI(i);
         if (attNS) {
            this.parent.setAttributeNS(attNS,attQName,attValue);
         } else {
            this.parent.setAttribute(attQName,attValue);
         }
      }
   } catch (ex) {
      Console.log(ex);
   }

   /**
    * Add the namespace declarations gotten from startPrefixMapping
    */
   for (var prefix in this.prefixes) {
      var uri = this.prefixes[prefix];
      try {
         if (!prefix || prefix.length==0) {
            this.parent.setAttribute("xmlns",uri);
         } else {
            this.parent.setAttributeNS("http://www.w3.org/2000/xmlns/","xmlns:"+prefix,uri);
         }
      } catch (ex) {
         Console.log(ex);
      }
   }
   /**
    * reset the prefixes
    */
   this.prefixes = {};
}

XMLContentHandler.prototype.endElement = function(uri ,localName ,qName) {
   this.level--;

   try {
      this.parent = this.parent.parentNode;
   } catch (ex) {
      Console.log(ex);
   }
}

XMLContentHandler.prototype.startPrefixMapping = function(prefix ,uri) {
   this.prefixes[prefix] = uri;
}
XMLContentHandler.prototype.endPrefixMapping = function(prefix) {

}
XMLContentHandler.prototype.characters = function(value) {
   if (this.level>0) {
      try {
         this.parent.appendChild(this.document.createTextNode(value));
      } catch (ex) {
         Console.log(ex);
      }
   }
}
XMLContentHandler.prototype.ignorableWhitespace = function(whitespace) {
   if (this.level>0) {
      try {
         this.parent.appendChild(this.document.createTextNode(whitespace));
      } catch (ex) {
         Console.log(ex);
      }
   }
}
XMLContentHandler.prototype.processingInstruction = function(target ,data) {
   if (this.level>0) {
      try {
         this.parent.appendChild(this.document.createProcessingInstruction(target,data));
      } catch (ex) {
         Console.log(ex);
      }
   }
}



XMLContentHandler.prototype.error = function(locator ,error ) {
   //throw locator.systemId+" at line "+locator.lineNumber+", column "+locator.columnNumber+" : "+error;
   throw error;
}
XMLContentHandler.prototype.fatalError = function(locator , error ) {
   //throw locator.systemId+" at line "+locator.lineNumber+", column "+locator.columnNumber+" : "+error;
   throw error;
}
XMLContentHandler.prototype.ignorableWarning = function(locator , error ) {
   Console.log(error);
   //Console.log(locator.systemId+" at line "+locator.lineNumber+", column "+locator.columnNumber+" : "+error );
}

/**
 * The generic converter handles the basics of getting data
 * synchronously or asynchronously
 */
function GenericConverter() {
   this.handler = new XMLContentHandler();
   this.reader = Components.classes["@mozilla.org/saxparser/xmlreader;1"].createInstance(Components.interfaces.nsISAXXMLReader);
   this.reader.contentHandler = this.handler;
   this.reader.errorHandler = this.handler;
}

GenericConverter.prototype.QueryInterface = function(iid) {
    if (iid.equals(Components.interfaces.nsIStreamConverter) ||
        iid.equals(Components.interfaces.nsIStreamListener) ||
        iid.equals(Components.interfaces.nsIRequestObserver)||
        iid.equals(Components.interfaces.nsISupports))
      return this;
    throw Cr.NS_ERROR_NO_INTERFACE;
}

GenericConverter.prototype.parseCharset = function(type) {
   var pos = type.indexOf(';');
   if (pos<0) {
      return;
   }
   pos = type.indexOf("charset=",pos+1);
   if (pos>0) {
      var end = type.indexOf(";",pos);
      this.charset = end<0 ? type.substring(pos+8) : type.substring(pos+8,end);
   }
}

/**
* See nsIRequestObserver.idl
*/
GenericConverter.prototype.onStartRequest = function(request, context) {
   this.request = request;
   try {
      var channel = request.QueryInterface(Components.interfaces.nsIChannel);
      if (channel.contentCharset) {
         Console.debug("Channel has charset property: "+channel.contentCharset)
         this.charset = channel.contentCharset;
      }
      this.uri = channel.URI;
      channel.contentType = this.sourceType;
   } catch (ex) {
      
   }
   if (this.uri) {
      this.reader.baseURI = this.uri;
   }
   this.reader.parseAsync(null);
   this.reader.onStartRequest(request,context);

   Console.debug(this.sourceType+": Start.");
}

/**
* See nsIRequestObserver.idl
*/
GenericConverter.prototype.onStopRequest = function(request, context, status) {
   try {
      this.reader.onStopRequest(request,context,status);
   } finally {
      this.reader = null;
   }
   Console.debug(this.sourceType+": Stop, status="+status);
   this.status = status;
   this.onComplete();
}

/**
* See nsIStreamListener.idl
*/
GenericConverter.prototype.onDataAvailable = function(request, context, inputStream,sourceOffset, count) {
  this.reader.onDataAvailable(request,context,inputStream,sourceOffset,count);
}

/**
* See nsIStreamConverter.idl
*/
GenericConverter.prototype.asyncConvertData = function(sourceType, destinationType, listener, context) {
   this.parseCharset(sourceType);
   this.listener = listener;
   Console.debug(this.sourceType+": asyncConvertData "+sourceType+", charset="+this.charset);
}

/**
* See nsIStreamConverter.idl
*/
GenericConverter.prototype.convert = function(sourceStream, sourceType, destinationType,context) {
   this.parseCharset(sourceType);
   this.reader.parseFromStream(sourceStream,this.charset,"application/xml");
   Console.debug(this.sourceType+": convert "+sourceType+", charset="+this.charset+", data.length="+this.data.length);
}

/**
* See nsIStreamConverter.idl
*/
GenericConverter.prototype.canConvert = function(sourceType, destinationType) {
   Console.debug(this.sourceType+": canConvert "+sourceType+" -> "+destinationType);
   // We only support one conversion.
   return destinationType == TYPE_ANY && sourceType==this.sourceType;
}

/**
 * Loads an OPF document into a DOM and launches the book rendering.
 */
OPFConverter.prototype = new GenericConverter();
OPFConverter.prototype.constructor = OPFConverter;
function OPFConverter() {
   this.sourceType = TYPE_OPF;
   this.charset = "UTF-8";
}

OPFConverter.prototype.onComplete = function() {
   /**
    * Do nothing if the document didn't load (e.g. an XML error)
    */
   if (this.status!=Components.results.NS_OK) {
      return;
   }

   Console.debug(this.sourceType+": Loaded complete!");
   if (Console._debug) {
      var serializer = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].createInstance().QueryInterface(Components.interfaces.nsIDOMSerializer);
      Console.debug(serializer.serializeToString(this.handler.document));
   }

   /**
    * Get the DAISY service.
    */
   var theClass = Components.classes["@benetech.org/daisy;1"];
   var theComponent = theClass.getService(Components.interfaces.nsISupports);
   var service = theComponent.wrappedJSObject;

   /**
    * remove the fragment identifier, query, etc. from the URI
    */
   var mapURI = this.uri.spec;
   var hash = mapURI.indexOf("#");
   if (hash>0) {
      mapURI = mapURI.substring(0,hash);
   }

   /**
    * Create the book object and map it to the URI
    */
   Console.debug("Creating book for "+mapURI);
   var book = service.newBook(mapURI);
   Console.debug("Loading opf for "+mapURI);

   /*
    * load the packaging
    */
   book.loadPackaging(this.handler.document,mapURI);

   /**
    * record the book view event
    */
   service.database.bookViewed(book.title=="" ? null : book.title,this.uri.spec);

   
   /**
    * Open the opf-document.xhtml file to start rendering.
    */
   
      var id = "{6be5ef88-4289-44d1-81f2-097313ed640b}";
      var ioService=Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
      var chromeChannel = ioService.newChannel("chrome://daisy/content/opf-document.xhtml", null, null);
      chromeChannel.originalURI= this.uri;
      chromeChannel.loadGroup = this.request.loadGroup;
      chromeChannel.asyncOpen(this.listener, null);
}

/**
 * Loads an NCX document and attempts to find the OPF document.
 */
NCXConverter.prototype = new GenericConverter();
NCXConverter.prototype.constructor = NCXConverter;
function NCXConverter() {
   this.sourceType = TYPE_NCX;
   this.charset = "UTF-8";
}

NCXConverter.prototype.onComplete = function() {
   /**
    * Do nothing if the document didn't load (e.g. an XML error)
    */
   if (this.status!=Components.results.NS_OK) {
      return;
   }
   Console.log(this.sourceType+": Loaded complete!");

   /**
    * Get the DAISY service
    */
   var theClass = Components.classes["@benetech.org/daisy;1"];
   var theComponent = theClass.getService(Components.interfaces.nsISupports);
   var service = theComponent.wrappedJSObject;

   /**
    * Calculate the OPF document URI from the NCX URI
    */
   var opfURL = this.uri.spec;
   var pos = opfURL.length-1;
   for (; pos>0 && opfURL.charAt(pos)!='.' && opfURL.charAt(pos)!='/'; pos--);
   if (opfURL.charAt(pos)=='.') {
      opfURL = opfURL.substring(0,pos)+".opf";
   } else {
      opfURL = opfURL+".opf";
   }

   /**
    * Attemp to synchronously read the OPF document.
    */
   var opfDoc = null;
   HTTP("GET",opfURL,{
      synchronizedRequest: true,
      overrideMimeType: "text/xml",
      onSuccess: function(status,doc) {
         opfDoc = doc;
      },
      onFailure: function(status,doc) {
         Console.log("Cannot load OPF document "+opfURL+", status="+status);
      }
   });
   if (!opfDoc) {
      Console.log("No packaging document at "+opfURL+", rendering content.");
   } else {
      Console.log("Packaging loaded from "+opfURL);

      /**
       * We've found the OPF document
       */
      var mapURI = this.uri.spec;
      var hash = mapURI.indexOf("#");
      if (hash>0) {
         mapURI = mapURI.substring(0,hash);
      }

      /**
       * Construct the book and map the URI
       */
      Console.debug("Creating book for "+mapURI);
      var book = service.newBook(mapURI);
      /*
       * load the packaging
       */
      book.loadPackaging(opfDoc,opfURL);
      /*
       * load the navigation from the NCX that we've already loaded
       */
      book.loadNavigationFromDocument(this.handler.document);

      /*
       * record the book view event
       */
      service.database.bookViewed(book.title=="" ? null : book.title,mapURI);

      /*
       * get the real path of the opf-document.xhtml
       */
      
      var id = "{6be5ef88-4289-44d1-81f2-097313ed640b}";
      var ioService=Components.classes["@mozilla.org/network/io-service;1"].getService  (Components.interfaces.nsIIOService);
      var chromeChannel = ioService.newChannel("chrome://daisy/content/opf-document.xhtml", null, null);
      chromeChannel.originalURI= this.uri;
      chromeChannel.loadGroup = this.request.loadGroup;
      chromeChannel.asyncOpen(this.listener, null);
   }
}

/**
 * Loads an DTBook document and attempts to find the OPF document.
 */
DTBConverter.prototype = new GenericConverter();
DTBConverter.prototype.constructor = DTBConverter;
function DTBConverter() {
   this.sourceType = TYPE_DTB;
   this.charset = "UTF-8";
}

DTBConverter.prototype.onComplete = function() {
   /**
    * Do nothing if the document didn't load (e.g. an XML error)
    */
   if (this.status!=Components.results.NS_OK) {
      return;
   }
   Console.log(this.sourceType+": Loaded complete!");

   /*
    * get the DAISY service
    */
   var theClass = Components.classes["@benetech.org/daisy;1"];
   var theComponent = theClass.getService(Components.interfaces.nsISupports);
   var service = theComponent.wrappedJSObject;

   /*
    * calculate the OPF document URL
    */
   var opfURL = this.uri.spec;
   var pos = opfURL.length-1;
   for (; pos>0 && opfURL.charAt(pos)!='.' && opfURL.charAt(pos)!='/'; pos--);
   if (opfURL.charAt(pos)=='.') {
      opfURL = opfURL.substring(0,pos)+".opf";
   } else {
      opfURL = opfURL+".opf";
   }
   /*
    * get the OPF document synchronously
    */
   var opfDoc = null;
   HTTP("GET",opfURL,{
      synchronizedRequest: true,
      overrideMimeType: "text/xml",
      onSuccess: function(status,doc) {
         opfDoc = doc;
      },
      onFailure: function(status,doc) {
         Console.log("Cannot load OPF document "+opfURL+", status="+status);
      }
   });
   if (!opfDoc) {
      Console.log("No packaging document at "+opfURL+", rendering content.");
   } else {
      Console.log("Packaging loaded from "+opfURL);

      /*
       * We've found the OPF document
       */

      var mapURI = this.uri.spec;
      var hash = mapURI.indexOf("#");
      if (hash>0) {
         mapURI = mapURI.substring(0,hash);
      }

      /*
       * Create the book and map it to the URI
       */
      Console.debug("Creating book for "+mapURI);
      var book = service.newBook(mapURI);
      /*
       * Load the packaging
       */
      book.loadPackaging(opfDoc,opfURL);

      /*
       * Cache the loaded DTBook instance
       */
      book.dtbook = this.handler.document;

      /*
       * record the book view event
       */
      service.database.bookViewed(book.title=="" ? null : book.title,mapURI);

      /*
       * get the real path of the opf-document.xhtml
       */
      
      var id = "{6be5ef88-4289-44d1-81f2-097313ed640b}";
      var ioService=Components.classes["@mozilla.org/network/io-service;1"].getService   (Components.interfaces.nsIIOService);
      var chromeChannel = ioService.newChannel("chrome://daisy/content/opf-document.xhtml", null, null);
      chromeChannel.originalURI = this.uri;
      chromeChannel.loadGroup = this.request.loadGroup;
      chromeChannel.asyncOpen(this.listener, null);
   }
}

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


var Module = {
  QueryInterface: function M_QueryInterface(iid) {
    if (iid.equals(Components.interfaces.nsIModule) ||
        iid.equals(Components.interfaces.nsISupports))
      return this;
    throw Components.results.NS_ERROR_NO_INTERFACE;
  },

  getClassObject: function M_getClassObject(cm, cid, iid) {
    if (!iid.equals(Components.interfaces.nsIFactory))
      throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

    if (cid.equals(OPF_CLASSID))
      return new GenericComponentFactory(OPFConverter);
    if (cid.equals(NCX_CLASSID))
      return new GenericComponentFactory(NCXConverter);
    if (cid.equals(DTB_CLASSID))
      return new GenericComponentFactory(DTBConverter);

    throw Components.results.NS_ERROR_NO_INTERFACE;
  },

  registerSelf: function M_registerSelf(cm, file, location, type) {
    var cr = cm.QueryInterface(Components.interfaces.nsIComponentRegistrar);

    /*
     * Each stream converter is registered to a media type.  The from= part
     * is the media type we're registering to handle.  The to is the any type
     * because we're going to always handle the resulting document.
     *
     * The registration is mapped to a class name.  For each of these classes
     * we register an XPCOM by class id.  The getClassObject() method of this
     * module then returns the component factory for that XPCOM.
     *
     */
    const converterPrefix = "@mozilla.org/streamconv;1?from=";
    var converterContractID =
        converterPrefix + TYPE_OPF + "&to=" + TYPE_ANY;
    cr.registerFactoryLocation(OPF_CLASSID, OPF_CLASSNAME, converterContractID,
                               file, location, type);

    converterContractID =
        converterPrefix + TYPE_NCX + "&to=" + TYPE_ANY;
    cr.registerFactoryLocation(NCX_CLASSID, NCX_CLASSNAME, converterContractID,
                               file, location, type);

    converterContractID =
        converterPrefix + TYPE_DTB + "&to=" + TYPE_ANY;
    cr.registerFactoryLocation(DTB_CLASSID, DTB_CLASSNAME, converterContractID,
                               file, location, type);

  },

  unregisterSelf: function M_unregisterSelf(cm, location, type) {
  },

  canUnload: function M_canUnload(cm) {
    return true;
  }
};

function NSGetFactory(cid) {
return Module.getClassObject(null,cid,Components.interfaces.nsIFactory);
}
