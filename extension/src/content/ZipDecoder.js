function ZipDecoder(filePath) {
   this.path = filePath;
   this.encrypted = false;
}

ZipDecoder.prototype.isEncrypted = function() {
   this.openFile(this.path);
   var current = this;
   var opfTest = /.opf$/;
   this.onEntry = function(entry) {
      if (entry.encrypted) {
         current.encrypted = true;
      }
      if (!entry.fileName.match(opfTest)) {
         throw "DONE";
      }
   }
   try {
      this.extract();
   } catch (ex) {
      if (ex!="DONE") {
         throw ex;
      }
   }
   this.close();
   return this.encrypted;
}

ZipDecoder.prototype.openFile = function(filePath)
{
   this.file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
   this.file.initWithPath(filePath);
   this.is = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
   this.is.init(this.file,0x01,0444,null);
   this.bin = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
   this.bin.setInputStream(this.is);

}

ZipDecoder.prototype.setInputStream = function(is) {
   this.is = is;
   this.bin = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
   this.bin.setInputStream(this.is);
}

ZipDecoder.prototype.reopen = function() {
   this.is = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
   this.is.init(this.file,0x01,0444,null);
   this.bin = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
   this.bin.setInputStream(this.is);
}

ZipDecoder.prototype.close = function() {
   if (this.is) {
      this.is.close();
      this.is = null;
      this.bin = null;
   }
}

ZipDecoder.prototype._read16 = function() {
   return this.bin.read8() + this.bin.read8()*0x100;
}

ZipDecoder.prototype._read32 = function() {
   return this.bin.read8() + this.bin.read8()*0x100 + this.bin.read8()*0x10000 + this.bin.read8()*0x1000000;
}

ZipDecoder.prototype._parseVersion = function(value) {
   return {
      major: Math.floor(value/10),
      minor: value % 10
   };
}

ZipDecoder.prototype._readString = function(length) {
   if (length==0) {
      return "";
   }
   var value = "";
   for (var i=0; i<length; i++) {
      value += String.fromCharCode(this.bin.read8());
   }
   return value;
}

ZipDecoder.prototype._readArray = function(length) {
   var data = [];
   for (var i=0; i<length; i++) {
      data.push(this.bin.read8());
   }
   return data;
}

ZipDecoder.prototype.extract = function() {
   while (this.read()) { }
}


ZipDecoder.prototype.read = function() {
   if (this.bin.available()<4) {
      return false;
   }
   var signature = this._read32();
   switch (signature) {
      case 0x04034b50:
         var entry = this.startEntry(signature);
         this.readEntry(entry);
         break;
      case 0x02014b50:
         this.readFileHeader();
         break;
      case 0x06054b50:
         this.readEnd();
         break;
      default:
         throw "Unrecognized signature: "+signature;
   }
   return true;
}

ZipDecoder.prototype.readEntry = function(entry) {

   if (this.onEntry) {
      this.onEntry(entry);
   }
   var count = entry.compressedSize;
   while (count>0) {
      var c = this.bin.read8();
      count--;
   }

   /*
   if (entry.crc32!=dataCRC.get()) {
      throw "Mismatched CRC32: "+entry.crc32+"!="+dataCRC.get();
   }*/
   this.finishEntry(entry);
}

ZipDecoder.prototype.finishEntry = function(entry) {
   if (entry.dataSpecificCRC) {
      var signature = this._read32();
      entry.crc32            = signature==0x08074b50 ? this._read32() : signature;
      entry.compressedSize   = this._read32();
      entry.uncompressedSize = this._read32();
   }
}

