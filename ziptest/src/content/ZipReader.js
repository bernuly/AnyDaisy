function ZipReader() {
}

ZipReader.prototype.openFile = function(filePath)
{
   this.file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
   this.file.initWithPath(filePath);
   this.is = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
   this.is.init(this.file,0x01,0444,null);
   this.bin = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
   this.bin.setInputStream(this.is);
   
}

ZipReader.prototype.setInputStream = function(is) {
   this.is = is;
   this.bin = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
   this.bin.setInputStream(this.is);
}

ZipReader.prototype.reopen = function() {
   this.is = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
   this.is.init(this.file,0x01,0444,null);
   this.bin = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
   this.bin.setInputStream(this.is);
}

ZipReader.prototype.close = function() {
   if (this.is) {
      this.is.close();
      this.is = null;
      this.bin = null;
   }
}

ZipReader.prototype._read16 = function() {
   return this.bin.read8() + this.bin.read8()*0x100;
}

ZipReader.prototype._read32 = function() {
   return this.bin.read8() + this.bin.read8()*0x100 + this.bin.read8()*0x10000 + this.bin.read8()*0x1000000;
}

ZipReader.prototype._parseVersion = function(value) {
   return {
      major: Math.floor(value/10),
      minor: value % 10
   };
}

ZipReader.prototype._readString = function(length) {
   if (length==0) {
      return "";
   }
   var value = "";
   for (var i=0; i<length; i++) {
      value += String.fromCharCode(this.bin.read8());
   }
   return value;
}

ZipReader.prototype._readArray = function(length) {
   var data = [];
   for (var i=0; i<length; i++) {
      data.push(this.bin.read8());
   }
   return data;
}

ZipReader.prototype.extract = function() {
   while (this.read()) { }
}


