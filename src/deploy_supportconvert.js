// Filename: deploy_supportconvert.js  
// Timestamp: 2017.09.03-06:01:32 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>
//
// pickup and use 'support' directory and contents
// for given pattern

import rcp from 'recursive-copy';
      
import deploy_msg from './deploy_msg.js';
import deploy_file from './deploy_file.js';
import deploy_paths from './deploy_paths.js';

export default (o => {
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
