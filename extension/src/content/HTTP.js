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

var _HTTP_HEADER_NAME = new RegExp("^([a-zA-Z0-9_-]+):");
var _ioService=Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
var _authenticationManager = Components.classes["@mozilla.org/network/http-auth-manager;1"].getService(Components.interfaces.nsIHttpAuthManager);

function _HTTP_parseHeaders(headerText)
{
   var headers = {};
   if (headerText) {
      var eol = headerText.indexOf("\n");
      while (eol>=0) {
         var line = headerText.substring(0,eol);
         headerText = headerText.substring(eol+1);
         while (headerText.length>0 && !headerText.match(_HTTP_HEADER_NAME)) {
            eol = headerText.indexOf("\n");
            var nextLine = eol<0 ? headerText : headerText.substring(0,eol);
            line = line+' '+nextLine;
            headerText = eol<0 ? "" : headerText.substring(eol+1);
         }
         // Parse the name value pair
         var colon = line.indexOf(':');
         var name = line.substring(0,colon);
         var value = line.substring(colon+1);
         headers[name] = value;
         eol = headerText.indexOf("\n");
      }
      if (headerText.length>0) {
         var colon = headerText.indexOf(':');
         var name = headerText.substring(0,colon);
         var value = headerText.substring(colon+1);
         headers[name] = value;
      }
   }
   return headers;
}

/** 
 * The following keys can be sent:
 * onSuccess (required)  a function called when the response is 2xx
 * onFailure             a function called when the response is not 2xx
 * username              The username for basic auth
 * password              The password for basic auth
 * overrideMimeType      The mime type to use for non-XML response mime types
 * timeout               A timeout value in milliseconds for the response
 * onTimeout             A function to call if the request times out.
 * body                  A string containing the entity body of the request
 * contentType           The content type of the entity body of the request
 * headers               A hash of optional headers
 */
function HTTP(method,url,options)
{
      
   //alert(method+" "+url+" "+options.username);
   
   var requester = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance();
   requester = requester.QueryInterface(Components.interfaces.nsIXMLHttpRequest);
   //var requester = new XMLHttpRequest();

   var timeout = null;
   if (!options.synchronizedRequest) {

      requester.onreadystatechange = function() {
         if (requester.readyState==4) {
            if (timeout) {
               clearTimeout(timeout);
            }
            try {
               if (requester.status) {
               }
            } catch (ex) {
               if (options.onFailure) {
                  options.onFailure(
                     -1,
                     null,
                     ex,
                     null
                  );
               }
               return;
            }
            try {
               if (requester.status==0 || (requester.status>=200 && requester.status<300)) {
                  options.onSuccess(
                     requester.status,
                     requester.responseXML,
                     requester.responseText,
                     options.returnHeaders ? _HTTP_parseHeaders(requester.getAllResponseHeaders()) : null
                  );
               } else {
                  if (options.onFailure) {
                     options.onFailure(
                        requester.status,
                        requester.responseXML,
                        requester.responseText,
                        options.returnHeaders ? _HTTP_parseHeaders(requester.getAllResponseHeaders()) : null
                     );
                  }
               }
            } catch (ex) {
               if (options.onFailure) {
                  options.onFailure(-1,requester.responseXML,ex);
               }
            }
         }
      }
   }
   
   if (options.overrideMimeType) {
      requester.overrideMimeType(options.overrideMimeType);
   }
   if (options.username && options.username!="") {
      requester.open(method,url+"",!options.synchronizedRequest,options.username,options.password);
   } else {
      requester.open(method,url+"",!options.synchronizedRequest);
   }
   if (options.timeout && !options.synchronizedRequest) {
      timeout = setTimeout(
          function() {
             var callback = options.onTimeout ? options.onTimeout : options.onFailure;
             callback(0,"Operation timeout.");
          },
          options.timeout
      );
   }
   if (options.headers) {
      for (var name in options.headers) {
         requester.setRequestHeader(name,options.headers[name]);
      }
   }
   if (options.body) {
      requester.setRequestHeader("Content-Type",options.contentType);
      requester.send(options.body);
   } else {
      requester.send(null);
   }
   if (options.synchronizedRequest) {
      if (requester.status==0 || (requester.status>=200 && requester.status<300)) {
         options.onSuccess(
            requester.status,
            requester.responseXML,
            requester.responseText,
            options.returnHeaders ? _HTTP_parseHeaders(requester.getAllResponseHeaders()) : null
         );
      } else {
         if (options.onFailure) {
            options.onFailure(
               requester.status,
               requester.responseXML,
               requester.responseText,
               options.returnHeaders ? _HTTP_parseHeaders(requester.getAllResponseHeaders()) : null
            );
         }
      }
      return {
         abort: function() {
         }
      };
   } else {
      return {
         abort: function() {
            clearTimeout(timeout);
            requester.abort();
         }
      };
   }
}


