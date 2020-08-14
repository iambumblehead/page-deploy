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
    const supportInput = deploy_paths.pathsupportdir(rootfilename),
          supportOutput = deploy_paths.pathsupportdir(outfilename);

    if (deploy_file.isdir(supportInput)) {
      deploy_file.createPath(supportOutput, (err, res) => {
        if (err) return fn(err);

        rcp(supportInput, supportOutput, { overwrite : true }, (err, res) => {
          if (err) return fn(err);

          deploy_msg.convertedfilename(opts, supportOutput);

          fn(null, 'success');
        });          
      });
    } else {
      fn(null, null);
    }
  };

  return o;
})({});
