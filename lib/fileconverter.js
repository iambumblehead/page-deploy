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

    // be careful using this. for speed does not verify typeof 'a'.
    getValueAtNamespaceStr : function (namespaceStr, obj) {
      // from carlocci in #javascript
      return namespaceStr.split('.').reduce(function(a, b) { 
        return (a) ? a[b] : null; 
      }, obj);
    },

    // uses path on filename to construct a full path for support directory
    // 
    getSupportSubDirPath : function (opts) {
      var filename = this.filename,
          dirname = path.dirname(filename),
          inputDir = path.normalize(opts.inputDir),
          supportSubDirPath = dirname.replace(inputDir, '');

      return supportSubDirPath;
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

    getWithUpdatedLangKeys : function (opts, fn) {
      var that = this,
          filename = that.filename,
          langpath;

      if (!filename.match(/spec-/)) return fn(null, that);

      langpath = that.filename.replace(/spec-.*/, 'lang-baseLang.json');

      FileConverter.getFromSimilarFileNew(langpath, opts, function (err, langobj) {        
        if (!langobj) return fn(null, that.contentObj);

        that.updateLangKeys(that.contentObj, langobj.contentObj, function (err, res) {
          that.contentObj = res;

          that.updateLangDefs(that.contentObj, langobj.contentObj, function (err, res) {
            fn(null, that.contentObj);            
          });
        });        
      });
    }, 
    
    getConverted : function (opts, fn) {
      var that = this,
          baseObj = this;

      if (baseObj.isConverted) return fn(null, baseObj);
      
      baseObj.getWithUpdatedSupportPaths(opts, function (err, baseObj) {
        if (err) return fn(err);        
        baseObj.getUpdatedReferencePaths(opts, function (err, contentObj) {
          if (err) return fn(err);

          baseObj.contentObj = contentObj;
          baseObj.getWithUpdatedLangKeys(opts, function (err, res) {
            baseObj.isConverted = true;
            fn(null, baseObj);
          });
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

    // takes a keys object and replaces `langkey` properties
    // with corresponding value from keys obj
    updateLangKeys : function (contentObj, langObj, fn) {
      var that = this;

      objobjwalk.async(contentObj, function (objobj, exitFn) {
        if (objobj.langkey) {
          exitFn(null, langObj[objobj.langkey]);
        } else if (objobj.langobj) {
          exitFn(null, langObj);
        } else {
          exitFn(null, objobj);
        }
      }, function (err, newObj) {
        if (err) return fn(err);
        fn(null, newObj);
      });
    },

    //objobjwalk.type = function (type, obj, filterFn) {
    updateLangDefs : function (contentObj, langObj, fn) {
//      objobjwalk.asynctype('string', contentObj, function (str, exitFn) {
      var that = this;
      objobjwalk.type('string', contentObj, function (str) {
        if (str === 'pd.langobj') {
          return langObj;
        } else if (str.match(/^pd\.langkey\./)) {
          return that.getValueAtNamespaceStr(str.replace(/^pd\.langkey\./, ''), langObj) || str;
        }

        return str;
      });

      fn(null, contentObj);
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
      var that = this;
      var refpath = refObj.fullpath || this.getRefPathFilename(refObj.path);
      
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
      var that = this;

      objobjwalk.async(that.contentObj, function (objobj, exitFn) {
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

      // all files saved as json.
      outputPath = outputPath.replace(/\.(\S*)$/, '.json');
      // remove -spec, -lang prefix
      outputPath = outputPath.replace(/spec-|lang-/, '');

      return outputPath;
    },

    writeAtFilename : function (filename, opts, fn) {
      var that = this,
          outputpath = that.getOutputPath(filename, opts),
          outputStr = that.getObjAsJSONStr(that.contentObj);            
      
      fileutil.writeRecursive(outputpath, outputStr, fn);
    },

    // not ideal -uses langfilepath to find lang, used
    // to construct path for lang file.
    getLangData : function (filepath, langfilepath, fn) {
      var that = this,
          dirname = path.dirname(filepath),
          langfile = path.join(dirname, 'lang-baseLang.json');

      that.read(langfile, function (err, res) {
        if (err) return fn(err);
        // try getting baseLang after primary lang...
        return fn(null, res);
      });
      
    },

    updateWrite : function (filename, opts, fn) {
      var that = this;

      that.writeAtFilename(filename, opts, fn);
    },

    getObjAsJSONStr : function (obj) {
      var contentStr = JSON.stringify(obj, null, 2);

      return contentStr;
    }
  };

  return {
    proto : fileConverter,

    // a cache of objects constructed here. often referenced 
    // many times, but constructed once only using cache
    fileconverterObjCache : {},

    // filename given here for error scenario only
    getJSONStrAsObj : function (JSONStr, filename) {
      var obj = null;

      try {
        obj = JSON.parse(JSONStr);        
      } catch (x) {
        console.log('[!!!] locale-deploy, parse error: ' + filename);
        throw new Error('[!!!] locale-deploy, parse error: ' + JSONStr);
      }

      return obj;
    },

    getFromJSONNew : function (filename, fileStr, opts) {
      var that = Object.create(fileConverter);

      that.filename = filename;
      that.contentObj = this.getJSONStrAsObj(fileStr, filename);

      return that;
    },

    getFromMDNew : function (filename, fileStr, opts) {
      var that = Object.create(fileConverter);

      that.filename = filename;
      that.contentObj = markedAugmented.getFromStrMetaObj(fileStr);
      that.contentObj.value = markedAugmented(fileStr);

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

      if (that.fileconverterObjCache[filename]) {
        return fn(null, that.fileconverterObjCache[filename]);
      }

      fs.readFile(filename, 'utf8', function (err, res) {
        if (err) return fn(new Error(err));

        fileConverterObj = that.getFromFileTypeNew(filename, res, opts);
        fileConverterObj.getConverted(opts, function (err, fileConverterObj) {
          if (err) return fn(err);

          that.fileconverterObjCache[filename] = fileConverterObj;
          fn(null, fileConverterObj);
        });
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