ZipDecoder.prototype.startEntry = function() {
   var entry = {};
   entry.versionNeeded    = this._parseVersion(this._read16());
   entry.flags            = this._read16();
   entry.method           = this._read16();
   entry.modTime          = this._read16();
   entry.modDate          = this._read16();
   entry.crc32            = this._read32();
   entry.compressedSize   = this._read32();
   entry.uncompressedSize = this._read32();
   entry.fileNameLength   = this._read16();
   entry.extraLength      = this._read16();
   entry.encrypted        = (entry.flags & 0x1) ? true : false;
   entry.dataSpecificCRC  = (entry.flags & 0x8) ? true : false;

   entry.fileName = this._readString(entry.fileNameLength);
   entry.extra = this._readArray(entry.extraLength);

   var current = this;
   entry.finish = function() {
   }

   return entry;
}

ZipDecoder.prototype._readDecryptionHeader = function(entry) {

   var decrypt = {};
   var len = 0;
   var ivsize = this._read16();
   len += 2;
   decrypt.ivdata = this._readArray(ivsize);
   len += ivsize;
   decrypt.size = this._read32();
   len += 4;
   decrypt.format = this._read16();
   len += 2;
   if (decrypt.format!=3) {
      throw "Illegal format for decryption header.";
   }
   decrypt.algid = this._read16();
   len += 2;
   decrypt.bitlen = this._read16();
   len += 2;
   decrypt.flags = this._read16();
   len += 2;
   var erdsize = this._read16();
   len += 2;
   decrypt.erddata = this._readArray(erdsize);
   len += erdsize;
   decrypt.reserved1 = this._read32();
   len += 4;
   if (decrypt.reserved1>0) {
      this._read32();
      len += 4;
      var r2size = this._read16();
      len += 2;
      decrypt.r2data = this._readArray(r2size);
      len += r2size;
   }
   var vsize = this._read16();
   len += 2;
   decrypt.vdata = this._readArray(vsize-4);
   len += vsize-4;
   decrypt.vcrc32 = this._read32();
   len += 4;
   return len;
}

ZipDecoder.prototype.readFileHeader = function() {
   var header = {};
   header.versionMadeBy = this._parseVersion(this._read16());
   header.versionNeeded = this._parseVersion(this._read16());
   header.flags = this._read16();
   header.method = this._read16();
   header.modTime = this._read16();
   header.modDate = this._read16();
   header.crc32 = this._read32();
   header.compressedSize = this._read32();
   header.uncompressedSize = this._read32();
   header.fileNameLength = this._read16();
   header.extraLength = this._read16();
   header.commentLength = this._read16();
   header.diskNumberStart = this._read16();
   header.internalAttrs = this._read16();
   header.externalAttrs = this._read32();
   header.relativeOffset = this._read32();
   header.fileName = this._readString(header.fileNameLength);
   header.extra = this._readArray(header.extraLength);
   header.comment = this._readString(header.commentLength);
   return header;
}

ZipDecoder.prototype.readEnd = function() {
   this.diskNumber = this._read16();
   this.startDiskNumber = this._read16();
   this.dirEntryCount = this._read16();
   this.totalDirEntryCount = this._read16();
   this.dirSize = this._read32();
   this.dirOffset = this._read32();
   var len = this._read16();
   this.comment = this._readString(len);
}

ZipDecoder.prototype.initKeys = function() {
   this.keys = [305419896, 591751049, 878082192];
   for (var i=0; i<this.password.length; i++) {
      this.updateKeys(this.password[i]);
   }
}

ZipDecoder.prototype.updateKeys = function(c) {
   var i = 1*c;
   this.keys[0] = crc32update(this.keys[0],i);
   this.keys[1] = this.keys[1] + this.keys[0]&0x000000ff;
   this.keys[1] = this.keys[1] * 134775813 + 1;
   this.keys[2] = crc32update(this.keys[2],this.keys[1] >> 24);
}

ZipDecoder.prototype.decryptByte = function(c) {
   var i = 1*c;
   var temp = (this.keys[2] | 2) & 0x0000ffff;
   var d = ((temp * (temp ^ 1)) & 0x0000ffff) >> 8;
   i = i ^ d;
   this.updateKeys(i);
   return i;
}