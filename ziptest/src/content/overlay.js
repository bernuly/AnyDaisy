function showZipTest() {
   window.openDialog(
      'chrome://ziptest/content/ziptest.xul','ziptest-'+(new Date()).getTime(),'centerscreen,chrome,resizable'
   );
}
