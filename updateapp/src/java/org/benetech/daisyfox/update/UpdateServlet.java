/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

package org.benetech.daisyfox.update;

import java.io.File;
import java.io.FileFilter;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.Writer;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;
import javax.naming.Context;
import javax.naming.InitialContext;
import javax.naming.NameNotFoundException;
import javax.naming.NamingException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

/**
 *
 * @author alex
 */
public class UpdateServlet extends HttpServlet {

   static String RDF_NS = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
   static String EM_NS = "http://www.mozilla.org/2004/em-rdf#";
   static String MANIFEST_ABOUT = "urn:mozilla:install-manifest";

   static class TargetApplication {
      String id;
      String min;
      String max;
      TargetApplication(String id,String min,String max) {
         this.id = id;
         this.min = min;
         this.max = max;
      }

      public String getId() {
         return id;
      }

      public String getMaxVersion() {
         return max;
      }

      public String getMinVersion() {
         return min;
      }
   }
   class Version {
      File xpi;
      String version;
      List<TargetApplication> targets;
      long [] versionTuple;
      Version(File xpi) {
         this.xpi = xpi;
         this.version = null;
         this.versionTuple = null;
         this.targets = new ArrayList<TargetApplication>();
      }

      public File getFile() {
         return xpi;
      }

      public String getVersion() {
         return version;
      }

      public long [] getVersionTuple() {
         return versionTuple;
      }

      public List<TargetApplication> getTargetApplications() {
         return targets;
      }

      public boolean init() 
         throws Exception
      {
         ZipFile zipFile = new ZipFile(xpi);
         try {
            ZipEntry entry = zipFile.getEntry("install.rdf");
            if (entry==null) {
               return false;
            }
            InputStream is = zipFile.getInputStream(entry);

            DocumentBuilder builder = docFactory.newDocumentBuilder();
            InputSource source = new InputSource(new InputStreamReader(is,"UTF-8"));
            Document installRDF = builder.parse(source);
            is.close();

            Element description = null;
            NodeList matches = installRDF.getDocumentElement().getElementsByTagNameNS(RDF_NS, "Description");
            for (int i=0; i<matches.getLength(); i++) {
               Element child = (Element)matches.item(i);
               if (MANIFEST_ABOUT.equals(child.getAttributeNS(RDF_NS, "about"))) {
                  description = child;
                  break;
               }
            }

            if (description!=null) {
               matches = description.getElementsByTagNameNS(EM_NS, "version");
               if (matches.getLength()==1) {
                  setVersion(matches.item(0).getTextContent());
               }
               matches = description.getElementsByTagNameNS(EM_NS, "targetApplication");
               for (int i=0; i<matches.getLength(); i++) {
                  Element child = (Element)matches.item(i);

                  NodeList rdfDescList = child.getElementsByTagNameNS(RDF_NS, "Description");
                  if (rdfDescList.getLength()==0) {
                     continue;
                  }
                  Element rdfDesc = (Element)rdfDescList.item(0);
                  String id = rdfDesc.getAttributeNS(EM_NS, "id");
                  if (id==null) {
                     NodeList parts = rdfDesc.getElementsByTagNameNS(EM_NS, "id");
                     if (parts.getLength()>0) {
                        id = parts.item(0).getTextContent();
                     }
                  }
                  String min = rdfDesc.getAttributeNS(EM_NS, "minVersion");
                  if (min==null) {
                     NodeList parts = rdfDesc.getElementsByTagNameNS(EM_NS, "minVersion");
                     if (parts.getLength()>0) {
                        min = parts.item(0).getTextContent();
                     }
                  }
                  String max = rdfDesc.getAttributeNS(EM_NS, "maxVersion");
                  if (max==null) {
                     NodeList parts = rdfDesc.getElementsByTagNameNS(EM_NS, "maxVersion");
                     if (parts.getLength()>0) {
                        max = parts.item(0).getTextContent();
                     }
                  }
                  TargetApplication target = new TargetApplication(id,min,max);
                  targets.add(target);
               }
            }

         } finally {
            zipFile.close();
         }
         return true;

      }

      protected void setVersion(String value) {
         version = value;
         versionTuple = parseVersion(version);
      }

   }

   public static long [] parseVersion(String value) {
      String parts [] = value.split("\\.");
      long [] tuple = new long[parts.length];
      for (int i=0; i<parts.length; i++) {
         tuple[i] = Long.parseLong(parts[i]);
      }
      return tuple;
   }

   long lastCheck;
   File directory;
   DocumentBuilderFactory docFactory;
   Map<String,Version> versions;
   String filePrefix;
   public UpdateServlet() {
      lastCheck = -1;
      directory = null;
      docFactory = DocumentBuilderFactory.newInstance();
      docFactory.setNamespaceAware(true);
      versions = new TreeMap<String,Version>();
   }

