function DAISYBook() {
   this.uris = {};
   this.metadata = {};
   this.xmetadata = {};
   this.manifest = {};
   this.spine = [];
   this.refCount = 0;
   this._quirky = false;
   this.onDestroy = function() {

   }
}

DAISYBook.prototype.isLocal = function() {
   var uri = this.uris["opf"];
   return uri ? uri.substring(0,5)=="file:" : false;
}


DAISYBook.prototype.ref = function() {
}

DAISYBook.prototype.unref = function() {
   if (this.refCount>0) {
      this.refCount--;
      if (this.refCount==0) {
         this.onDestroy();
      }
   }
}

DAISYBook.extensions = {
   ncx: {
      mediaType: "application/x-dtbncx+xml",
      namespace: "http://www.daisy.org/z3986/2005/ncx/"
   },
   opf: {
      mediaType: "application/oebps-package+xml",
      namespace: "http://openebook.org/namespaces/oeb-package/1.0/"
   },
   xml: {
      mediaType: "application/x-dtbook+xml",
      namespace: "http://www.daisy.org/z3986/2005/dtbook/"
   },
   smil: {
      mediaType: "application/smil+xml",
      namespace: "http://www.w3.org/2001/SMIL20/"
   },
   xsl: {
      mediaType: "application/xslt+xml"
   },
   css: {
      mediaType: "text/css"
   },
   _unknown: {
      mediaType: "application/octet-stream"
   }
}

DAISYBook.prototype.init = function() {
}

DAISYBook.prototype.__defineGetter__("title",function() {
   var date = this.metadata["Date"];
   var type = this.xmetadata["Publication.Type"];
   if (type=="Newspaper" || type=="Magazine") {
      return this.metadata["Title"]+", "+date;
   } else {
      return this.metadata["Title"];
   }
});

DAISYBook.prototype.__defineGetter__("quirky",function() {
   return this.navigation ? this.navigation.quirky || this._quirky : this._quirky;
});

DAISYBook.prototype.findByMediaType = function(mediaType) {
   for (var id in this.manifest) {
      var entry = this.manifest[id];
      if (entry.mediaType==mediaType) {
         return entry;
      }
   }
}

DAISYBook.prototype.findByExtension = function(extension) {
   var test = new RegExp("."+extension+"$");
   var compare = "."+extension;
   for (var id in this.manifest) {
      var entry = this.manifest[id];
      if (entry.href.match(test)==compare) {
         return entry;
      }
   }
}

DAISYBook.prototype.loadPackaging = function(opfDocument,baseURI) {

   if (baseURI) {
      this.uris["opf"] = baseURI;
   }
   // Load metadata from opf file
   var util = DOMUtil.getInstance();
   var current = this;

   this.metadata = {};
   this.xmetadata = {};
   this.manifest = {};
   this.spine = [];

   util.forChildNS(opfDocument.documentElement,"metadata","http://openebook.org/namespaces/oeb-package/1.0/",function(metadata) {
      util.forChildNS(metadata,"dc-metadata","http://openebook.org/namespaces/oeb-package/1.0/",function(dcmetadata) {
         util.forChildNS(dcmetadata,null,"http://purl.org/dc/elements/1.1/",function(dc) {
            current.metadata[dc.localName] = dc.textContent;
            DAISYService.console.debug("metadata["+dc.localName+"] = "+dc.textContent);
         });
         util.forChildNS(dcmetadata,null,"http://purl.org/dc/elements/1.0/",function(dc) {
            current.metadata[dc.localName] = dc.textContent;
            DAISYService.console.debug("metadata["+dc.localName+"] = "+dc.textContent);
         });
      });
      util.forChildNS(metadata,"x-metadata","http://openebook.org/namespaces/oeb-package/1.0/",function(xmetadata) {
         util.forChildNS(xmetadata,"meta","http://openebook.org/namespaces/oeb-package/1.0/",function(meta) {
            var name = meta.getAttribute("name");
            if (name) {
               var content =  meta.getAttribute("content");
               current.xmetadata[name] = content;
               DAISYService.console.debug("xmetadata["+name+"] = "+content);
            }
         });
      });
   });

   util.forChildNS(opfDocument.documentElement,"manifest","http://openebook.org/namespaces/oeb-package/1.0/",function(manifest) {
      util.forChildNS(manifest,"item","http://openebook.org/namespaces/oeb-package/1.0/",function(item) {
         var o = {
            id: item.getAttribute("id"),
            mediaType: item.getAttribute("media-type"),
            href: item.getAttribute("href"),
            resolve: function() {
               var suri = current.uris["opf"];
               if (suri) {
                  var baseURI = new URI(suri);
                  return baseURI.resolve(this.href);
               } else {
                  return this.href;
               }
            }
         };
         current.manifest[o.id] = o;
      });
   });

   util.forChildNS(opfDocument.documentElement,"spine","http://openebook.org/namespaces/oeb-package/1.0/",function(spine) {
      util.forChildNS(spine,"itemref","http://openebook.org/namespaces/oeb-package/1.0/",function(itemref) {
         current.spine.push(itemref.getAttribute("idref"));
      });
   });
}

