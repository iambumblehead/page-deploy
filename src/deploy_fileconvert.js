// Filename: deploy_fileconvert.js  
// Timestamp: 2017.03.25-22:14:41 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

const fs = require('fs'),
      path = require('path'),
      glob = require('glob'),
      objobjwalk = require('objobjwalk'),

      deploy_file = require('./deploy_file'),
      deploy_pattern = require('./deploy_pattern'),
      deploy_supportconvert = require('./deploy_supportconvert'),
      deploy_marked = require('./deploy_marked');

const deploy_fileconvert = module.exports = (o => {

  // contentObj will be converted to JSON str as final output
  o.contentObj = null,
  o.filename = null;

  o.read = (filename, fn) =>
    deploy_file.read(filename, fn),

  o.write = (filename, content, fn) =>
    deploy_file.write(filename, fn),      

  // uses path on filename to construct a full path for support directory
  // 
  o.getSupportSubDirPath = function (opts) {
    var filename = this.filename,
        dirname = path.dirname(filename),
        inputDir = path.normalize(opts.inputDir),
        supportSubDirPath = dirname.replace(inputDir, '');

    return supportSubDirPath;
  };

  o.writeSupportDir = function (opts, fn) {
    var that = this;
    //var supportConverterObj = deploy_supportconvert.getNew(that.filename);

    deploy_supportconvert.writeSupportDir(opts, {
      supportedFilename : that.filename
    }, fn);
  };

  // replace support paths found in contentObj strings.
  // 
  // this:
  // <a href="support/img/hand1.jpg">
  // 
  // becomes something like this:
  // <a href="domain.com/public/path/to/support/img/hand1.jpg">
  o.getWithUpdatedSupportPaths = function (opts, fn) {
    var that = this, supportConverterObj;

    //supportConverterObj = deploy_supportconvert.getNew(that.filename);
    //supportConverterObj.getUpdatedObj(that.contentObj, opts, function (err, res) {
    deploy_supportconvert.getUpdatedObj(that.contentObj, opts, {
      supportedFilename : that.filename
    }, (err, res) => {
      if (err) return fn(err);
      fn(null, that);
    });
  };

  o.getWithUpdatedLangKeys = function (opts, fn) {
    var that = this,
        filename = that.filename,
        langpath;

    if (!filename.match(/spec-/)) return fn(null, that);

    langpath = that.filename.replace(/spec-.*/, 'lang-baseLang.json');

    deploy_fileconvert.getFromSimilarFileNew(langpath, opts, (err, langobj) => {        
      if (!langobj) return fn(null, that.contentObj);

      that.updateLangKeys(that.contentObj, langobj.contentObj, (err, res) => {
        that.contentObj = res;

        that.updateLangDefs(that.contentObj, langobj.contentObj, (err, res) => {
          fn(null, that.contentObj);            
        });
      });        
    });
  };
  
  o.getConverted = function (opts, fn) {
    var that = this,
        baseObj = this;

    if (baseObj.isConverted) return fn(null, baseObj);
    
    baseObj.getWithUpdatedSupportPaths(opts, (err, baseObj) => {
      if (err) return fn(err);        
      baseObj.getUpdatedReferencePaths(opts, (err, contentObj) => {
        if (err) return fn(err);

        baseObj.contentObj = contentObj;
        baseObj.getWithUpdatedLangKeys(opts, (err, res) => {
          baseObj.isConverted = true;
          fn(null, baseObj);
        });
      });              
    });
  };

  o.getRefPath = function (refPath) {
    var that = this,
        dirpath = path.dirname(that.filename),
        refpath = path.join(dirpath, refPath);

    return refpath;
  };

  o.getRefPathFilename = function (refPath) {
    var that = this,
        filename = path.basename(that.filename),
        refpath = path.join(that.getRefPath(refPath), filename);

    return refpath;
  };

  // takes a keys object and replaces `langkey` properties
  // with corresponding value from keys obj
  o.updateLangKeys = (contentObj, langObj, fn) => 
    objobjwalk.async(contentObj, (objobj, exitFn) => {
      if (objobj.langkey) {
        exitFn(null, langObj[objobj.langkey]);
      } else if (objobj.langobj) {
        exitFn(null, langObj);
      } else {
        exitFn(null, objobj);
      }
    }, fn);

  o.updateLangDefs = (contentObj, langObj, fn) => {
    objobjwalk.type('string', contentObj, (str) => {
      if (str === 'pd.langobj') {
        return langObj;
      } else if (str.match(/^pd\.langkey\./)) {
        return deploy_pattern.objlookup(str.replace(/^pd\.langkey\./, ''), langObj) || str;
      }

      return str;
    });

    fn(null, contentObj);
  };

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
  o.getObjAtLocalRef = function (refObj, opts, fn) {
    // should be dependent on type of convert obj.
    // deploy_fileconvert needs type. type determines the baseObj
    var that = this;
    var refpath = refObj.fullpath || this.getRefPathFilename(refObj.path);
    
    deploy_fileconvert.getFromSimilarFileNew(refpath, opts, (err, fcobj) => {
      if (err) return fn(err);          
      fn(null, fcobj.contentObj);
    });
  };

  o.getObjArrAtLocalRef = function (refObj, opts, fn) {    
    // should be dependent on type of convert obj.
    // deploy_fileconvert needs type. type determines the baseObj
    var that = this,
        refpath = that.getRefPath(refObj.path),
        objArr = [];

    // files are .md
    glob(refpath, {}, (err, fileArr) => {
      if (err) return fn(new Error(err));

      (function next(x, filepath) {
        if (!x--) return fn(null, objArr);
        filepath = fileArr[x];

        that.getObjAtLocalRef({ 
          fullpath : path.join(fileArr[x], path.basename(that.filename))
        }, opts, (err, obj) => {
          if (err) return fn(err);
          objArr.push(obj);
          next(x);
        });
      }(fileArr.length));
    });
  };

  o.getUpdatedReferencePaths = function (opts, fn) {
    var that = this;

    objobjwalk.async(that.contentObj, (objobj, exitFn) => {
      var type = objobj.type;

      if (type === 'local-ref') {
        that.getObjAtLocalRef(objobj, opts, exitFn);
      } else if (type === 'local-ref-arr') {
        that.getObjArrAtLocalRef(objobj, opts, exitFn);
      } else {
        exitFn(null, objobj);          
      }
    }, (err, newObj) => {
      if (err) return fn(err);

      fn(null, newObj);
    });
  };

  o.getOutputPath = (filepath, opts) => {
    var inputDir = opts.inputDir,
        subDir = filepath.replace(inputDir, ''),
        outputPath = path.join(opts.outputDir, subDir);

    // all files saved as json.
    outputPath = outputPath.replace(/\.([^.]*)$/, '.json');
    // remove -spec, -lang prefix
    outputPath = outputPath.replace(/spec-|lang-/, '');

    return outputPath;
  };

  o.writeAtFilename = function (filename, opts, fn) {
    var that = this,
        outputpath = o.getOutputPath(filename, opts),
        outputStr = deploy_pattern.stringify(that.contentObj);            
    
    deploy_file.writeRecursive(outputpath, outputStr, fn);
  };

  // not ideal -uses langfilepath to find lang, used
  // to construct path for lang file.
  o.getLangData = (filepath, langfilepath, fn) => {
    let dirname = path.dirname(filepath),
        langfile = path.join(dirname, 'lang-baseLang.json');

    deploy_file.read(langfile, fn);
  };

  o.updateWrite = function (filename, opts, fn) {
    var that = this;

    that.writeAtFilename(filename, opts, fn);
  };

  return {
    proto : o,

    // a cache of objects constructed here. often referenced 
    // many times, but constructed once only using cache
    deploy_fileconvertObjCache : {},

    getFromJSONNew : function (filename, fileStr, opts) {
      var that = Object.create(o);

      that.filename = filename;
      that.contentObj = deploy_pattern.parse(fileStr, filename);

      return that;
    },

    getFromMDNew : function (filename, fileStr, opts) {
      var that = Object.create(o);

      that.filename = filename;
      that.contentObj = deploy_marked.getFromStrMetaObj(fileStr);
      that.contentObj.content = deploy_marked(fileStr);

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

    getFromFileNew : function (filename, opts, fn) {
      var that = this,
          deploy_fileconvertObj;

      if (that.deploy_fileconvertObjCache[filename]) {
        return fn(null, that.deploy_fileconvertObjCache[filename]);
      }

      deploy_file.read(filename, (err, res) => {
        if (err) return fn(new Error(err));

        deploy_fileconvertObj = that.getFromFileTypeNew(filename, res, opts);
        deploy_fileconvertObj.getConverted(opts, (err, deploy_fileconvertObj) => {
          if (err) return fn(err);

          that.deploy_fileconvertObjCache[filename] = deploy_fileconvertObj;
          
          fn(null, deploy_fileconvertObj);
        });
      });        
    },

    getFromSimilarFileNew : function (filename, opts, fn) {
      var ext = path.extname(filename),
          dir = path.dirname(filename),
          name = path.basename(filename, ext),
          nameRe = new RegExp(name + '\\.(json|md)'),
          similarpath;

      fs.readdir(dir, (err, patharr) => {
        if (err) return fn(err);      

        similarpath = patharr.find(path => path.match(nameRe));
        if (similarpath) {
          return deploy_fileconvert.getFromFileNew(path.join(dir, similarpath), opts, fn);
        }

        return fn(new Error('[...] similar file not found, ' + filename));
      });      
    }
  };

})({});







