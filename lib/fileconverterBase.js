var fs = require('fs'),
    path = require('path');

var isoutil = require('./ISO/isoutil');
var fileconverter = require('./fileconverter');


// getA Regular fileconvert object... apply it here...

var FileConverterBase = module.exports = (function() {

  // baseObj,
  // ISOType
  // getConverted
  // getFromStrMatchingISO
  // getPrefixName
  // convertFilesForISO

  var fcbase = Object.create(fileconverter);

  fcbase.proto.getPrefixName = function (filepath) {
    var prefixRe = /^(.*-)?base(?:LangLocale|Lang|Locale)/,
        prefixname = '',
        prefixmatch;

    if (typeof filepath === 'string') {
      prefixmatch = path.basename(filepath).match(prefixRe);
      if (prefixmatch) {
        prefixname = prefixmatch[1];
      }
    }

    return prefixname;
  };

  // return a matching ISO file from an array of filenames
  // 
  // << ['en-US.json', 'es-ES.json'], 'en-US', '.json'
  // >> 'en-US.json'
  // 
  // << ['en-US.json', 'es-ES.json'], 'en-US', '.md'
  // >>  null
  fcbase.proto.getFromStrArrMatchingISO = function (filenameArr, ISO, extn) {
    for (var x = filenameArr.length, f; x--;) {
      if (filenameArr[x].indexOf(ISO) !== -1) {
        f = filenameArr[x];
        if (path.extname(f) === extn) {
          return f;
        }
      }
    }
    
    return null;
  },

  // return the ISO filenames that should be generated.
  fcbase.proto.getAssocISOFilenameArr = function (opts) {
    var filename = this.filename,
        ISOType = isoutil.getBaseType(filename),
        langArr = opts.supportedLangArr,
        localeArr = opts.supportedLocaleArr;

    return isoutil.getRequiredFilenameArr(ISOType, langArr, localeArr);
  };

  // return an array of fileconverter objects suited to the iso options
  // if an iso file is found, return fileconverter objects from file
  // if no iso file is found, return cloned `this` (a fileconverter object)
  // matching extension checked for precision.
  fcbase.proto.getAssocISOFileObjArr = function (opts, fn) {
    var that = this,
        filename = that.filename,
        isoFilenameArr = that.getAssocISOFilenameArr(opts),
        isoFileconverterArr = [],
        extname = path.extname(filename),
        dirname = path.dirname(filename);

    fs.readdir(dirname, function (err, resArr) {
      if (err) return fn(err);

      (function next (x, isoFilename, fcBase) {
        if (!x--) return fn(null, isoFileconverterArr);

        isoFilename = isoFilenameArr[x];

        if (that.getFromStrArrMatchingISO(resArr, isoFilename, extname)) {
          isoFilename = path.join(dirname, isoFilename + '.json');
          fileconverter.getFromFileNew(isoFilename, opts, function (err, fcBase) {
            if (err) return fn(err);
            isoFileconverterArr.push(fcBase);
            next(x);
          });
        } else {
          fcBase = Object.create(that);
          fcBase.filename = path.join(dirname, isoFilename + '.json');
          isoFileconverterArr.push(fcBase);
          next(x);
        }
      }(isoFilenameArr.length));
    });
  };


  fcbase.proto.convertForISO = function (opts, fn) {
      var that = this;

     // needs to write files not found in isofilenamearr.
     that.getAssocISOFileObjArr(opts, function (err, fileObjArr) {
       if (err) return fn(err);

        (function next (x, fileObj) {
          if (!x--) return fn(null, fileObjArr);         

          fileObj = fileObjArr[x];
          fileObj.updateWrite(fileObj.filename, opts, function (err, res) {
            if (err) return fn(err);
            next(x);
          });
        }(fileObjArr.length));
     });
  };

  return fcbase;

}());
