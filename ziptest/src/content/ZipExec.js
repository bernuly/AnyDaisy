ZipExec.prototype = new Settings();
ZipExec.prototype.constructor = ZipExec;

function ZipExec() {
   this.unzipCommand = this._getPreferenceString("daisyfox.zip.","command");
   if (!this.unzipCommand) {
      this.unzipCommand = "/usr/bin/unzip";
   }
   //alert(this.unzipCommand);

}

ZipExec.prototype.extract = function(zipFile,targetDir,password) {
   var file =  Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);

   file.initWithPath(this.unzipCommand);

   if (!file.exists()) {
      return -1;
   }


   this.process = Components.classes["@mozilla.org/process/util;1"].createInstance(Components.interfaces.nsIProcess);
   this.process.init(file);
   var argv = [ "-o", "-qq", ];
   if (password) {
      argv.push("-P");
      argv.push(password);
   }

   argv.push("-d");
   argv.push(targetDir);
   
   argv.push(zipFile);

   //alert(argv.join(" "));

   this.process.run(true, argv, argv.length);

   // we do this because the status returned on OS X is wrong
   var current = this;
   var count = 0;
   var waitFor = function() {
      if ((count>10 && current.process.exitValue==0) || current.process.exitValue>0) {
         if (current.onComplete) {
            current.onComplete(current.process.exitValue);
         }
      } else {
         count++;
         setTimeout(waitFor,100);
      }
   }
   waitFor();
}

