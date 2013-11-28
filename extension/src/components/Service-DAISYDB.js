
function DAISYDB() {
}

DAISYDB.prototype.open = function(file) {
   var storageService = Components.classes["@mozilla.org/storage/service;1"].getService(Components.interfaces.mozIStorageService);
   if (file.exists()) {
      this.connection = storageService.openDatabase(file);
      switch (this.checkSchema()) {
         case -1:
            // there is no schema for some reason
            // so remove the db file
            this.close();
            file.remove(false);
            this.open(file);
            break;
         case 0:
            // upgrade the schema
            if (!this.upgrade()) {
               throw "Cannot upgrade DAISY database.";
            }
            break;
         case 1:
            break;
      }
   } else {
      this.connection = storageService.openDatabase(file);
      this.createSchema();
   }

}

DAISYDB.prototype.upgrade = function() {
   if (this.version=="1.0.0") {
      DAISYService.console.log("Upgrading database version "+this.version);
      var needsUpgrade = true;
      try {
         var statement = this.connection.createStatement("select position from recent_books limit 1");
         if (statement.executeStep()) {
            needsUpgrade = false;
         }
      } catch (ex) {
         DAISYService.console.log("The 'position' column needs to be added to the recent_books table.");
      }

      if (needsUpgrade) {
         DAISYService.console.log("Updating recent_books..");

         try {
            this.connection.executeSimpleSQL("alter table recent_books add column position TEXT");
         } catch (ex) {
            DAISYService.console.log("Cannot add 'position' column to 'recent_books', error: "+ex);
            return false;
         }
         /*
         // alter table does not seem to work
         DAISYService.console.log("Getting book history..");
         var history = [];
         var statement = this.connection.createStatement("select title,url,used from recent_books order by used desc");
         while (statement.executeStep()) {
            history.push({
               title: statement.getString(0),
               url: statement.getString(1),
               used: statement.getInt64(2),
            })
         }
         try {
            this.connection.executeSimpleSQL("drop table if exists recent_books");
         } catch (ex) {
            DAISYService.console.log("Cannot drop recent_books table in database version "+this.version+", error: "+ex);
            return false;
         }

         DAISYService.console.log("Restoring book history...");
         for (var i=0; i<history.length; i++) {
            this.bookViewed(history[i].title,history[i].url,null,history[i].used);
         }
         */
         DAISYService.console.log("Table recent_books updated.");
      }
      
      DAISYService.console.log("Updating database version to "+DAISYDB.SCHEMA_INFO);
      statement = this.connection.createStatement("delete from version");
      while (statement.executeStep()) { }
      statement = this.connection.createStatement("insert into version (info) values (?1)");
      statement.bindUTF8StringParameter(0,DAISYDB.SCHEMA_INFO);
      while (statement.executeStep()) { }
      this.version = DAISYDB.SCHEMA_INFO;
      return true;
   } else {
      DAISYService.console.log("No upgrade for database version "+this.version);
      // no upgrade available
      return false;
   }
}

DAISYDB.SCHEMA_INFO = "1.1.0";

DAISYDB.prototype.checkSchema = function() {
   if (!this.connection.tableExists("version")) {
      return -1;
   }
   var statement = this.connection.createStatement("select info from version");
   if (statement.executeStep()) {
      this.version = statement.getString(0);
      if (this.version==DAISYDB.SCHEMA_INFO) {
         return 1;
      }
   }
   return 0;

}

DAISYDB.prototype.createSchema = function() {
   if (!this.connection.tableExists("version")) {
      this.connection.createTable("version","info TEXT");
   }
   if (!this.connection.tableExists("recent_books")) {
      this.connection.createTable("recent_books","id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT, url TEXT, used TIMESTAMP, position TEXT");
   }
   if (!this.connection.tableExists("notes")) {
      this.connection.createTable("notes","id INTEGER PRIMARY KEY AUTOINCREMENT,url TEXT,updated TIMESTAMP,xpath TEXT,name TEXT,note TEXT");
   }

   var statement = this.connection.createStatement("insert into version (info) values (?1)");
   statement.bindUTF8StringParameter(0,DAISYDB.SCHEMA_INFO);
   while (statement.executeStep()) { }

}

