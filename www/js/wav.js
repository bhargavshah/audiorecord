/*

wav.js - a javascript audiolib for reading WAVE files

Reads the Format chunk of a WAVE file using the RIFF specification.

Only supports slice() on uncompressed PCM format.
Only supports one Data chunk.

NOTE: Does not auto-correct:
 - Incorrect block alignment values
 - Incorrect Average Samples Per Second value
 - Missing word alignment padding

@author  David Lindkvist
@twitter ffdead

Note : This util was originally created by the above author. For my needs, I needed to get the samples and hence I've modified it.
The original repo is here https://github.com/ffdead/wav.js

*/


/**
 * Constructor: Parse Format chunk of WAV files.
 * 
 * Fires onloadend() function after successful load.
 *
 * @param {File|Blob|ArrayBuffer} RIFF formatted WAV file
 */
function wav(file) {

  // status
  this.EMPTY              = 0; //  No data has been loaded yet.
  this.LOADING            = 1; // Data is currently being loaded.
  this.DONE               = 2; // The entire read request has been completed.
  this.UNSUPPORTED_FORMAT = 3; // Error state - file format not recognized
  this.readyState         = this.EMPTY;
  this.error              = undefined;
  
  // original File and loaded ArrayBuffer
  this.file          = file instanceof File ? file : undefined;
  this.buffer        = file instanceof ArrayBuffer ? file : undefined;

  // alert('file = ' + file);
  
  // format
  this.chunkID       = undefined; // must be RIFF
  this.chunkSize     = undefined;
  this.format        = undefined; // must be WAVE
  this.blockAlign    = undefined;
  this.bitsPerSample = undefined; // 8 bits = 8, 16 bits = 16, etc.
  
  // data chunk
  this.dataOffset    = -1; // index of data block
  this.dataLength    = -1; // size of data block
  
  // let's take a peek
  this.peek();
}

/**
 * Load header as an ArrayBuffer and parse format chunks
 */
wav.prototype.peek = function () {
  
  this.readyState = this.LOADING;

  // see if buffer is already loaded
  if (this.buffer !== undefined) {
    return this.parseArrayBuffer();
  }
  
  var reader = new FileReader();
  var that = this;
  
  reader.readAsArrayBuffer(this.file);
  
  reader.onloadend = function() {  
    that.buffer = this.result;
    that.parseArrayBuffer.apply(that);
  };
};

wav.prototype.parseArrayBuffer = function () {
  try {
    // alert('reached parseArrayBuffer');
    this.parseHeader();
    this.parseData();
    this.parseSamples();
    this.readyState = this.DONE;
    // alert('done parseArrayBuffer');
  }
  catch (e) {
    this.readyState = this.UNSUPPORTED_FORMAT;
    this.error      = e;
  } 
     
  // trigger onloadend callback if exists
  if (this.onloadend) {
    this.onloadend.apply(this);
  }
};
  
/**
 * Walk through RIFF and WAVE format chunk
 * Based on https://ccrma.stanford.edu/courses/422/projects/WaveFormat/
 * and http://www.sonicspot.com/guide/wavefiles.html
 */
wav.prototype.parseHeader = function () {
   
  this.chunkID       = this.readText(0, 4);
  this.chunkSize     = this.readDecimal(4, 4);
  if (this.chunkID !== 'RIFF') throw 'NOT_SUPPORTED_FORMAT';
    
  this.format        = this.readText(8, 4);
  if (this.format !== 'WAVE') throw 'NOT_SUPPORTED_FORMAT';

  // == NumChannels * BitsPerSample/8
  this.blockAlign    = this.readDecimal(32, 2); 

  this.bitsPerSample = this.readDecimal(34, 2);
};

/**
 * Walk through all subchunks and look for the Data chunk
 */
wav.prototype.parseData = function () {

  var foundData = false;

  for (var i = 36; i <= this.chunkSize; i = i + 4 ) {
    if (this.readText(i, 4) === 'data') {
      this.dataLength = this.readDecimal(i + 4, 4);
      this.dataOffset = i + 8;
      foundData = true;
    }
  }

  // alert('foundData' + foundData);

  if ( ! foundData ) {
      throw 'DATA_NOT_FOUND';
  }

};

 /** direct access to  samples
 **/
wav.prototype.parseSamples = function () {

  if (this.bitsPerSample === 8)
    this.dataSamples = new Uint8Array(this.buffer, this.dataOffset);
  else if (this.bitsPerSample === 16)
    this.dataSamples = new Int16Array(this.buffer, this.dataOffset);

}


/**
 * Reads slice from buffer as String
 */
wav.prototype.readText = function (start, length) {
  var a = new Uint8Array(this.buffer, start, length);
  var str = '';
  for(var i = 0; i < a.length; i++) {
    str += String.fromCharCode(a[i]);
  }
  return str;
};

/**
 * Reads slice from buffer as Decimal
 */
wav.prototype.readDecimal = function (start, length) {
  var a = new Uint8Array(this.buffer, start, length);
  return this.fromLittleEndianDecBytes(a);
};

/**
 * Calculates decimal value from Little-endian decimal byte array
 */
wav.prototype.fromLittleEndianDecBytes = function (a) {
  var sum = 0;
  for(var i = 0; i < a.length; i++)
    sum |= a[i] << (i*8);
  return sum;
};

/**
 * Populate Little-endian decimal byte array from decimal value
 */
wav.prototype.tolittleEndianDecBytes = function (a, decimalVal) {
  for(var i=0; i<a.length; i++) {
    a[i] = decimalVal & 0xFF;
    decimalVal >>= 8;
  }
  return a;
};


/**
 * Slice the File using either standard slice or webkitSlice
 */
wav.prototype.sliceFile = function (start, end) {
  if (this.file.slice) return this.file.slice(start, end); 
  if (this.file.webkitSlice) return this.file.webkitSlice(start, end);
};
