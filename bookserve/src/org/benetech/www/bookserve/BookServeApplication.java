/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

package org.benetech.www.bookserve;

import java.io.File;
import org.restlet.Application;
import org.restlet.Context;
import org.restlet.Directory;
import org.restlet.Restlet;
import org.restlet.data.MediaType;
import org.restlet.data.Metadata;
import org.restlet.data.Reference;

/**
 *
 * @author alex
 */
public class BookServeApplication extends Application {

   public BookServeApplication(Context context) {
      super(context);
      MediaType opfMediaType = new MediaType("application/oebps-package+xml");
      MediaType dtbMediaType = new MediaType("application/x-dtbook+xml");
      MediaType ncxMediaType = new MediaType("application/x-dtbncx+xml");
      getMetadataService().addExtension("opf", opfMediaType,true);
      getMetadataService().addExtension("dtb", dtbMediaType,true);
      getMetadataService().addExtension("ncx", ncxMediaType,true);
   }

   public Restlet createRoot() {
      Reference dirRef = new Reference(getContext().getParameters().getFirstValue("dir"));
      File dir = new File(dirRef.getPath());
      /*
      Router router = new Router(getContext());
      getLogger().info("Book directory: "+dir.getAbsolutePath());
      router.attach("/books/",);
      return router;
       */
      return new Directory(getContext(),new Reference("file://"+dir.getAbsolutePath()));
   }
}