DAISYDB.prototype.close = function() {
   this.connection.close();
}

DAISYDB.prototype.getBookHistory = function(limit) {
   var history = [];
   var statement = this.connection.createStatement("select title,url,position from recent_books order by used desc"+(limit ? " limit "+limit : ""));
   while (statement.executeStep()) {
      history.push({
         title: statement.getString(0),
         url: statement.getString(1),
         position: statement.getString(2)
      });
   }
   return history;
}

DAISYDB.prototype.bookViewed = function(title,url,position,used) {
   var hash = url.indexOf("#");
   if (hash>0) {
      if (!position) {
         position = url.substring(hash+1);
         var q = position.indexOf("?");
         if (q>=0) {
            position = position.substring(0,q);
         }
      }
      url = url.substring(0,hash);
   }
   this.removeBookHistory(url);
   if (title==null) {
      title = url;
   }
   var statement = this.connection.createStatement("insert into recent_books (title,url,position,used) values (?1,?2,?3,?4)");
   statement.bindUTF8StringParameter(0,title);
   statement.bindUTF8StringParameter(1,url);
   statement.bindUTF8StringParameter(2,position);
   statement.bindInt64Parameter(3,used ? used : (new Date()).getTime());
   while (statement.executeStep()) { }
}

DAISYDB.prototype.removeBookHistory = function(url) {
   var hash = url.indexOf("#");
   if (hash>0) {
      url = url.substring(0,hash);
   }
   var statement = this.connection.createStatement("delete from recent_books where url=?1");
   statement.bindUTF8StringParameter(0,url);
   while (statement.executeStep()) { }
}

DAISYDB.prototype.addNote = function(url,xpath,name,note) {
   var hash = url.indexOf("#");
   if (hash>0) {
      url = url.substring(0,hash);
   }
   var updated = (new Date()).getTime();
   var statement = this.connection.createStatement("insert into notes (url,updated,xpath,name,note) values (?1,?2,?3,?4,?5)");
   statement.bindUTF8StringParameter(0,url);
   statement.bindInt64Parameter(1,updated);
   statement.bindUTF8StringParameter(2,xpath);
   statement.bindUTF8StringParameter(3,name);
   statement.bindUTF8StringParameter(4,note);
   while (statement.executeStep()) { }

   return {
      id: this.connection.lastInsertRowID,
      url: url,
      updated: updated,
      xpath: xpath,
      name: name,
      note: note
   };
}

DAISYDB.prototype.updateNote = function(a,b,c) {
   var id = a.id ? a.id : a;
   var name = a.id ? a.name : b;
   var note = a.id ? a.note : c;
   var updated = (new Date()).getTime();
   var statement = this.connection.createStatement("update notes set name=?1,note=?2,updated=?3 where id=?4");
   statement.bindUTF8StringParameter(0,name);
   statement.bindUTF8StringParameter(1,note);
   statement.bindInt64Parameter(2,updated);
   statement.bindInt32Parameter(3,id);
   statement.executeStep();
   if (a.id) {
      a.updated = updated;
   }
}

DAISYDB.prototype.removeNotes = function(url) {
   var hash = url.indexOf("#");
   if (hash>0) {
      url = url.substring(0,hash);
   }
   var statement = this.connection.createStatement("delete from notes where url=?1");
   statement.bindUTF8StringParameter(0,url);
   while (statement.executeStep()) { }
}

DAISYDB.prototype.removeNote = function(note) {
   var statement = this.connection.createStatement("delete from notes where id=?1");
   if (note.id) {
      statement.bindInt32Parameter(0,note.id);
   } else {
      statement.bindInt32Parameter(0,note);
   }
   while (statement.executeStep()) { }
}

DAISYDB.prototype.getNotes = function(url,limit) {
   var notes = [];
   var statement = this.connection.createStatement("select id,url,updated,xpath,name,note from notes where url=?1"+(limit ? " limit "+limit : ""));
   statement.bindUTF8StringParameter(0,url);
   while (statement.executeStep()) {
      notes.push({
         id: statement.getInt32(0),
         url: statement.getString(1),
         updated: statement.getInt64(2),
         xpath: statement.getString(3),
         name: statement.getString(4),
         note: statement.getString(5)
      });
   }
   return notes;
}
