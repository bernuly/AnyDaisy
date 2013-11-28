function setTimeout(handler,delay) {
    var timer = Components.classes["@mozilla.org/timer;1"].createInstance().QueryInterface(Components.interfaces.nsITimer);
    timer.initWithCallback(handler,delay,0);
    return timer;
}

function clearTimeout(timer) {
   timer.cancel();
}
