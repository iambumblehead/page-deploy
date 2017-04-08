// Filename: fileconverterBase.js  
// Timestamp: 2017.04.08-12:55:09 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

const fs = require('fs'),
      path = require('path'),

      deploy_iso = require('./deploy_iso'),    
      deploy_fileconvert = require('./deploy_fileconvert');

// getA Regular fileconvert object... apply it here...
const deploy_converterbase = module.exports = (o => {

  // baseObj,
  // ISOType
  // getConverted
  // getFromStrMatchingISO
  // getPrefixName
  // convertFilesForISO

  var fcbase = Object.create(deploy_fileconvert);

  fcbase.proto.getPrefixName = (filepath) => {
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
  fcbase.proto.getFromStrArrMatchingISO = (filenameArr, ISO, extn) => {
    return filenameArr.find(filename => (
      filename.indexOf(ISO) !== -1 &&
        path.extname(filename) === extn
    ));

    /*
    for (var x = filenameArr.length, f; x--;) {
      if (filenameArr[x].indexOf(ISO) !== -1) {
        f = filenameArr[x];
        if (path.extname(f) === extn) {
          return f;
        }
      }
    }

    return null;
     */
  };

  // return the ISO filenames that should be generated.
  fcbase.proto.getAssocISOFilenameArr = function (opts) {
    var filename = this.filename,
        ISOType = deploy_iso.getBaseType(filename),
        langArr = opts.supportedLangArr,
        localeArr = opts.supportedLocaleArr;

    return deploy_iso.getRequiredFilenameArr(ISOType, langArr, localeArr);
  };

  // return an array of deploy_fileconvert objects suited to the iso options
  // if an iso file is found, return deploy_fileconvert objects from file
  // if no iso file is found, return cloned `this` (a deploy_fileconvert object)
  // matching extension checked for precision.
  fcbase.proto.getAssocISOFileObjArr = function (opts, fn) {
    var that = this,
        filename = that.filename,
        isoFilenameArr = that.getAssocISOFilenameArr(opts),
        isodeploy_fileconvertArr = [],
        extname = path.extname(filename),
        dirname = path.dirname(filename);

    fs.readdir(dirname, function (err, resArr) {
      if (err) return fn(err);

      (function next (x, isoFilename, fcBase) {
        if (!x--) return fn(null, isodeploy_fileconvertArr);

        isoFilename = isoFilenameArr[x];

        if (that.getFromStrArrMatchingISO(resArr, isoFilename, extname)) {
          isoFilename = path.join(dirname, isoFilename + '.json');
          deploy_fileconvert.getFromFileNew(isoFilename, opts, function (err, fcBase) {
            if (err) return fn(err);
            isodeploy_fileconvertArr.push(fcBase);
            next(x);
          });
        } else {
          fcBase = Object.create(that);
          fcBase.filename = path.join(dirname, isoFilename + '.json');
          isodeploy_fileconvertArr.push(fcBase);
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

})({});