   public void init() {
      directory = new File(new File(System.getProperty("user.home")), "daisyfox");
      try {
         Context env = (Context) new InitialContext().lookup("java:comp/env");
         String dir = null;
         try {
            dir = env.lookup("daisyfox.update.dir").toString();
         } catch (NameNotFoundException ex) {
            getServletContext().log("daisyfox.update.dir is not set in the environment.");
         }
         if (dir==null) {
            dir = System.getProperty("daisyfox.update.dir");
            if (dir!=null) {
               getServletContext().log("Got daisyfox.update.dir from system properties.");
            }
         }
         if (dir!=null) {
            directory = new File(dir);
         }
      } catch (NamingException ex) {
         getServletContext().log("Cannot get daisyfox.update.dir from JNDI context due to exception.",ex);
      }
      getServletContext().log("daisyfox.update.dir="+directory.getAbsolutePath());
      filePrefix = getServletContext().getInitParameter("file-prefix");
      if (filePrefix==null) {
         filePrefix = "daisy";
      }
   }

   protected void checkDir() {
      if (!directory.exists()) {
         getServletContext().log("Directory "+directory.getAbsolutePath()+" does not exist.");
         return;
      }

      if (lastCheck<0 || directory.lastModified()>lastCheck) {
         loadDir();
      }
   }

   protected void loadDir() {
      getServletContext().log("Reloading XPI files from directory "+directory.getAbsolutePath());
      File [] files = directory.listFiles(new FileFilter() {
         public boolean accept(File file) {
            String name = file.getName();
            int pos = name.lastIndexOf('.');
            if (pos>0 && "xpi".equals(name.substring(pos+1))) {
               return true;
            } else {
               return false;
            }
         }
      });
      versions.clear();
      for (int i=0; i<files.length; i++) {
         Version version = new Version(files[i]);
         try {
            if (version.init()) {
               String versionId = version.getVersion();
               if (versionId==null) {
                  getServletContext().log("There is no version information in install.rdf in "+files[i].getAbsolutePath());
               } else {
                  versions.put(versionId, version);
                  getServletContext().log(versionId+" -> "+files[i].getAbsolutePath());
               }
            } else {
               getServletContext().log("There is no install.rdf information in "+files[i].getAbsolutePath());
            }
         } catch (Exception ex) {
            getServletContext().log("Exception while processing "+files[i].getAbsolutePath(),ex);
         }
      }
      lastCheck = System.currentTimeMillis();
   }

   protected boolean isNewer(long [] v1,long [] v2) {
      int i=0;
      while (i<v1.length && i<v2.length && v1[i]==v2[i]) {
         i++;
      }
      return (i<v1.length && i==v2.length) || (i<v1.length && v1[i]>v2[i]);
   }

   protected Version findCurrent() {
      Version current = null;
      for (Version version : versions.values()) {
         if (current!=null) {
            getServletContext().log("Checking "+version.getVersion()+" versus "+current.getVersion());
         }
         if (current==null || isNewer(version.getVersionTuple(),current.getVersionTuple())) {
            getServletContext().log(version.getVersion()+" is newer than "+(current==null ? "(none)" : current.getVersion()));
            current = version;
         }
      }
      return current;
   }

   protected void doGet(HttpServletRequest request,HttpServletResponse response)
      throws IOException
   {
      checkDir();
      String path = request.getRequestURI().substring(getServletContext().getContextPath().length());
      if (path.equals("/check")) {
         check(request,response);
      } else if (path.equals("/current")) {
         current(request,response);
      } else if (path.equals("/versions")) {
         versions(request,response);
      } else if (path.startsWith("/download/")) {
         download(request,response);
      } else {
         response.setStatus(HttpServletResponse.SC_NOT_FOUND);
      }
   }