DAISYBook.prototype.isValid = function() {
   //var ncx = this.findByMediaType("application/x-dtbncx+xml");
   var dtbook = this.findByMediaType("application/x-dtbook+xml");
   return dtbook!=null;
}

DAISYBook.prototype.loadNavigation = function(force) {
   if (this.navigation && !force) {
      return this.navigation;
   }
   var entry = this.findByMediaType("application/x-dtbncx+xml");
   if (entry==null) {
      return null;
   }

   var xmlDoc = null;
   var url = entry.resolve();
   DAISYService.console.debug("Loading navigation "+url.spec);
   HTTP("GET",url.spec,{
      synchronizedRequest: true,
      overrideMimeType: "text/xml",
      onSuccess: function(status,doc) {
         xmlDoc = doc;
      },
      onFailure: function(status,doc) {
         DAISYService.console.log("Cannot load XML document "+url.spec+", status="+status);
      }
   });
   if (!xmlDoc) {
      throw "Cannot load XML document "+uri.spec+" from book.";
   }

   return this.loadNavigationFromDocument(xmlDoc);
}

DAISYBook.prototype.loadNavigationFromDocument = function(xmlDoc) {
   this.navigation = DAISYNavigationControl.load(xmlDoc);
   this._quirky = this.navigation.quirky || this._quirky;
   return this.navigation;
}


DAISYBook.prototype.removeNotes = function(notes) {
   for (var i=0; i<notes.length; i++) {
      var notePoint = notes[i].point;
      if (notePoint) {
         var parent = notePoint.parent;
         if (parent) {
            // remove the point from the navigation
            for (var j=0; j<parent.children.length; j++) {
               if (parent.children[j]==notes[i]) {
                  parent.children.splice(j,1);
                  break;
               }
            }
         }
      }
   }
}

DAISYBook.prototype.removeNote = function(note) {
   var parent = note.point.parent;
   if (note.point.next) {
      note.point.next.previous = note.point.previous;
   }
   if (note.point.previous) {
      note.point.previous.next = note.point.next;
   }
   for (var i=0; i<parent.children.length; i++) {
      if (parent.children[i]==note.point) {
         parent.children.splice(i,1);
         break;
      }
   }

}

DAISYBook.prototype.addNotes = function(notes,comparator) {
   DAISYService.console.debug("updating notes on book "+this.title);
   if (this.navigation && comparator && this.navigation.navMap.children.length>0) {
      DAISYService.console.debug("Adding notes to navigation.");
      for (var i=0; i<notes.length; i++) {
         this.addNote(notes[i],comparator);
      }
   }
}

DAISYBook.prototype.addNote = function(note,comparator) {
   DAISYService.console.debug("note: "+note.id+", "+note.name);
   var point = this.navigation.navMap.children[0];
   while (point.parent && comparator(point,note)<0) {
      DAISYService.console.debug("At "+point.content.id);
      if (point.children.length>0) {
         point = point.children[0];
      } else if (point.next) {
         point = point.next;
      } else {
         while (point.parent && !point.next) {
            point = point.parent;
         }
         if (point.next) {
            point = point.next;
         }
      }
   }
   DAISYService.console.debug("point: "+point.content.id);
   if (point==this.navigation.navMap) {
      point = this.navigation.navMap.children[0];
   }

   var newPoint = new DAISYNavigationPoint(point.parent);
   newPoint.labels.push({
      text: "Note: "+note.name
   });
   newPoint.className = "note";
   newPoint.note = note;
   newPoint.content.id = "daisy-user-note-ref-"+note.id;

   // insert just before item
   for (var c=0; c<point.parent.children.length; c++) {
      if (point.parent.children[c]==point) {
         point.parent.children.splice(c,0,newPoint)
         if (c>0) {
            point.parent.children[c-1].next = newPoint;
            newPoint.previous = point.parent.children[c-1];
         }
         if ((c+1)<point.parent.children.length){
            point.parent.children[c+1].previous = newPoint;
            newPoint.next = point.parent.children[c+1];
         }
         //DAISYService.console.log("Note "+note.id+" previous: "+(newPoint.previous ? newPoint.previous.content.id : null));
         //DAISYService.console.log("Note "+note.id+" next: "+(newPoint.next ? newPoint.next.content.id : null));
         break;
      }
   }
   note.point = newPoint;
}

