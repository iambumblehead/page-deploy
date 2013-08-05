var fs = require('fs'),
    path = require('path'),
    glob = require('glob'),
    objobjwalk = require('objobjwalk'),

    fileutil = require('./fileutil'),
    SupportConverter = require('./supportconverter'),
    markedAugmented = require('./marked-augmented');


var FileConverter = module.exports = (function() {

  var fileConverter = {

    // contentObj will be converted to JSON str as final output
    contentObj : null,
    filename : null,

    read : function (filename, fn) {
      fs.readFile(filename, 'utf8', function (err, res) {
        if (err) return fn(new Error(res));
        fn(null, res);
      });
    },

    write : function (filename, content, fn) {
      fs.writeFile(filename, content, function (err, res) {
        if (err) return fn(new Error(res));
        fn(null, res);
      });
    },

    // uses path on filename to construct a full path for support directory
    // 
    getSupportSubDirPath : function (opts) {
      var filename = this.filename,
          dirname = path.dirname(filename),
          inputDir = path.normalize(opts.inputDir),
          supportSubDirPath = dirname.replace(inputDir, '');

      //console.log('supportSubDirPath', opts.publicPath);
      //console.log('supportSubDirPath', supportSubDirPath);
      return supportSubDirPath;
      /*
      var dirPath = this.getDirPath();
      return dirPath.replace(path.normalize(opts.inputDir), '');
       */
    },

    writeSupportDir : function (opts, fn) {
      var that = this;
      var supportConverterObj = SupportConverter.getNew(that.filename);

      supportConverterObj.writeSupportDir(opts, fn);
    },

    // replace support paths found in contentObj strings.
    // 
    // this:
    // <a href="support/img/hand1.jpg">
    // 
    // becomes something like this:
    // <a href="domain.com/public/path/to/support/img/hand1.jpg">
    getWithUpdatedSupportPaths : function (opts, fn) {
      var that = this, supportConverterObj;

      supportConverterObj = SupportConverter.getNew(that.filename);
      supportConverterObj.getUpdatedObj(that.contentObj, opts, function (err, res) {
        if (err) return fn(err);
        fn(null, that);
      });
    },

    getConverted : function (opts, fn) {
      var that = this,
          baseObj = this;

      //if (that.filename.match(/gallery-list/) && that.filename.match(/red-chair/)) {
      //  console.log('converter1 >>>>>>>>> ', that.filename);      
      //}
          
      baseObj.getWithUpdatedSupportPaths(opts, function (err, baseObj) {
        if (err) return fn(err);        
        //that.getUpdatedReferencePaths(fileConvObj, opts, function (err, contentObj) {
        //baseObj.getUpdatedReferencePaths(fileConvObj, opts, function (err, contentObj) {
        baseObj.getUpdatedReferencePaths(opts, function (err, contentObj) {
          if (err) return fn(err);
          baseObj.contentObj = contentObj;
          fn(null, baseObj);
        });              
      })
    },


    getRefPath : function (refPath) {
      var that = this,
          dirpath = path.dirname(that.filename),
          refpath = path.join(dirpath, refPath);

      return refpath;
    },

    getRefPathFilename : function (refPath) {
      var that = this,
          filename = path.basename(that.filename),
          refpath = path.join(that.getRefPath(refPath), filename);

      return refpath;
    },

    // convert like this to an object defined in another file
    // in: { 
    //   inputsArr: [{
    //     type: "local-ref",
    //     path: "./support/blog"
    //   }]
    // }
    // out: {
    //   inputsArr: [
    //     "valueOfSupportBlog"
    //   ]
    // }
    // maybe it should not return a base file?
    // construct a new base obj
    getObjAtLocalRef : function (refObj, opts, fn) {    
      // should be dependent on type of convert obj.
      // fileconverter needs type. type determines the baseObj
      var refpath = refObj.fullpath || this.getRefPathFilename(refObj.path);
      // get from new file... and get converted.
      FileConverter.getFromSimilarFileNew(refpath, opts, function (err, fcobj) {
        if (err) return fn(err);          
        fn(null, fcobj.contentObj);
      });
    },

    getObjArrAtLocalRef : function (refObj, opts, fn) {    
      // should be dependent on type of convert obj.
      // fileconverter needs type. type determines the baseObj
      var that = this,
          refpath = that.getRefPath(refObj.path),
          objArr = [];

      // files are .md
      glob(refpath, {}, function (err, fileArr) {
        if (err) return fn(new Error(err));

        (function next(x, filepath) {
          if (!x--) return fn(null, objArr);
          filepath = fileArr[x];

          that.getObjAtLocalRef({ 
            fullpath : path.join(fileArr[x], path.basename(that.filename))
          }, opts, function (err, obj) {
            if (err) return fn(err);
            objArr.push(obj);
            next(x);
          });
        }(fileArr.length));
      });
    },

    getUpdatedReferencePaths : function (opts, fn) {
      var fileConvObj = this,
          that = this;

      objobjwalk.async(fileConvObj.contentObj, function (objobj, exitFn) {
        var type = objobj.type;

        if (type === 'local-ref') {
          that.getObjAtLocalRef(objobj, opts, exitFn);
        } else if (type === 'local-ref-arr') {
          that.getObjArrAtLocalRef(objobj, opts, exitFn);
        } else {
          exitFn(null, objobj);          
        }
      }, function (err, newObj) {
        if (err) return fn(err);
        fn(null, newObj);
      });
    },

    getOutputPath : function (filepath, opts) {
      var inputDir = opts.inputDir,
          subDir = filepath.replace(inputDir, ''),
          outputPath = path.join(opts.outputDir, subDir);

      outputPath = outputPath.replace(/\.(\S*)$/, '.json');

      return outputPath;
    },

    writeAtFilename : function (filename, opts, fn) {
      var that = this,
          outputpath = that.getOutputPath(filename, opts),
          outputStr = that.getObjAsJSONStr(that.contentObj);            

      fileutil.writeRecursive(outputpath, outputStr, fn);
    },

    getObjAsJSONStr : function (obj) {
      var contentStr = JSON.stringify(obj, null, 2);

      return contentStr;
    }
  };

  return {
    getJSONStrAsObj : function (JSONStr) {
      var obj = null;

      try {
        obj = JSON.parse(JSONStr);        
      } catch (x) {
        throw new Error('[!!!] locale-deploy, parse error: ' + JSONStr);
      }

      return obj;
    },

    getFromJSONNew : function (filename, fileStr, opts) {
      var that = Object.create(fileConverter);

      that.filename = filename;
      that.contentObj = this.getJSONStrAsObj(fileStr);

      return that;
    },

    getFromMDNew : function (filename, fileStr, opts) {
      var that = Object.create(fileConverter);

      that.filename = filename;
      that.contentObj = markedAugmented.getFromStrMetaObj(fileStr);
      that.contentObj.content = markedAugmented(fileStr);

      return that;
    },

    // isoutil.isBaseFilename(input)      
    getFromFileTypeNew : function (filename, fileStr, opts) {
      var that = this,
          extname = path.extname(filename),
          converterObj = null;

      if (extname === '.json') {
        converterObj = that.getFromJSONNew(filename, fileStr);
      } else if (extname === '.md') {
        converterObj = that.getFromMDNew(filename, fileStr);
      } else {
        throw new Error('[!!!] convert-locale, file type not supported: ' + filename);
      }

      return converterObj;
    },

    getFileAsJSON : function (filename, fn) {
      var that = this, obj;
      that.read(filename, function (err, res) {
        if (err) return fn(err);
        obj = that.getAsJSON(res);
        fn(null, obj);
      });
    },
    
    getFromFileNew : function (filename, opts, fn) {
      var that = this,
          fileConverterObj;

      fs.readFile(filename, 'utf8', function (err, res) {
        if (err) return fn(new Error(err));
        fileConverterObj = that.getFromFileTypeNew(filename, res, opts);
        fileConverterObj.getConverted(opts, fn);
      });        
    },

    getFromSimilarFileNew : function (filename, opts, fn) {
      var ext = path.extname(filename),
          dir = path.dirname(filename),
          name = path.basename(filename, ext),
          nameRe = new RegExp(name + '\\.(json|md)');

      fs.readdir(dir, function (err, resArr) {
        if (err) return fn(err);      

        for (var x = resArr.length; x--;) {
          if (resArr[x].match(nameRe)) {
            return FileConverter.getFromFileNew(path.join(dir, resArr[x]), opts, fn);
          }
        }

        return fn(new Error('[...] similar file not found, ' + filename));
      });      
    }
  };

}());