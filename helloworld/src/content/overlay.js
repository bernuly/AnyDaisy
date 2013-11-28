function HelloWorldOverlay() {
   this.window = null;
   this.transparent = null;
}

HelloWorldOverlay.getInstance = function() {
   if (!HelloWorldOverlay.instance) {
      HelloWorldOverlay.instance = new HelloWorldOverlay();
   }
   return HelloWorldOverlay.instance;
}

HelloWorldOverlay.prototype.show = function() {
   if (this.window) {
      this.window.focus();
   } else {
      this.window = window.openDialog("chrome://helloworld/content/hello.xul","hello-world","chrome,resizable",{});
   }
}

HelloWorldOverlay.prototype.showTransparent = function() {
   if (this.transparent) {
      this.transparent.focus();
   } else {
      this.transparent = window.openDialog("chrome://helloworld/content/transparent.xul","hello-world-transparent","chrome,resizable,titlebar=no",{});
   }
}
