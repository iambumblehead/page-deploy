// Filename: converter.js  
// Timestamp: 2017.03.25-22:07:40 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

const fs = require('fs'),
      path = require('path'),
      
      deploy_converterbase = require('./deploy_converterbase');

const deploy_converter = module.exports = (o => {

  // read the file, 
  // convert it (markdown), 
  // update support paths and references.
  // write it.
  o.signalConverting = (filename, opts) => {
    var msg = '[...] read: :directory',
        directory = path.dirname(filename);
    
    directory = directory.replace(opts.inputDir, '');
    directory = directory.replace(/^\//, '');
    //directory = directory.replace(process.env.HOME, '~');
    
    console.log(msg.replace(/:directory/, directory));      
  };

  o.signalConverted = (filename, opts) => {
    var msg = '[mmm] wrote: :directory',
        directory = path.dirname(filename);
    
    directory = directory.replace(opts.inputDir, '');
    directory = directory.replace(/^\//, '');
    
    console.log(msg.replace(/:directory/, directory));      
  },

  // convert base file, then convert lang files 
  // filename is a 'base' file.
  // copy the base file to the output directory
  // copy lang/locale files to the output directory
  // use 'base' in the stead of missing lang/locale files
  // 
  // should be full obj with locale base state.
  o.convertFilesForBase = (filename, opts, fn) => {
    if (!filename.match(/(json|md)$/)) {
      throw new Error ('only converts json, md.');
    }
    
    deploy_converterbase.getFromFileNew(filename, opts, (err, fcobj) => {
      if (err) return fn(err);

      fcobj.writeAtFilename(filename, opts, (err, res) => {
        if (err) return fn(err);
        // write the support
        fcobj.writeSupportDir(opts, (err, res) => {
          if (err) return fn(err);

          fcobj.convertForISO(opts, (err, res) => {
            if (err) return fn(err);

            o.signalConverted(filename, opts);

            fn(err, 'success');
          });
        });
      });
    });
  };

  
})({});


