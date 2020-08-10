// Filename: deploy_supportconvert.js  
// Timestamp: 2017.09.03-06:01:32 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>
//
// pickup and use 'support' directory and contents
// for given pattern

const rcp = require('recursive-copy'),
      
      deploy_msg = require('./deploy_msg'),
      deploy_file = require('./deploy_file'),
      deploy_paths = require('./deploy_paths');

module.exports = (o => {
  
  o.writeSupportDir = (opts, rootfilename, outfilename, fn) => {
    // take output and inputdir...
    const inputSupportPath = deploy_paths.pathsupportdir(rootfilename),
          outputSupportPath = deploy_paths.pathsupportdir(outfilename),
          relativeSupportPath = deploy_paths.pathout(opts, outfilename),
          overwrite = true;

    // read dir... if dir, copy
    if (deploy_file.isdir(inputSupportPath)) {
      deploy_file.createPath(outputSupportPath, (err, res) => {
        if (err) return fn(err);

        rcp(inputSupportPath, outputSupportPath, {overwrite}, (err, res) => {
          if (err) return fn(err);

          deploy_msg.convertedfilenamesupport(opts, relativeSupportPath);

          fn(null, 'success');
        });          
      });
    } else {
      fn(null, null);
    }

  };

  return o;
  
})({});
