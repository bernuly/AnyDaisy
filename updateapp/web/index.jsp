<%-- 
    Document   : index
    Created on : Feb 18, 2009, 12:53:00 PM
    Author     : alex
--%>

<%@page contentType="text/html" pageEncoding="UTF-8"%>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
   "http://www.w3.org/TR/html4/loose.dtd">
<%
   String filePrefix = getServletContext().getInitParameter("file-prefix");
   if (filePrefix==null) {
      filePrefix = "daisy";
   }
%>
<html>
    <head>
        <title>AnyDAISY Distribution</title>
        <link rel="stylesheet" type="text/css" href="site.css"/>
        <script type="text/javascript" src="HTTP.js">//</script>
        <script type="text/javascript" src="App.js">//</script>
    </head>
    <body onload="App.getInstance().init('<%=filePrefix%>')">
        <h1>AnyDAISY Distribution</h1>
        <div class="section">
           <h2>Installing the Current Version</h2>
           <p>To install the current version of AnyDAISY just follow the instructions below:</p>
           <ol>
              <li>Press the this button: <button id="install" onclick="App.getInstance().download()">Install</button></li>
              <li>You may have gotten a yellow message bar at the top of the window that says "Firefox prevented this site ...".  If so,
              you need to allow this site to install AnyDAISY and start at step (1) again.</li>
              <li>Firefox should have presented you with an install dialog with an "Install" button
              that counts down to zero.</li>
              <li>When the "Install Now" button is enabled, click on it.  Firefox will install
                  AnyDAISY as one of your addons.</li>
              <li>At this point you should have the "Addons" dialog in front of you.  It should list
              AnyDAISY as one of your Firefox Addons and it should be prompting you to restart Firefox.</li>
              <li>Restart firefox.</li>
              <li>AnyDAISY should now be available under the "View->Sidebar" menu.  Open the AnyDAISY via this menu.</li>
              <li>The first time you open AnyDAISY it configures Flash to play audio books.  If you want to
              play audio books you will need to restart Firefox one more time.  After that restart, audio books should play.</li>
           </ol>
        </div>

<!--
        <div class="section">
           <h2>All Versions Available</h2>

           <p>To install a previous version, click on the button with the version you require and follow the same procedure as above.</p>
           <div id="versions">
              
           </div>
        </div>
        -->
    </body>
</html>
