// Filename: page-deploy.js  
// Timestamp: 2013.09.28-23:55:29 (last modified)  
// Author(s): Bumblehead (www.bumblehead.com)
//
// uses gfm (github-flavored-markdown): https://github.com/chjj/marked


var fs = require('fs'),
    path = require('path'),
    argv = require('optimist').argv,

    converter = require('./lib/converter'),
    isoutil = require('./lib/ISO/isoutil'),
    UserOptions = require('./lib/useroptions'),
    FileUtil = require('./lib/fileutil'),
    message = require('./lib/message'),
    input = argv.i || null;

var localeconvert = module.exports = {
  // be careful building  a data array...
  // base data array should not be overwritten. need a merged array.
  //
  // should only replace relative directory if it specificies and
  // existing relative path.

  breadthFirstDirectory : function (inputDir, opts, fn) {
    var that = this, convertedDirectoryArr = [], fullDir;
    
    fs.readdir(inputDir, function (err, resArr) {
      (function next(x, subDir) {
        if (!x--) return fn(null, convertedDirectoryArr);

        subDir = resArr[x];
        fullDir = path.join(inputDir, subDir);
        
        that.breadthFirstConvert(fullDir, opts, function(err, res) {
          if (err) return fn(err);          
          next(x);
        });
      }(resArr.length));
    });      
  },
  
  // recurse through directories, depth-first.
  // identify locale files ('base'|\S\S-\S\S).(json|md)
  // update references in either type.
  // write the new content to outputDir
  breadthFirstConvert : function (input, opts, fn) {
    var that = this;

    fs.stat(input, function(err, stat) {
      if (err) return fn(err);
      if (stat && stat.isDirectory()) {
        // read contents
        that.breadthFirstDirectory(input, opts, fn);
      } else if (stat.isFile() && 
                 isoutil.isBaseFilename(input) &&
                 input.match(/(json|md)$/)) {
        
        converter.convertFilesForBase(input, opts, function (err, res) {
          fn(err, res);
        });
      } else {
        fn(null, null);
      }
    });
  },  

  convert : function (opts, fn) {
    console.log('[...] page-deploy: begin.');
    this.breadthFirstConvert(opts.inputDir, opts, function (err, res) {
      if (err) return console.log(err, (err.stack) ? err.stack : '');
      console.log('[...] page-deploy done.\n');
      if (typeof fn === 'function') fn(null, 'success');
    });
  }
};

// if called from command line...
if (require.main === module) {
  var opts = UserOptions.getNew(argv);
  converter.convert(opts, function (err, res) {
    if (err) return console.log(err);
    console.log('[...] finished.');
  });
} 
