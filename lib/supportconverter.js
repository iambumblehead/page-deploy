var fs = require('fs'),
    path = require('path'),
    pathpublic = require('pathpublic'),
    objobjwalk = require('objobjwalk'),

    wrench = require('wrench'),
    nodefs = require('node-fs'),

    fileutil = require('./fileutil');


var SupportConverter = module.exports = (function() {
  var supportConverter = {

    supportSubDirName : '/support',

    // supportedFilename is used to construct
    // all paths for the support directory,
    //  - inputPath, outputPath, publicPath
    supportedFilename : '',

    getInputPath : function (opts) {
      var that = this,
          filename = that.supportedFilename,
          dirname = path.dirname(filename),
          inputPath = path.join(dirname, that.supportSubDirName);

      return inputPath;
    },

    getOutputPath : function (opts) {
      var that = this,
          inputDir = path.normalize(opts.inputDir),
          outputDir = path.normalize(opts.outputDir),
          inputPath = that.getInputPath(opts),
          inputPathRel = inputPath.replace(inputDir, ''),
          outputPath = path.join(outputDir, inputPathRel);

      return outputPath;
    },

    getRelativeOutputPath : function (opts) {
      var that = this,
          outputPath = that.getOutputPath(opts),
          relativeOutputPath = outputPath.
            replace(opts.outputDir, '').
            replace(/^[\/\\]/, '');
      
      return relativeOutputPath;
    },

    getPublicPath : function (opts) {
      var that = this,
          outputPath = that.getOutputPath(opts),
          publicPath = pathpublic.get(outputPath, opts.publicPath);

      return publicPath;
    },

    // update the support paths to public support paths.
    getWithPublicPathStr : function (str, opts) {
      var that = this,
          publicPath = that.getPublicPath(opts),
          supportPathRe = /(["']support\/[^'"]*['"]|^(?:\.\/)?support\/[^\b]*)/gi;

      return str.replace(supportPathRe, function (match, m1, m2) {
        return match.replace(/support/, publicPath);
      });
    },

    writeSupportDir : function (opts, fn) {
      var that = this,
          inputSupportPath = that.getInputPath(opts),
          outputSupportPath = that.getOutputPath(opts),
          relativeSupportPath = that.getRelativeOutputPath(opts);

      // read dir... if dir, copy
      fs.stat(inputSupportPath, function(err, stat) {
        if (stat && stat.isDirectory()) {
          // wrench mkdir throws an error on mkdirSyncRecursive,
          // 'directory does not exist' -really?
          //          wrench.mkdirSyncRecursive(fileObjSupportPathNew, 0777);          
          nodefs.mkdir(outputSupportPath, 0755, true, function (err, res) {
            if (err) return fn(err);    
            // 1.5.0+
            //wrench.copyDirRecursive(fileObjSupportPath, fileObjSupportPathNew, {
            //  forceDelete: true
            //}, function (err, res) {
            //
            // 1.4.4
            wrench.copyDirRecursive(inputSupportPath, outputSupportPath, function (err, res) {
              if (err) return fn(err);    
              console.log('[mmm] write: support, ' + relativeSupportPath);
              fn(null, 'success');
            });          
          });
        } else {
          fn(null, null);
        }
      });
    },

    getUpdatedObjSupportPaths : function (obj, opts) {
      var that = this;

      obj = objobjwalk.type('string', obj, function (ob) {
        return that.getWithPublicPathStr(ob, opts);
      });

      return obj;
    },

    getUpdatedObj : function (obj, opts, fn) {
      var that = this;

      obj = that.getUpdatedObjSupportPaths(obj, opts);

      fn(null , 'success');
    }
    
    
  };

  return {
    prototype : supportConverter,

    getNew : function (supportedFilename) {
      var that = Object.create(supportConverter);
      that.supportedFilename = supportedFilename;
      return that;
    }
  };

}());