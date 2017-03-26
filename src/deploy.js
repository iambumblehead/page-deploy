// Filename: page-deploy.js  
// Timestamp: 2017.03.25-21:55:28 (last modified)
// Author(s): Bumblehead (www.bumblehead.com)
//
// uses gfm (github-flavored-markdown): https://github.com/chjj/marked


var fs = require('fs'),
    path = require('path'),
    argv = require('optimist').argv,

    deploy_converter = require('./deploy_converter'),

    deploy_iso = require('./deploy_iso'),
    UserOptions = require('./deploy_opts'),

    input = argv.i || null;

const localeconvert = module.exports = (o => {
  // be careful building  a data array...
  // base data array should not be overwritten. need a merged array.
  //
  // should only replace relative directory if it specificies and
  // existing relative path.

  o.breadthFirstDirectory = (inputDir, opts, fn) => {
    let convertedDirectoryArr = [],
        fullDir;
    
    fs.readdir(inputDir, (err, resArr) => {
      
      (function next(x, subDir) {
        if (!x--) return fn(null, convertedDirectoryArr);

        subDir = resArr[x];
        fullDir = path.join(inputDir, subDir);
        
        o.breadthFirstConvert(fullDir, opts, (err, res) => {
          if (err) return fn(err);          
          next(x);
        });
      }(resArr.length));
    });      
  };
  
  // recurse through directories, depth-first.
  // identify locale files ('base'|\S\S-\S\S).(json|md)
  // update references in either type.
  // write the new content to outputDir
  o.breadthFirstConvert = (input, opts, fn) => {

    fs.stat(input, (err, stat) => {
      if (err) return fn(err);
      if (stat && stat.isDirectory()) {
        o.breadthFirstDirectory(input, opts, fn);
      } else if (stat.isFile() && 
                 deploy_iso.isBaseFilename(input) &&
                 input.match(/(json|md)$/)) {

        deploy_converter.convertFilesForBase(input, opts, fn);
      } else {
        fn(null, null);
      }
    });
  };

  o.convert = (opts, fn) => {
    console.log('[...] page-deploy: begin.');
    o.breadthFirstConvert(opts.inputDir, opts, (err, res) => {
      if (err) return console.log(err, (err.stack) ? err.stack : '');
      console.log('[...] page-deploy done.\n');
      if (typeof fn === 'function') fn(null, 'success');
    });
  };

  return o;

})({});

                                        

// if called from command line...
if (require.main === module) {
  var opts = UserOptions.getNew(argv);
  
  deploy_converter.convert(opts, (err, res) => {
    if (err) return console.log(err);
    console.log('[...] finished.');
  });
  
} 
