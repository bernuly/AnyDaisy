var XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
function NoPlayback() {

}

NoPlayback.getInstance = function() {
   if (!NoPlayback.instance) {
      NoPlayback.instance = new NoPlayback();
   }
   return NoPlayback.instance;
}

NoPlayback.prototype.init = function(data) {
   this.data = data;
   var osBox = document.getElementById("os");
   if (this.data.OS=="WINNT") {
      var desc = document.createElementNS(XUL_NS,"description");
      desc.appendChild(document.createTextNode("Windows provides TTS support through the SAPI components.  "
                                               + "You operating system version may not have these components installed.  "
                                               + "Alternatively, you may be on an unsupported version of Windows."));
      osBox.appendChild(desc);
   } else if (this.data.OS=="Darwin") {
      var desc = document.createElementNS(XUL_NS,"description");
      desc.appendChild(document.createTextNode("Mac OS X Leopard (10.5) and above provide a native TTS engine.  Please contact support to diagnose your problem."));
      osBox.appendChild(desc);
   } else if (this.data.OS=="Linux") {
      var desc = document.createElementNS(XUL_NS,"description");
      desc.appendChild(document.createTextNode("Linux TTS is supported through espeak or festival (espeak is preferred).  Please install either of these packages and re-load the DAISY document."));
      osBox.appendChild(desc);
   } else {
      var desc = document.createElementNS(XUL_NS,"description");
      desc.appendChild(document.createTextNode("Your operating system type is unknown: "+data.OS));
      osBox.appendChild(desc);
   }
}