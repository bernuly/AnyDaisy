function Password() {
   
}

Password.getInstance = function() {
   if (!Password.instance) {
      Password.instance = new Password();
   }
   return Password.instance;
}

Password.prototype.init = function(data) {
   this.data = data;
   document.getElementById("prompt").value = data.prompt;
   this.uivoice = new UIVoice();
   this.uivoice.init();
   this.uivoice.attach(document);
   this.uivoice.introduce(document.title);
   
   var current = this;
   var password = document.getElementById("password");
   password.setAttribute("tooltiptext",data.prompt);
   password.addEventListener("keypress",function(event) {
      if (event.keyCode==13) {
         current.uivoice.cancel();
         current.uivoice.disabled = true;
         current.onOK();
      }
   },false);
   
   password.focus();
}

Password.prototype.onKeyPress = function(event) {
   if (event.keyCode==13) {
      this.onOK();
   }
}

Password.prototype.onCancel = function() {
   this.data.success = false;
   setTimeout(function() {
      window.close();
   },10);
}

Password.prototype.onOK = function() {
   this.data.success = true;
   this.data.password = document.getElementById("password").value;
   setTimeout(function() {
      window.close();
   },10);
}
