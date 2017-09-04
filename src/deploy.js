// Filename: deploy.js  
// Timestamp: 2017.09.03-22:41:45 (last modified)
// Author(s): Bumblehead (www.bumblehead.com)
//
// uses gfm (github-flavored-markdown): https://github.com/chjj/marked


const fs = require('fs'),
      path = require('path'),

      deploy_msg = require('./deploy_msg'),
      deploy_opts = require('./deploy_opts'),    
      deploy_file = require('./deploy_file'),
      deploy_tokens = require('./deploy_tokens'),
      deploy_pattern = require('./deploy_pattern'),    
      deploy_fileconvert = require('./deploy_fileconvert');

module.exports = (o => {

  const {
    UNIVERSAL
  } = deploy_tokens;  

  o.bfsconvertarr = (opts, inputarr, fn) => {
    if (inputarr.length) {
      o.bfsconvert(opts, inputarr[0], (err, res) => {
        if (err) return fn(err);

        o.bfsconvertarr(opts, inputarr.slice(1), fn);
      });
    } else {
      fn(null);
    }
  };

  // recurse through directories, depth-first.
  // identify locale files ('base'|\S\S-\S\S).(json|md)
  // update references in either type.
  // write the new content to outputDir
  o.bfsconvert = (opts, input, fn) => {
    if (deploy_file.isdir(input)) {
      deploy_file.readdirfullpath(input, (err, inputarr) => {
        if (err) return fn(err);

        o.bfsconvertarr(opts, inputarr, (err, res) => {
          if (err) return fn(err);
          
          if (deploy_file.isdir(path.join(input, UNIVERSAL))) {
            deploy_msg.applyuniverse(path.join(input, UNIVERSAL));
            deploy_fileconvert.applyuniverse(opts, input, (err, res) => {
              if (err) return fn(err);

              fn(err, res);
            });
          } else {
            fn(err, res);
          }
        });
      });
    } else if (deploy_file.isfile(input) &&
               deploy_pattern.isvalidpatternfilename(input)) {
      deploy_fileconvert(opts, input, fn);
    } else {
      fn(null, null);
    }
  };

  o.convert = (opts, fn) => {
    deploy_msg.start();

    opts = deploy_opts(opts);
    
    o.bfsconvert(opts, opts.inputDir, (err, res) => {
      if (err) return console.log(err, err.stack ? err.stack : '');

      if (typeof fn === 'function') {
        fn(null, 'success');
      }
    });
  };

  return o;

})({});
