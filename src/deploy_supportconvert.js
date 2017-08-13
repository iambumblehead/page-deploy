// Filename: deploy_supportconvert.js  
// Timestamp: 2017.08.13-16:25:45 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>
//
// pickup and use 'support' directory and contents
// for given pattern

const fs = require('fs'),
      rcp = require('recursive-copy'),
      path = require('path'),      
      nodefs = require('node-fs'),      
      pathpublic = require('pathpublic'),
      
      deploy_msg = require('./deploy_msg'),
      deploy_paths = require('./deploy_paths');

module.exports = (o => {
  
  o.writeSupportDir = (opts, rootfilename, outfilename, fn) => {
    // take output and inputdir...
    const inputSupportPath = deploy_paths.pathsupportdir(rootfilename),
          outputSupportPath = deploy_paths.pathsupportdir(outfilename),
          relativeSupportPath = deploy_paths.pathout(opts, outfilename);

    // read dir... if dir, copy
    fs.stat(inputSupportPath, (err, stat) => {
      if (stat && stat.isDirectory()) {
        nodefs.mkdir(outputSupportPath, 0755, true, (err, res) => {
          if (err) return fn(err);

          rcp(inputSupportPath, outputSupportPath, {
            overwrite: true
          }, (err, res) => {
            if (err) return fn(err);

            deploy_msg.convertedfilenamesupport(relativeSupportPath, opts);

            fn(null, 'success');
          });          
        });
      } else {
        fn(null, null);
      }
    });
  };

  return o;
  
})({});
