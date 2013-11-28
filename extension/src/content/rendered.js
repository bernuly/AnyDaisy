function RenderViewer() {

}

RenderViewer.prototype.init = function(navContext) {
   this.navMapSelect = document.getElementById("navMap");
   this.context = navContext;
   this.context.console.log("Attached navigation to rendered view.");
   for (var i=0; i<this.context.navigation.navMap.children.length; i++) {
      this.addNavigationPoint(0,this.context.navigation.navMap.children[i],0);
   }
   for (var p=0; p<this.context.navigation.pages.list.length; p++) {
      this.addNavigationPoint(0,this.context.navigation.pages.list[p],"Page: ");
   }
   for (var f=0; f<this.context.navigation.navList.list.length; f++) {
      this.addNavigationPoint(0,this.context.navigation.navList.list[f],"Figure: ");
   }
   var current = this;
   this.navMapSelect.onchange = function() {
      current.moveTo(this.options[this.selectedIndex].navPoint);
   }
   this.context.document = document;
   this.context.onload = function() {
      //current.moveTo(current.navMapSelect.firstChild.navPoint);
   }
   var doPlay = function() {
      if (current.navMapSelect.selectedIndex>=0) {
         current.play(current.navMapSelect.options[current.navMapSelect.selectedIndex].navPoint);
      }
   }
   var doStop = function() {
      current.stop();
   }
   var doNext = function() {
      if (current.navMapSelect.selectedIndex<(current.navMapSelect.options.length-1)) {
         current.navMapSelect.selectedIndex = current.navMapSelect.selectedIndex + 1;
         doPlay();
      } else {
         doStop();
      }
   }
   var doPrevious = function() {
      if (current.navMapSelect.selectedIndex>0) {
         current.navMapSelect.selectedIndex = current.navMapSelect.selectedIndex - 1;
         doPlay();
      } else {
         doStop();
      }
   }
   document.onkeypress = function(e) {
      current.context.console.debug(e.charCode+" "+e.ctrlKey);
      if (e.ctrlKey) {
         switch (e.charCode) {
            case 103: // g
               current.context.console.log("Play keystroke.");
               doPlay();
               break;
            case 115: // s
               current.context.console.log("Stop keystroke.");
               doStop();
               break
            case 112: // p
               current.context.console.log("Previous keystroke.");
               doPrevious();
               break;
            case 110: // n
               current.context.console.log("Next keystroke.");
               doNext();
         }
      }
   }
   document.getElementById("previous").onclick = doPrevious;
   document.getElementById("next").onclick = doNext;
   document.getElementById("play").onclick = doPlay;
   document.getElementById("stop").onclick = doStop;
}

RenderViewer.prototype.addNavigationPoint = function(level,navPoint,prefix) {
   var option = document.createElement("option");
   option.navPoint = navPoint;
   for (var i=0; i<navPoint.labels.length; i++) {
      if (prefix) {
         option.appendChild(document.createTextNode(prefix));
      }
      option.appendChild(document.createTextNode(i==0 ? navPoint.labels[i].text : "\n"+navPoint.labels[i].text));
      option.className = "level-"+level;
   }
   this.navMapSelect.appendChild(option);
   for (var j=0; j<navPoint.children.length; j++) {
      this.addNavigationPoint(level+1,navPoint.children[j]);
   }

}

RenderViewer.prototype.moveTo = function(navPoint) {
   this.context.moveTo(navPoint.content.id);
}
RenderViewer.prototype.play = function(navPoint) {
   this.context.stop();
   this.context.moveTo(navPoint.content.id);
   this.context.play(navPoint);
}

RenderViewer.prototype.stop = function() {
   this.context.stop();
}

var renderApp = new RenderViewer();