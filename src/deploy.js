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
      deploy_fileconvert = require('./deploy_fileconvert'),

      { UNIVERSAL } = deploy_tokens;

module.exports = (o => {
  o.foreachfile = (opts, filearr, fn, endfn) => {
    if (!filearr.length)
      return endfn(null);
    
    fn(opts, filearr[0], (err, res) => {
      if (err) return endfn(err);

      o.foreachfile(opts, filearr.slice(1), fn, endfn);
    });
  };

  
  o.bfsconvertdir = (opts, input, fn) => {
    if (deploy_file.isdir(!input)) {
      throw new Error(`input must be a file: ${input}`);
    }

    fs.readdir(input, { withFileTypes : true }, (err, direntarr) => {
      if (err) return fn(err);

      o.foreachfile(opts, direntarr, (opts, dirent, donefn) => {
        const filepath = path.join(input, dirent.name);
        
        if (dirent.isFile() &&
            deploy_pattern.patternisvalidinputfilename(dirent.name)) {
          return deploy_fileconvert.convertbase(opts, filepath, donefn);
        }

        if (dirent.isDirectory()) {
          return o.bfsconvertdir(opts, filepath, donefn);
        }

        return donefn(null, null);
      }, (err, res) => {
        if (deploy_file.isdir(path.join(input, UNIVERSAL))) {
          deploy_msg.applyuniverse(opts, path.join(input, UNIVERSAL));
          deploy_fileconvert.applyuniverse(opts, input, (err, res) => {
            if (err) return fn(err);
            
            fn(err, res);
          });
        } else {
          fn(err, res);
        }
      });
    });
  };

  o.convert = (opts, fn) => {
    deploy_msg.start();

    opts = deploy_opts(opts);
    
    o.bfsconvertdir(opts, opts.inputDir, (err, res) => {
      if (err) return deploy_msg.throw(err, err.stack || '');

      deploy_msg.finish();
      if (typeof fn === 'function') {
        fn(null, 'success');
      }
    });
  };

  return o;

})({});