// TODO: This object also gets a XUL TreeItem attached to it by Sidebar.addNavigationPoint.
// If we want to keep that design, we should provide behavior to get at specific parts of the TreeView
// structure that are needed, so that we don't need code like 'item.firstChild.firstChild.getAttribute('foo')'.
function DAISYNavigationPoint(parent) {
   this.parent = parent;
   this.labels = [];
   this.next = null;
   this.previous = null;
   this.content = {};
   this.children = [];
   this.smilId = null;
}

function DAISYNavigationControl() {
   this.tests = {};
   this.metadata = {};
   this.title = {};
   this.authors = [];
   this.pages = {};
   this.pages.info = [];
   this.pages.labels = [];
   this.pages.list = [];
   this.navList = {};
   this.navList.info = [];
   this.navList.labels = [];
   this.navList.list = [];
   this.navMap = new DAISYNavigationPoint();
}

DAISYNavigationControl.NS = "http://www.daisy.org/z3986/2005/ncx/";

DAISYNavigationControl.allowQuirks = true;

DAISYNavigationControl.load = function(ncxDocument,allowQuirks) {
   var ncx = new DAISYNavigationControl();
   var util = DOMUtil.getInstance();
   var quirks = DAISYNavigationControl.allowQuirks || allowQuirks;
   if (ncxDocument.documentElement.namespaceURI!=DAISYNavigationControl.NS) {
      ncx.quirky = true;
   }
   util.forChildNS(ncxDocument.documentElement,"head",quirks ? null : DAISYNavigationControl.NS,function(head) {
      util.forChildNS(head,"smilCustomTest",DAISYNavigationControl.NS,function(customTest) {
         var test = {}
         test.id = customTest.getAttribute("id");
         test.defaultState = "true"==customTest.getAttribute("defaultState");
         test.override = "true"==customTest.getAttribute("override");
         if (!test.override) {
            test.override = "hidden";
         }
         test.bookStruct = "true"==customTest.getAttribute("bookStruct");
         ncx.tests[test.id] = test;
      });
      util.forChildNS(head,"meta",quirks ? null : DAISYNavigationControl.NS,function(meta) {
         var data = {}
         if (quirks && !ncx.quirky && meta.namespaceURI!=DAISYNavigationControl.NS) {
            ncx.quirky = true;
         }
         data.name = meta.getAttribute("name");
         data.content = meta.getAttribute("content");
         data.scheme = meta.getAttribute("scheme");
         ncx.metadata[data.name] = data;
      });
   });
   util.forChildNS(ncxDocument.documentElement,"docTitle",quirks ? null : DAISYNavigationControl.NS,function(docTitle) {
      if (quirks && !ncx.quirky && docTitle.namespaceURI!=DAISYNavigationControl.NS) {
         ncx.quirky = true;
      }
      ncx.authors.push(DAISYNavigationControl.loadLabel(docTitle));
   });
   util.forChildNS(ncxDocument.documentElement,"docAuthor",quirks ? null : DAISYNavigationControl.NS,function(docAuthor) {
      if (quirks && !ncx.quirky && docAuthor.namespaceURI!=DAISYNavigationControl.NS) {
         ncx.quirky = true;
      }
      ncx.authors.push(DAISYNavigationControl.loadLabel(docAuthor));
   });
   util.forChildNS(ncxDocument.documentElement,"navMap",quirks ? null : DAISYNavigationControl.NS,function(navMap) {
      if (quirks && !ncx.quirky && navMap.namespaceURI!=DAISYNavigationControl.NS) {
         ncx.quirky = true;
      }
      var previous = null;
      util.forChildNS(navMap,"navPoint",quirks ? null : DAISYNavigationControl.NS,function(navPoint) {
         if (quirks && !ncx.quirky && navPoint.namespaceURI!=DAISYNavigationControl.NS) {
            ncx.quirky = true;
         }
         var point = DAISYNavigationControl.loadNavigationPoint(ncx.navMap,navPoint,quirks);
         point.previous = previous;
         if (previous) {
            previous.next = point;
         }
         previous = point;
      });
   });
   util.forChildNS(ncxDocument.documentElement,"pageList",quirks ? null : DAISYNavigationControl.NS,function(pageList) {
      if (quirks && !ncx.quirky && pageList.namespaceURI!=DAISYNavigationControl.NS) {
         ncx.quirky = true;
      }
      util.forChildNS(pageList,"navInfo",quirks ? null : DAISYNavigationControl.NS,function(navInfo) {
         if (quirks && !ncx.quirky && navInfo.namespaceURI!=DAISYNavigationControl.NS) {
            ncx.quirky = true;
         }
         ncx.pages.info.push(DAISYNavigationControl.loadLabel(navInfo));
      });
      util.forChildNS(pageList,"navLabel",quirks ? null : DAISYNavigationControl.NS,function(navLabel) {
         if (quirks && !ncx.quirky && navLabel.namespaceURI!=DAISYNavigationControl.NS) {
            ncx.quirky = true;
         }
         ncx.pages.labels.push(DAISYNavigationControl.loadLabel(navLabel));
      });
      var previous = null;
      util.forChildNS(pageList,"pageTarget",quirks ? null : DAISYNavigationControl.NS,function(pageTarget) {
         if (quirks && !ncx.quirky && pageTarget.namespaceURI!=DAISYNavigationControl.NS) {
            ncx.quirky = true;
         }
         var point = DAISYNavigationControl.loadNavigationPoint(null,pageTarget,quirks);
         ncx.pages.list.push(point);
         point.previous = previous;
         if (previous) {
            previous.next = point;
         }
         previous = point;
      });
   });
   util.forChildNS(ncxDocument.documentElement,"navList",quirks ? null : DAISYNavigationControl.NS,function(navList) {
      if (quirks && !ncx.quirky && navList.namespaceURI!=DAISYNavigationControl.NS) {
         ncx.quirky = true;
      }
      util.forChildNS(navList,"navInfo",quirks ? null : DAISYNavigationControl.NS,function(navInfo) {
         if (quirks && !ncx.quirky && navInfo.namespaceURI!=DAISYNavigationControl.NS) {
            ncx.quirky = true;
         }
         ncx.navList.info.push(DAISYNavigationControl.loadLabel(navInfo));
      });
      util.forChildNS(navList,"navLabel",quirks ? null : DAISYNavigationControl.NS,function(navLabel) {
         if (quirks && !ncx.quirky && navLabel.namespaceURI!=DAISYNavigationControl.NS) {
            ncx.quirky = true;
         }
         ncx.navList.labels.push(DAISYNavigationControl.loadLabel(navLabel));
      });
      var previous = null;
      util.forChildNS(navList,"navTarget",quirks ? null : DAISYNavigationControl.NS,function(pageTarget) {
         if (quirks && !ncx.quirky && pageTarget.namespaceURI!=DAISYNavigationControl.NS) {
            ncx.quirky = true;
         }
         var point = DAISYNavigationControl.loadNavigationPoint(null,pageTarget,quirks);
         ncx.navList.list.push(point);
         point.previous = previous;
         if (previous) {
            previous.next = point;
         }
         previous = point;
      });
   });
   return ncx;
}

