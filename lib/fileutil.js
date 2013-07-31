var fs = require('fs'), // read/write files
    nodefs = require('node-fs'),
    wrench = require('wrench'),
    path = require('path');

var Message = require('./message.js');

var FileUtil = module.exports = {
  
  getMinty : function(input, opts, filterFn, fn) {
    var extn = opts.extnType, 
        isRecursive = opts.isRecursive;

    filterFn = filterFn || function () { return true; };

    // upon discovery of emacs backup files, stops reading dir
    (function getMints(input, cb) {
      var results = [];
      fs.stat(input, function(err, stat) {      
        if (err || !stat) return fn(Message.error.pathInvalid(input));        
        
        if (stat.isDirectory()) {
          fs.readdir(input, function(err, inputArr) {
            if (err) return cb(err);
            (function next() {
              var file = (inputArr.length) ? inputArr.pop() : null;
              if (!file) return cb(null, results);
              file = path.join(input, file);
              fs.stat(file, function(err, stat) {
                if (err) return cb(err);
                if (stat && stat.isDirectory()) {
                  if (!isRecursive) return next();
                  getMints(file, function(err, res) {
                    if (res) {
                      results = results.concat(res);                                        
                    }
                    next();
                  });
                } else if (stat && stat.isFile()) {
                  if (filterFn(file, opts)) {
                    results.push(file);                
                  }
                  next();
                }
              });
            }());
          });
        } else if (stat.isFile()) {
          if (filterFn(input, opts)) {
            results.push(input);                
          }
          cb(null, results);
        } else {
          cb(null, results);
        }
      });
    }(input, fn));
  },


  getFile : function (file, fn) {
    fs.readFile(file, 'ascii', function(err, fd) {
      if (err) return fn(Message.pathInvalid(file));
      fn(err, fd);
    });
  },


  // get files recursively. 
  //
  // exampleOptions = {
  //   extnType : 'js'
  //   isRecursive : true,
  //   inputPath : '/home/bumblehead'
  // }
  getFiles : function (opts, fn) {
    var that = this, 
        input = opts.inputPath;

    fs.stat(input, function(err, stat) {
      if (err) return fn(Message.pathInvalid(input));

      opts.isPassingFilename = that.isPassingFilename;
      FileUtil.getMinty(input, opts, function (filename, opts) {
        return that.isPassingFilename(filename, opts);
      }, fn);
    });
  },

  getFilesArr : function (dirname, opts, fn) {
    fs.stat(dirname, function(err, stat) {      
      if (err || !stat || !stat.isDirectory()) return fn(Message.error.pathInvalid(dirname));        

      fs.readdir(dirname, function (err, resArr) {
        if (err) return fn(err);

        // loop through each file in response...

      });

    });
  },

  getSubDirectories : function (opts, fn) {
    var dir = opts.inputDir;
    fs.stat(dir, function(err, stat) {      
      if (err || !stat) return fn(Message.error.pathInvalid(dir));        
      if (stat.isDirectory()) {
        fs.readdir(dir, function (err, res) {
          if (err) return fn(err);
          res = res.filter(function (subDir) {
            return fs.statSync(path.join(dir, subDir)).isDirectory();
          });
          fn(null, res);
        });
      } else {
        fn('[!!!] not a valid directory');
      }
    });
  },

  copyDir : function (inputDir, outputDir, fn) {
    nodefs.mkdir(outputDir, 0755, true, function (err, res) {
      if (err) return fn(err);    
      wrench.copyDirRecursive(inputDir, outputDir, fn);
    });
  },

  getSubPaths : function (opts, fn) {
    var dir = opts.inputDir;
    fs.stat(dir, function(err, stat) {      
      if (err || !stat) return fn(Message.pathInputInvalid(dir));        
      if (stat.isDirectory()) {
        fs.readdir(dir, fn);
      } else {
        fn('[!!!] not a valid directory');
      }
    });
  },

  // should be refactored
  isPassingFilename : function (filename, opts) {
    var fileextn = path.extname(filename),      
        basename = path.basename(filename, fileextn),
        optExtnType = opts.extnType || '',
        optIsMintFilter = opts.isMintFilter;
    
    if (!fileextn.match(/md$/)) return false;

    if (optExtnType && optExtnType !== fileextn) {
      return false;
    }

    if (optIsMintFilter && !basename.match(/_mint$/)) {
      return false;
    }

    return true;
  },

  // only creates the path if it does not exist
  // https://github.com/bpedro/node-fs/blob/master/lib/fs.js
  createPath : function (directory, fn) {
    fs.stat(directory, function (err, stat) { 
      if (stat && stat.isDirectory()) {
        fn(null, directory);
      } else {
        
        nodefs.mkdir(directory, 0755, true, function (err, res) {
          if (err) return fn(err);
          fn(err, res);
        });
      }
    });
  },

  writeRecursive : function (filename, content, fn) {
    var that = this,
        dirPath = path.dirname(filename);

    that.createPath(dirPath, function (err, res) {
      if (err) return fn(err);    
      fs.writeFile(filename, content, fn);
    });
  }

};