function App() {

}

App.getInstance = function() {
   if (!App.instance) {
      App.instance = new App();
   }
   return App.instance;
}

App.prototype.init = function(prefix) {
   this.prefix = prefix;
   var current = this;
   HTTP("GET",window.location.href+"current",{
      onSuccess: function(status,xml) {
         current.version = xml.documentElement.getAttribute("version");
         document.getElementById("install").appendChild(document.createTextNode(" "+current.version));
      },
      onFailure: function(status) {
         if (status==404) {
            document.getElementById("install").disabled = true;
         } else {
            alert("Cannot get current version from web service, status="+status);
         }
      }
   });
   /*
   HTTP("GET",window.location.href+"versions",{
      onSuccess: function(status,xml) {
         var container = document.getElementById("versions");
         var makeAction = function(versionInfo) {
            return function() {
               current.download(versionInfo);
            }
         };
         for (var i=0; i<xml.documentElement.childNodes.length; i++) {
            var child = xml.documentElement.childNodes[i];
            if (child.nodeType!=1) {
               continue;
            }
            var version = child.getAttribute("version");
            var div = document.createElement("div");
            div.className = "version";
            container.appendChild(div);
            var button = document.createElement("button");
            container.appendChild(button);
            button.appendChild(document.createTextNode("Version: "+version));
            button.onclick = makeAction(version);
         }
      },
      onFailure: function(status) {
         alert("Cannot get current version from web service, status="+status);
      }
   });*/
}

App.prototype.download = function(version) {
   if (!version) {
      version = this.version;
   }
   window.location.href = window.location.href+"download/"+this.prefix+"."+version+".xpi";
}