DAISYNavigationControl.loadNavigationPoint = function(parent,element,allowQuirks) {

   var quirks = DAISYNavigationControl.allowQuirks || allowQuirks;
   var point = new DAISYNavigationPoint(parent);
   if (parent) {
      parent.children.push(point);
   }
   var util = DOMUtil.getInstance();
   util.forChildNS(element,"navLabel",quirks ? null : DAISYNavigationControl.NS,function(label) {
      point.labels.push(DAISYNavigationControl.loadLabel(label));
   });
   util.forChildNS(element,"content",quirks ? null : DAISYNavigationControl.NS,function(content) {
      var src = content.getAttribute("src");
      var pos = src.indexOf('#');
      point.content.href = src.substring(0,pos);
      point.content.id = src.substring(pos+1);
   });
   var previous = null;
   util.forChildNS(element,"navPoint",quirks ? null : DAISYNavigationControl.NS,function(navPoint) {
      var child = DAISYNavigationControl.loadNavigationPoint(point,navPoint,quirks);
      child.previous = previous;
      if (previous) {
         previous.next = child;
      }
      previous = child;
   });
   previous = null;
   util.forChildNS(element,"pageTarget",quirks ? null : DAISYNavigationControl.NS,function(pageTarget) {
      var child = DAISYNavigationControl.loadNavigationPoint(point,pageTarget,quirks);
      child.previous = previous;
      if (previous) {
         previous.next = child;
      }
      previous = child;
   });
   return point;
}

DAISYNavigationControl.loadLabel = function(label) {
   var obj = {};
   DOMUtil.getInstance().forElement(label,function(part) {
      if (part.localName=="text") {
         obj.text = part.textContent;
      } else if (part.localName=="audio") {
         obj.audio = {};
         obj.audio.src = part.getAttribute("src");
         obj.audio.clipBegin = part.getAttribute("src");
         obj.audio.clipEnd = part.getAttribute("src");
      } else if (part.localName=="img") {
         obj.image = {};
         obj.image.src = part.getAttribute("src");
      }
   });
   return obj;
}