ZipReader.prototype.read = function() {
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

ZipReader.prototype.readEntry = function(entry) {

   if (this.onEntry) {
      this.onEntry(entry);
   }
   var offset = 0;
   var dataCRC = new CRC32Stream();
   if (entry.encrypted) {
      this.initKeys();
      offset = 12;
      var header = this._readArray(12);
      for (var i=0; i<header.length; i++) {
         header[i] = this.decryptByte(header[i]);
      }
      var reader = {
         count: entry.compressedSize-offset
      };
      var current = this;
      /*
      reader.readByte = function() {

         if (this.count<=0) {
            return -1;
         }

         var c = current.decryptByte(current.bin.read8());
         dataCRC.next(c);
         this.count--;
         return c;
      };*/
      reader.readByte = function() {

         if (!this.buffer) {
            this.buffer = current._readArray(this.count);
            for (var i=0; i<this.buffer.length; i++) {
               this.buffer[i] = current.decryptByte(this.buffer[i]);
            }
            this.index = 0;
            alert("Deflated: "+this.buffer.join(","));
         }
         if (this.index>=this.buffer.length) {
            return -1;
         }
         dataCRC.next(this.buffer[this.index]);
         //alert(this.buffer[this.index]);
         return this.buffer[this.index++];
      };
      var inflate = new Inflator(reader);
      var data = [];
      var c = 0;
      do {
         c = inflate.readByte();
         if (c) {
            data.push(c);
         }
      } while (c && c>=0);
      alert("Inflated: "+data.join(","));
   } else {
      var count = entry.compressedSize;
      while (count>0) {
         var c = this.bin.read8();
         dataCRC.next(c);
         count--;
      }

   }

   /*
   if (entry.crc32!=dataCRC.get()) {
      throw "Mismatched CRC32: "+entry.crc32+"!="+dataCRC.get();
   }*/
   this.finishEntry(entry);
}

ZipReader.prototype.finishEntry = function(entry) {
   if (entry.dataSpecificCRC) {
      var signature = this._read32();
      entry.crc32            = signature==0x08074b50 ? this._read32() : signature;
      entry.compressedSize   = this._read32();
      entry.uncompressedSize = this._read32();
   }
}

ZipReader.prototype.startEntry = function() {
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

ZipReader.prototype._readDecryptionHeader = function(entry) {

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

ZipReader.prototype.readFileHeader = function() {
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

ZipReader.prototype.readEnd = function() {
   this.diskNumber = this._read16();
   this.startDiskNumber = this._read16();
   this.dirEntryCount = this._read16();
   this.totalDirEntryCount = this._read16();
   this.dirSize = this._read32();
   this.dirOffset = this._read32();
   var len = this._read16();
   this.comment = this._readString(len);
}

ZipReader.prototype.initKeys = function() {
   this.keys = [305419896, 591751049, 878082192];
   for (var i=0; i<this.password.length; i++) {
      this.updateKeys(this.password[i]);
   }
}

ZipReader.prototype.updateKeys = function(c) {
   var i = 1*c;
   this.keys[0] = crc32update(this.keys[0],i);
   this.keys[1] = this.keys[1] + this.keys[0]&0x000000ff;
   this.keys[1] = this.keys[1] * 134775813 + 1;
   this.keys[2] = crc32update(this.keys[2],this.keys[1] >> 24);
}

ZipReader.prototype.decryptByte = function(c) {
   var i = 1*c;
   var temp = (this.keys[2] | 2) & 0x0000ffff;
   var d = ((temp * (temp ^ 1)) & 0x0000ffff) >> 8;
   i = i ^ d;
   this.updateKeys(i);
   return i;
}

/*
var crc32_table = [
	0x00000000, 0x77073096, 0xEE0E612C, 0x990951BA,
	0x076DC419, 0x706AF48F, 0xE963A535, 0x9E6495A3,
	0x0EDB8832, 0x79DCB8A4, 0xE0D5E91E, 0x97D2D988,
	0x09B64C2B, 0x7EB17CBD, 0xE7B82D07, 0x90BF1D91,
	0x1DB71064, 0x6AB020F2, 0xF3B97148, 0x84BE41DE,
	0x1ADAD47D, 0x6DDDE4EB, 0xF4D4B551, 0x83D385C7,
	0x136C9856, 0x646BA8C0, 0xFD62F97A, 0x8A65C9EC,
	0x14015C4F, 0x63066CD9, 0xFA0F3D63, 0x8D080DF5,
	0x3B6E20C8, 0x4C69105E, 0xD56041E4, 0xA2677172,
	0x3C03E4D1, 0x4B04D447, 0xD20D85FD, 0xA50AB56B,
	0x35B5A8FA, 0x42B2986C, 0xDBBBC9D6, 0xACBCF940,
	0x32D86CE3, 0x45DF5C75, 0xDCD60DCF, 0xABD13D59,
	0x26D930AC, 0x51DE003A, 0xC8D75180, 0xBFD06116,
	0x21B4F4B5, 0x56B3C423, 0xCFBA9599, 0xB8BDA50F,
	0x2802B89E, 0x5F058808, 0xC60CD9B2, 0xB10BE924,
	0x2F6F7C87, 0x58684C11, 0xC1611DAB, 0xB6662D3D,
	0x76DC4190, 0x01DB7106, 0x98D220BC, 0xEFD5102A,
	0x71B18589, 0x06B6B51F, 0x9FBFE4A5, 0xE8B8D433,
	0x7807C9A2, 0x0F00F934, 0x9609A88E, 0xE10E9818,
	0x7F6A0DBB, 0x086D3D2D, 0x91646C97, 0xE6635C01,
	0x6B6B51F4, 0x1C6C6162, 0x856530D8, 0xF262004E,
	0x6C0695ED, 0x1B01A57B, 0x8208F4C1, 0xF50FC457,
	0x65B0D9C6, 0x12B7E950, 0x8BBEB8EA, 0xFCB9887C,
	0x62DD1DDF, 0x15DA2D49, 0x8CD37CF3, 0xFBD44C65,
	0x4DB26158, 0x3AB551CE, 0xA3BC0074, 0xD4BB30E2,
	0x4ADFA541, 0x3DD895D7, 0xA4D1C46D, 0xD3D6F4FB,
	0x4369E96A, 0x346ED9FC, 0xAD678846, 0xDA60B8D0,
	0x44042D73, 0x33031DE5, 0xAA0A4C5F, 0xDD0D7CC9,
	0x5005713C, 0x270241AA, 0xBE0B1010, 0xC90C2086,
	0x5768B525, 0x206F85B3, 0xB966D409, 0xCE61E49F,
	0x5EDEF90E, 0x29D9C998, 0xB0D09822, 0xC7D7A8B4,
	0x59B33D17, 0x2EB40D81, 0xB7BD5C3B, 0xC0BA6CAD,
	0xEDB88320, 0x9ABFB3B6, 0x03B6E20C, 0x74B1D29A,
	0xEAD54739, 0x9DD277AF, 0x04DB2615, 0x73DC1683,
	0xE3630B12, 0x94643B84, 0x0D6D6A3E, 0x7A6A5AA8,
	0xE40ECF0B, 0x9309FF9D, 0x0A00AE27, 0x7D079EB1,
	0xF00F9344, 0x8708A3D2, 0x1E01F268, 0x6906C2FE,
	0xF762575D, 0x806567CB, 0x196C3671, 0x6E6B06E7,
	0xFED41B76, 0x89D32BE0, 0x10DA7A5A, 0x67DD4ACC,
	0xF9B9DF6F, 0x8EBEEFF9, 0x17B7BE43, 0x60B08ED5,
	0xD6D6A3E8, 0xA1D1937E, 0x38D8C2C4, 0x4FDFF252,
	0xD1BB67F1, 0xA6BC5767, 0x3FB506DD, 0x48B2364B,
	0xD80D2BDA, 0xAF0A1B4C, 0x36034AF6, 0x41047A60,
	0xDF60EFC3, 0xA867DF55, 0x316E8EEF, 0x4669BE79,
	0xCB61B38C, 0xBC66831A, 0x256FD2A0, 0x5268E236,
	0xCC0C7795, 0xBB0B4703, 0x220216B9, 0x5505262F,
	0xC5BA3BBE, 0xB2BD0B28, 0x2BB45A92, 0x5CB36A04,
	0xC2D7FFA7, 0xB5D0CF31, 0x2CD99E8B, 0x5BDEAE1D,
	0x9B64C2B0, 0xEC63F226, 0x756AA39C, 0x026D930A,
	0x9C0906A9, 0xEB0E363F, 0x72076785, 0x05005713,
	0x95BF4A82, 0xE2B87A14, 0x7BB12BAE, 0x0CB61B38,
	0x92D28E9B, 0xE5D5BE0D, 0x7CDCEFB7, 0x0BDBDF21,
	0x86D3D2D4, 0xF1D4E242, 0x68DDB3F8, 0x1FDA836E,
	0x81BE16CD, 0xF6B9265B, 0x6FB077E1, 0x18B74777,
	0x88085AE6, 0xFF0F6A70, 0x66063BCA, 0x11010B5C,
	0x8F659EFF, 0xF862AE69, 0x616BFFD3, 0x166CCF45,
	0xA00AE278, 0xD70DD2EE, 0x4E048354, 0x3903B3C2,
	0xA7672661, 0xD06016F7, 0x4969474D, 0x3E6E77DB,
	0xAED16A4A, 0xD9D65ADC, 0x40DF0B66, 0x37D83BF0,
	0xA9BCAE53, 0xDEBB9EC5, 0x47B2CF7F, 0x30B5FFE9,
	0xBDBDF21C, 0xCABAC28A, 0x53B39330, 0x24B4A3A6,
	0xBAD03605, 0xCDD70693, 0x54DE5729, 0x23D967BF,
	0xB3667A2E, 0xC4614AB8, 0x5D681B02, 0x2A6F2B94,
	0xB40BBE37, 0xC30C8EA1, 0x5A05DF1B, 0x2D02EF8D
];
*/

// taken from http://www.faqs.org/faqs/compression-faq/part1/section-26.html
var crc32_poly = 0xdebb20e3;

var crc32_table = [];

for (var i=0; i<256; i++) {
   var c = i << 24;
   for (var j = 8; j > 0; --j) {
      c = c & 0x80000000 ? (c << 1) ^ crc32_poly : (c << 1);
   }
   crc32_table.push(c);
}

/*
var crc32_diff = [];
for (var i=0; i<256; i++) {
   if (crc32_table[i]!=crc32_compare[i]) {
      crc32_diff.push(i);
   }
}
setTimeout(function() {
   alert(crc32_diff.join(","));
},2000);*/

function crc32 (values) {

   var crc = 0xFFFFFFFF;

   for (var i=0; i<values.length; i++) {
      var c = values[i] ^ 0x000000ff;
      var index = ((crc >> 24) ^ c) ^ 0x000000ff;
      if (index<0) {
         index = -index;
      }
      crc = (crc << 8) ^ crc32_table[index];
   }
   return ~crc;
}

function crc32update(crc,value) {
   var c = value ^ 0x000000ff;
   var index = ((crc >> 24) ^ c) ^ 0x000000ff;
   if (index<0) {
      index = -index;
   }
   crc = (crc << 8) ^ crc32_table[index];
   return ~crc;
}

function CRC32Stream() {
   this.crc = 0xFFFFFFFF;
}

CRC32Stream.prototype.next = function(value) {
   this.crc = crc32update(this.crc,value);
}

CRC32Stream.prototype.get = function() {
   return this.crc;
}