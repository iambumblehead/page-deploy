var fs = require('fs'),
    path = require('path');

var isoutil = require('./ISO/isoutil');
var FileConverterObj = require('./fileconverter');
var FileConverter = FileConverterObj;

var FileConverterBase = module.exports = (function() {
  
  var fileConverterBase = {
    baseObj : null,
    ISOType : null,

    getConverted : function (opts, fn) {
      var that = this,
          baseObj = that.baseObj;

      baseObj.getConverted(opts, function (err, res) {
        if (err) return fn(err);
        fn(null, that);
      });
    },

    // return a matching ISO file from an array of filenames
    // 
    // << ['en-US.json', 'es-ES.json'], 'en-US', '.json'
    // >> 'en-US.json'
    // 
    // << ['en-US.json', 'es-ES.json'], 'en-US', '.md'
    // >>  null
    getFromStrArrMatchingISO : function (filenameArr, ISO, extn) {
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

    // takes a baseObj and the path of its associated file.
    // reads the directory for files and for each supported lang, ex. en-US,
    //  - if assoc file found, convert it and save it to output/en-US.json
    //  - if assoc file not found, save baseObj to output/en-US.json
    convertFilesForISO : function (basePath, baseObj, opts, fn) {
      var that = this,
          dirname = path.dirname(basePath),
          extname = path.extname(basePath),
          isoFilenameArr = isoutil.getFilenameArr(that.ISOType, opts),
          convertedFileObjArr = [];

      fs.readdir(dirname, function (err, resArr) {
        if (err) return fn(err);

        (function next (x, ISOFilename) {
          if (!x--) return fn(null, convertedFileObjArr);

          ISOFilename = isoFilenameArr[x] + '';
          ISOFilename = that.getFromStrArrMatchingISO(resArr, ISOFilename, extname);

          if (ISOFilename) {
            ISOFilename = path.join(dirname, ISOFilename);

            FileConverter.getFromFileNew(ISOFilename, opts, function (err, fcBase) {
              if (err) return fn(err);

              fcBase.writeAtFilename(ISOFilename, opts, function (err, res) {
                if (err) return fn(err);
                next(x);
              });
            });
          } else {
            ISOFilename = path.join(dirname, isoFilenameArr[x] + '.json');
            baseObj.baseObj.writeAtFilename(ISOFilename, opts, function (err, res) {
              if (err) return fn(err);
              next(x);
            });
          }
        }(isoFilenameArr.length));
      });
    }
  };

  return {
    getNew : function (baseObj, filename) {
      var that = Object.create(fileConverterBase);
      that.baseObj = baseObj;
      that.ISOType = isoutil.getBaseType(filename);

      return that;
    },

    getFromFileNew : function (filename, opts, fn) {
      var that = this, fileconverterBaseObj;

      FileConverterObj.getFromFileNew(filename, opts, function (err, fileConvObj) {
        if (err) return fn(err);
        fileconverterBaseObj = that.getNew(fileConvObj, filename, opts);
        fileconverterBaseObj.getConverted(opts, fn);
      });
    }
  };

}());
