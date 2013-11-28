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

function URI(spec) {
   this.spec = spec;
   this.parse();
}

URI.prototype.parse = function() {
   var pos = 0;
   for (; pos<this.spec.length && this.spec.charAt(pos)!=':'; pos++);
   if (pos==this.spec.length) {
      throw "Bad URI value, no scheme: "+this.spec;
   }
   this.scheme = this.spec.substring(0,pos);
   this.schemeSpecificPart = this.spec.substring(pos+1);
   pos++;
   if (this.spec.charAt(pos)=='/' && this.spec.charAt(pos+1)=='/') {
      this.parseGeneric();
   }
}

URI.prototype.parseGeneric = function() {
   if (this.schemeSpecificPart.charAt(0)!='/' || this.schemeSpecificPart.charAt(1)!='/') {
      throw "Generic URI values should start with '//':"+this.spec;
   }

   var work = this.schemeSpecificPart.substring(2);
   var pathStart = work.indexOf("/");
   if (pathStart<0) {
      throw "There must be a server specification: "+this.spec;
   }
   this.authority = work.substring(0,pathStart);
   this.path = work.substring(pathStart);
   var hash = this.path.indexOf('#');
   if (hash>=0) {
      this.fragment = this.path.substring(hash+1);
      this.path = this.path.substring(0,hash);
   }
   var questionMark = this.path.indexOf('?');
   if (questionMark>=0) {
      this.query = this.path.substring(questionMark+1);
      this.path = this.path.substring(0,questionMark);
   }
   this.segments = this.path.split(/\//);
   if (this.segments.length>0 && this.segments[0]=='' && this.path.length>1 && this.path.charAt(1)!='/') {
      // empty segment at the start, remove it
      this.segments.shift();
   }
   if (this.segments.length>0 && this.path.length>0 && this.path.charAt(this.path.length-1)=='/' && this.segments[this.segments.length-1]=='') {
      // we may have an empty the start
      // check to see if it is legimate
      if (this.path.length>1 && this.path.charAt(this.path.length-2)!='/') {
         this.segments.pop();
      }
   }
   this.isGeneric = true;
}

URI.prototype.resolve = function(href) {
   if (!href) {
      return new URI(this.spec);
   }
   if (!this.isGeneric) {
      throw "Cannot resolve uri against non-generic URI: "+this.spec;
   }
   if (href.charAt(0)=='/') {
      return new URI(this.scheme+"://"+this.authority+href);
   } else if (href.charAt(0)!='#') {
      if (href.charAt(0)=='.' && href.charAt(1)=='/') {
         href = href.substring(1);
      }
      if (this.path.charAt(this.path.length-1)=='/') {
         return new URI(this.scheme+"://"+this.authority+this.path+href.substring(2));
      } else {
         var last = this.path.lastIndexOf('/');
         return new URI(this.scheme+"://"+this.authority+this.path.substring(0,last+1)+href);
      }
   } else {
      return new URI(this.scheme+"://"+this.authority+this.path+href);
   }
}

URI.prototype.relativeTo = function(otherURI) {
   if (otherURI.scheme!=this.scheme) {
      return this.spec;
   }
   if (!this.isGeneric) {
      throw "A non generic URI cannot be made relative: "+this.spec;
   }
   if (!otherURI.isGeneric) {
      throw "Cannot make a relative URI against a non-generic URI: "+otherURI.spec;
   }
   if (otherURI.authority!=this.authority) {
      return this.spec;
   }
   for (var i=0; i<this.segments.length && i<otherURI.segments.length; i++) {
      if (this.segments[i]!=otherURI.segments[i]) {
         //alert(this.path+" different from "+otherURI.path+" at '"+this.segments[i]+"' vs '"+otherURI.segments[i]+"'");
         var relative = "";
         for (var j=i; j<otherURI.segments.length; j++) {
            relative += "../";
         }
         for (var j=i; j<this.segments.length; j++) {
            relative += this.segments[j];
            if ((j+1)<this.segments.length) {
               relative += "/";
            }
         }
         if (this.path.charAt(this.path.length-1)=='/') {
            relative += "/";
         }
         return relative;
      }
   }
   if (this.segments.length==otherURI.segments.length) {
      return hash ? hash : (query ? query : "");
   } else if (i<this.segments.length) {
      var relative = "";
      for (var j=i; j<this.segments.length; j++) {
         relative += this.segments[j];
         if ((j+1)<this.segments.length) {
            relative += "/";
         }
      }
      if (this.path.charAt(this.path.length-1)=='/') {
         relative += "/";
      }
      return relative;
   } else {
      throw "Cannot calculate a relative URI for "+this.spec+" against "+otherURI.spec;
   }
}



