/*
 *
Copyright (c) 2008, R. Alexander Milowski
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

 - Redistributions of source code must retain the above copyright notice,
   this list of conditions and the following disclaimer.
 - Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.
 - Neither the name of the R. Alexander Milowski nor the names of its contributors
   may be used to endorse or promote products derived from this software
   without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

 *
 */

function DOMUtil() {
}

DOMUtil.getInstance = function() {
   if (!DOMUtil.instance) {
      DOMUtil.instance = new DOMUtil();
   }
   return DOMUtil.instance;
}

DOMUtil.prototype.forElement = function(e,handler) {
   var current = e ? e.firstChild : null;
   while (current) {
      if (current.nodeType!=1) {
         current = current.nextSibling;
         continue;
      }
      handler(current);
      current = current.nextSibling;
   }
}

DOMUtil.prototype.forChild = function(e,name,handler) {
   var current = e ? e.firstChild : null;
   while (current) {
      if (current.nodeType!=1) {
         current = current.nextSibling;
         continue;
      }
      //alert("{"+current.namespaceURI+"}"+current.localName+" vs {"+namespace+"}"+name);
      if (current.tagName.toLowerCase()==name) {
         handler(current);
      }
      current = current.nextSibling;
   }
}
DOMUtil.prototype.forChildNS = function(e,name,namespaceURI,handler) {
   var current = e ? e.firstChild : null;
   while (current) {
      if (current.nodeType!=1) {
         current = current.nextSibling;
         continue;
      }
      //alert("{"+current.namespaceURI+"}"+current.localName+" vs {"+namespace+"}"+name);
      if ((!name || current.localName==name) && (!namespaceURI || current.namespaceURI==namespaceURI)) {
         handler(current);
      }
      current = current.nextSibling;
   }
}
DOMUtil.prototype.text = function(e,value) {
   if (value) {
      this.clearChildren(e);
      e.appendChild(e.ownerDocument.createTextNode(value));
   } else {
      if (e.innerText) {
         return e.innerText;
      } else if (e.textContent) {
         return e.textContent;
      } else {
         var text = "";
         var current = e.firstChild;
         while (current) {
            if (current.nodeType==3) {
               text += current.nodeValue;
            } else if (current.nodeType==1) {
               text += this.text(current);
            }
            current = current.nextSibling;
         }
         return text;
      }
   }
}

DOMUtil.prototype.clearChildren = function(parent) {
   if (parent && parent.childNodes) {
      while (parent.childNodes.length>0) {
         parent.removeChild(parent.childNodes.item(0));
      }
   }
}