   protected void check(HttpServletRequest request,HttpServletResponse response) 
      throws IOException
   {
      String requestVersion = request.getParameter("version");
      if (requestVersion==null) {
         response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
         return;
      }
      String os = request.getParameter("os");
      if (os==null) {
         response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
         return;
      }

      getServletContext().log("Checking version "+requestVersion+" on "+os);
      long [] theirs = parseVersion(requestVersion);
      Version current = findCurrent();

      response.setStatus(HttpServletResponse.SC_OK);
      response.setContentType("text/xml");
      response.setCharacterEncoding("UTF-8");

      Writer out = response.getWriter();

      out.write("<?xml version='1.0' encoding='UTF-8'?>\n");
      out.write("<RDF:RDF xmlns:RDF='http://www.w3.org/1999/02/22-rdf-syntax-ns#' xmlns:em='http://www.mozilla.org/2004/em-rdf#'>\n");

      /*
     The extension update RDF file looks something like this:
#
#       <RDF:Description about="urn:mozilla:extension:{GUID}">
#         <em:updates>
#           <RDF:Seq>
#             <RDF:li resource="urn:mozilla:extension:{GUID}:4.9"/>
#             <RDF:li resource="urn:mozilla:extension:{GUID}:5.0"/>
#           </RDF:Seq>
#         </em:updates>
#         <!-- the version of the extension being offered -->
#         <em:version>5.0</em:version>
#         <em:updateLink>http://www.mysite.com/myext-50.xpi</em:updateLink>
#       </RDF:Description>
#
#       <RDF:Description about="urn:mozilla:extension:{GUID}:4.9">
#         <em:version>4.9</em:version>
#         <em:targetApplication>
#           <RDF:Description>
#             <em:id>{ec8030f7-c20a-464f-9b0e-13a3a9e97384}</em:id>
#             <em:minVersion>0.9</em:minVersion>
#             <em:maxVersion>1.0</em:maxVersion>
#             <em:updateLink>http://www.mysite.com/myext-49.xpi</em:updateLink>
#           </RDF:Description>
#         </em:targetApplication>
#       </RDF:Description>
       */
      if (current!=null && isNewer(current.getVersionTuple(),theirs)) {

         getServletContext().log("Version "+current.getVersion()+" is newer.  Sending update.");

         String server = request.getScheme()+"://"+request.getServerName()+":"+request.getServerPort()+"/"+request.getContextPath();
         String url = server+"download/"+filePrefix+"."+current.getVersion()+".xpi";
         
         out.write("<RDF:Description about='urn:mozilla:extension:{6be5ef88-4289-44d1-81f2-097313ed640b}'>\n");
         out.write("<em:updates>\n");
         out.write("<RDF:Seq>\n");
         out.write("<RDF:li resource='urn:mozilla:extension:{6be5ef88-4289-44d1-81f2-097313ed640b}:"+current.getVersion()+"'/>\n");
         out.write("</RDF:Seq>\n");
         out.write("</em:updates>\n");
         out.write("<em:version>"+current.getVersion()+"</em:version>\n");
         out.write("<em:updateLink>"+url+"</em:updateLink>\n");
         out.write("</RDF:Description>\n");

         out.write("<RDF:Description about='urn:mozilla:extension:{6be5ef88-4289-44d1-81f2-097313ed640b}:"+current.getVersion()+"'>\n");
         out.write("<em:version>"+current.getVersion()+"</em:version>\n");
         for (TargetApplication target : current.getTargetApplications()) {
            out.write("<em:targetApplication>\n");
            out.write("<RDF:Description>\n");
            out.write("<em:id>"+target.getId()+"</em:id>\n");
            out.write("<em:minVersion>"+target.getMinVersion()+"</em:minVersion>\n");
            out.write("<em:maxVersion>"+target.getMaxVersion()+"</em:maxVersion>\n");
            out.write("<em:updateLink>"+url+"</em:updateLink>\n");
            out.write("</RDF:Description>\n");
            out.write("</em:targetApplication>\n");
         }
         out.write("</RDF:Description>\n");

      }
      out.write("</RDF:RDF>\n");
      out.flush();
      out.close();
   }

   protected void current(HttpServletRequest request,HttpServletResponse response)
      throws IOException
   {
      Version current = findCurrent();
      if (current==null) {
         response.setStatus(HttpServletResponse.SC_NOT_FOUND);
      } else {
         response.setStatus(HttpServletResponse.SC_OK);
         response.setContentType("application/xml");
         response.setCharacterEncoding("UTF-8");
         Writer out = response.getWriter();
         out.write("<?xml version='1.0' encoding='utf-8'?>\n");
         out.write("<available version='"+current.getVersion()+"'/>");
         out.flush();
         out.close();
      }
   }

   protected void versions(HttpServletRequest request,HttpServletResponse response)
      throws IOException
   {
      response.setStatus(HttpServletResponse.SC_OK);
      response.setContentType("application/xml");
      response.setCharacterEncoding("UTF-8");
      Writer out = response.getWriter();
      out.write("<?xml version='1.0' encoding='utf-8'?>\n");
      out.write("<versions>\n");
      for (Version version : versions.values()) {
         out.write("<available version='"+version.getVersion()+"'/>\n");
      }
      out.write("</versions>\n");
      out.flush();
      out.close();
   }

   protected void download(HttpServletRequest request,HttpServletResponse response) 
      throws IOException
   {
      String path = request.getRequestURI().substring(getServletContext().getContextPath().length());
      int dlen = ("/download/"+filePrefix+".").length();
      if (path.length()<=dlen) {
         response.setStatus(HttpServletResponse.SC_NOT_FOUND);
         return;
      }
      String versionInfo = path.substring(dlen);
      int extPos = versionInfo.lastIndexOf(".xpi");
      if (extPos<0) {
         response.setStatus(HttpServletResponse.SC_NOT_FOUND);
         return;
      }
      versionInfo = versionInfo.substring(0,extPos);
      getServletContext().log("Looking up version: "+versionInfo);
      Version version = versions.get(versionInfo);
      if (version==null) {
         response.setStatus(HttpServletResponse.SC_NOT_FOUND);
         return;
      }
      response.setContentLength((int)version.getFile().length());
      response.setContentType("application/x-xpinstall");

      FileInputStream is = new FileInputStream(version.getFile());
      OutputStream os = null;

      try {
         os = response.getOutputStream();
         byte [] buffer = new byte[16384];
         int len = 0;
         while ((len=is.read(buffer))>0) {
            os.write(buffer,0,len);
         }
      } finally {
         os.close();
         is.close();
      }
   }
}
