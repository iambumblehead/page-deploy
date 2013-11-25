var fs = require('fs'),
    path = require('path'),
    objobjwalk = require('objobjwalk'),
    //fileconverter = require('./fileconverter'),
    fileconverterbase = require('./fileconverterBase'),
    //FileConverterBase = require('./fileconverterBase'),
    fileutil = require('./fileutil'),
    isoutil = require('./ISO/isoutil');

var converter = module.exports = (function() {

  return {

    // read the file, 
    // convert it (markdown), 
    // update support paths and references.
    // write it.

    signalConverting : function (filename, opts) {
      var msg = '[...] read: :directory',
          directory = path.dirname(filename);
      
      directory = directory.replace(opts.inputDir, '');
      directory = directory.replace(/^\//, '');
      //directory = directory.replace(process.env.HOME, '~');
      
      console.log(msg.replace(/:directory/, directory));      
    },

    signalConverted : function (filename, opts) {
      var msg = '[mmm] wrote: :directory',
          directory = path.dirname(filename);
      
      directory = directory.replace(opts.inputDir, '');
      directory = directory.replace(/^\//, '');
      
      console.log(msg.replace(/:directory/, directory));      
    },

    // apply converter
    // get the file. convert it. return it.
    ///////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////
    /*
    getConvertedBaseObj : function (filename, opts, fn) {
      var that = this;

      if (!filename.match(/(json|md)$/)) {
        throw new Error ('only converts json, md.');
      }

      FileConverterBase.getFromFileNew(filename, opts, fn);
    },
     */

    /*
    convertForISO : function (fcobj, opts, fn) {
      var that = this,
          basename = path.basename(fcobj.filename),
          dirname = path.dirname(fcobj.filename),
          extname = path.extname(fcobj.filename),
          prefixname = that.getPrefixName(fcobj.filename),
          isoFilenameArr = isoutil.getFilenameArr(that, opts),
          convertedFileObjArr = [];


      console.log('convert for ISO');
    },
     */
    


    // convert base file, then convert lang files 
    // filename is a 'base' file.
    // copy the base file to the output directory
    // copy lang/locale files to the output directory
    // use 'base' in the stead of missing lang/locale files
    // 
    // should be full obj with locale base state.
    convertFilesForBase : function (filename, opts, fn) {
      var that = this, outputpath, outputStr, dirname;

      if (!filename.match(/(json|md)$/)) {
        throw new Error ('only converts json, md.');
      }

      
      fileconverterbase.getFromFileNew(filename, opts, function (err, fcobj) {
        if (err) return fn(err);

        fcobj.writeAtFilename(filename, opts, function (err, res) {        
          if (err) return fn(err);
          // write the support
          fcobj.writeSupportDir(opts, function (err, res) {
            if (err) return fn(err);

            fcobj.convertForISO(opts, function (err, res) {
              if (err) return fn(err);

              that.signalConverted(filename, opts);

              fn(err, 'success');
            });
          });
        });
      });


/*
      that.getConvertedBaseObj(filename, opts, function (err, baseObj) {
        if (err) return fn(err);


        if (filename.match(/lang-/)) {
          throw new Error('[!!!] do not write lang- files: ', filename);
        }

        console.log('1 END. getconvertedbase', filename);
        baseObj.baseObj.writeAtFilename(filename, opts, function (err, res) {        
          if (err) return fn(err);
          // write the support
          baseObj.baseObj.writeSupportDir(opts, function (err, res) {
            if (err) return fn(err);
            baseObj.convertFilesForISO(filename, baseObj, opts, function (err, res) {
              if (err) return fn(err);

              converter.signalConverted(filename, opts);

              fn(err, 'success');
            });
          });

        });
      });
*/
    }
  };
  
}());


