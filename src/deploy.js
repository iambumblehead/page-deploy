// Filename: deploy.js  
// Timestamp: 2017.08.13-14:18:43 (last modified)
// Author(s): Bumblehead (www.bumblehead.com)
//
// uses gfm (github-flavored-markdown): https://github.com/chjj/marked


var fs = require('fs'),
    path = require('path'),
    argv = require('optimist').argv,

    deploy_msg = require('./deploy_msg'),
    deploy_opts = require('./deploy_opts'),    
    deploy_file = require('./deploy_file'),
    deploy_pattern = require('./deploy_pattern'),    
    deploy_fileconvert = require('./deploy_fileconvert'),

    input = argv.i || null;

const deploy = module.exports = (o => {
  
  // be careful building  a data array...
  // base data array should not be overwritten. need a merged array.
  //
  // should only replace relative directory if it specificies and
  // existing relative path.
  o.breadthFirstDirectory = (inputdir, opts, fn) => {    
    fs.readdir(inputdir, (err, resarr) => {
      if (err) return fn(err);

      (function next(x, subDir) {
        if (!x--) return fn(null, []);

        let fulldir = path.join(inputdir, resarr[x]);
        
        o.breadthFirstConvert(fulldir, opts, (err, res) => {
          if (err) return fn(err);
          
          next(x);
        });
      }(resarr.length));
    });      
  };
  
  // recurse through directories, depth-first.
  // identify locale files ('base'|\S\S-\S\S).(json|md)
  // update references in either type.
  // write the new content to outputDir
  o.breadthFirstConvert = (input, opts, fn) => {
    fs.stat(input, (err, stat) => {
      if (err) return fn(err);

      if (stat.isDirectory()) {
        o.breadthFirstDirectory(input, opts, fn);
      } else if (stat.isFile() &&
                 deploy_pattern.isvalidpatternfilename(input)) {
        
        deploy_fileconvert.convertFilesForBase(input, opts, fn);
      } else {
        fn(null, null);
      }
    });
  };

  o.convert = (opts, fn) => {
    deploy_msg.start();
    
    o.breadthFirstConvert(opts.inputDir, opts, (err, res) => {
      if (err) return console.log(err, (err.stack) ? err.stack : '');

      deploy_msg.finish();
      
      if (typeof fn === 'function') {
        fn(null, 'success');
      }
    });
  };

  return o;

})({});

// if called from command line...
if (require.main === module) {
  var opts = deploy_opts.getNew(argv);

  deploy.convert(opts, (err, res) => {
    if (err) return console.log(err);
    console.log('[...] finished.');
  });
} 
