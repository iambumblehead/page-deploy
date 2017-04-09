// Filename: deploy_fileconvert.js  
// Timestamp: 2017.04.09-01:33:19 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

const fs = require('fs'),
      path = require('path'),
      glob = require('glob'),
      objobjwalk = require('objobjwalk'),

      deploy_msg = require('./deploy_msg'),
      deploy_file = require('./deploy_file'),
      deploy_marked = require('./deploy_marked'),
      deploy_pattern = require('./deploy_pattern'),
      deploy_supportconvert = require('./deploy_supportconvert');

const deploy_fileconvert = module.exports = (o => {

  // contentObj will be converted to JSON str as final output
  o.contentObj = null,
  o.filename = null;

  // replace support paths found in contentObj strings.
  // 
  // this:
  // <a href="support/img/hand1.jpg">
  // 
  // becomes something like this:
  // <a href="domain.com/public/path/to/support/img/hand1.jpg">
  //
  o.getWithUpdatedSupportPaths = (opts, contentobj, filename, fn) =>
    fn(null, objobjwalk.type('string', contentobj, str => (
      deploy_supportconvert.getWithPublicPathStr(str, opts, {
        supportedFilename : filename
      }))));

  o.getWithUpdatedLangKeys = (opts, contentobj, filename, fn) => {
    let langpath = filename.replace(/spec-.*/, 'lang-baseLang.json'),
        langcontent;

    if (!filename.match(/spec-/)) {
      return fn(null, contentobj);
    }
    
    o.getFromSimilarFileNew(langpath, opts, (err, langobj) => {
      if (!langobj) return fn(null, contentobj);

      langcontent = langobj.contentObj;

      o.updateLangKeys(contentobj, langcontent, (err, contentobj) => {

        o.updateLangDefs(contentobj, langcontent, fn);
      });        
    });
  };

  o.convert = (opts, contentobj, filename, fn) => {    
    objobjwalk.async(contentobj, (objobj, exitfn) => {
      if (typeof objobj === 'string') {
        objobj = deploy_supportconvert.getWithPublicPathStr(objobj, opts, {
          supportedFilename : filename
        });
      }

      if (objobj) {
        var type = objobj.type;
      
        if (type === 'local-ref') {
          return o.getObjAtLocalRef(filename, objobj, opts, exitfn);
        } else if (type === 'local-ref-arr') {
          return o.getObjArrAtLocalRef(filename, objobj, opts, exitfn);
        }
      }

      exitfn(null, objobj);
    }, (err, contentobj) => {
      o.getWithUpdatedLangKeys(opts, contentobj, filename, (err, contentobj) => {
        if (err) return fn(err);

        fn(null, contentobj);
      });
    });
  };

  o.getConverted = (opts, patternobj, fn) => {
    let contentobj = patternobj.contentObj,
        filename = patternobj.filename;

    if (patternobj.isConverted) {
      return fn(null, patternobj);
    }

    o.convert(opts, contentobj, filename, (err, contentobj) => {
      if (err) return fn(err);
      
      patternobj.contentObj = contentobj;
      patternobj.isConverted = true;
      
      fn(null, patternobj);
    });
  };

  o.getRefPath = (filepath, refPath) =>
    path.join(path.dirname(filepath), refPath);

  // refpath,  '../main-editor-scenenav-actionedit-seq-portal-action-linkedscene'
  //
  // return 'src/spec/view/main-editor-scenenav-actionedit-seq-portal-action-linkedscene/spec-baseLocale.json '
  o.getRefPathFilename = (filepath, refPath) =>
    path.join(o.getRefPath(filepath, refPath), path.basename(filepath));
  
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
    let langkeyre = /^pd\.langkey\./,
        langobjre = /pd\.langobj/;

    fn(null, objobjwalk.type('string', contentObj, (str) => {
      if (langobjre.test(str)) {
        return langObj;
      } else if (langkeyre.test(str)) {
        return deploy_pattern.objlookup(str.replace(langkeyre, ''), langObj) || str;
      }

      return str;
    }));
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
  //
  // should be dependent on type of convert obj.
  // deploy_fileconvert needs type. type determines the baseObj  
  o.getObjAtLocalRef = (filename, refObj, opts, fn) => {
    var refpath = refObj.fullpath ||
          o.getRefPathFilename(filename, refObj.path);
    
    o.getFromSimilarFileNew(refpath, opts, (err, fcobj) => {
      if (err) return fn(err);
      
      fn(null, fcobj.contentObj);
    });
  };
  
  // should be dependent on type of convert obj.
  // deploy_fileconvert needs type. type determines the baseObj
  o.getObjArrAtLocalRef = (filename, refObj, opts, fn) => {    
    var refpath = o.getRefPath(filename, refObj.path),
        objArr = [];

    // files are .md
    glob(refpath, {}, (err, fileArr) => {
      if (err) return fn(new Error(err));

      (function next(x, filepath) {
        if (!x--) return fn(null, objArr);

        o.getObjAtLocalRef(filename, { 
          fullpath : path.join(fileArr[x], path.basename(filename))
        }, opts, (err, obj) => {
          if (err) return fn(err);
          
          objArr.push(obj);
          
          next(x);
        });
      }(fileArr.length));
    });
  };

  o.getUpdatedReferencePaths = (opts, contentobj, filename, fn) =>
    objobjwalk.async(contentobj, (objobj, exitFn) => {
      var type = objobj.type;
      
      if (type === 'local-ref') {
        o.getObjAtLocalRef(filename, objobj, opts, exitFn);
      } else if (type === 'local-ref-arr') {
        o.getObjArrAtLocalRef(filename, objobj, opts, exitFn);
      } else {
        exitFn(null, objobj);          
      }
    }, fn);

  // not ideal -uses langfilepath to find lang, used
  // to construct path for lang file.
  o.getLangData = (filepath, langfilepath, fn) => {
    let dirname = path.dirname(filepath),
        langfile = path.join(dirname, 'lang-baseLang.json');

    deploy_file.read(langfile, fn);
  };

  o.getFromJSONNew = (filename, fileStr, opts) => {
    return {
      filename,
      contentObj : deploy_pattern.parse(fileStr, filename)
    };
  };

  o.getFromMDNew = (filename, fileStr, opts) => {
    let contentObj = deploy_marked.getFromStrMetaObj(fileStr);
    contentObj.content = deploy_marked(fileStr);
    
    return {
      filename,
      contentObj
    };
  };

  // isoutil.isBaseFilename(input)      
  o.getFromFileTypeNew = (filename, fileStr, opts) => {
    let extname = path.extname(filename),
        converterObj = null;

    if (extname === '.json') {
      converterObj = o.getFromJSONNew(filename, fileStr);
    } else if (extname === '.md') {
      converterObj = o.getFromMDNew(filename, fileStr);
    } else {
      throw new Error('[!!!] convert-locale, file type not supported: ' + filename);
    }

    return converterObj;
  };

  o.getFromFileNew = (filename, opts, fn) => {
    if (opts.patterncache[filename]) {
      return fn(null, opts.patterncache[filename]);
    }

    if (!deploy_pattern.isvalidpatternfilename(filename)) {
      return deploy_msg.err_invalidfilename(filename);
    }      

    deploy_file.read(filename, (err, res) => {
      if (err) return fn(new Error(err));

      let patternobj = o.getFromFileTypeNew(filename, res, opts);
      
      o.getConverted(opts, patternobj, (err, patternobj) => {
        if (err) return fn(err);

        opts.patterncache[filename] = patternobj;
        
        fn(null, patternobj);
      });
    });        
  };

  // filter out similar path
  o.getFromSimilarFileNew = (filename, opts, fn) => {
    deploy_pattern.getsimilarfilename(filename, opts, (err, simfilename) => {
      if (err) return fn(err);
      
      if (simfilename) {
        o.getFromFileNew(simfilename, opts, fn);
      } else {
        fn(new Error('[...] similar file not found, ' + filename));
      }
    });
  };

  // return an array of deploy_fileconvert objects suited to the iso options
  // if an iso file is found, return deploy_fileconvert objects from file
  // if no iso file is found, return cloned `this` (a deploy_fileconvert object)
  // matching extension checked for precision.
  o.getAssocISOFileObjArr = (opts, patternobj, fn) => {
    var filename = patternobj.filename,
        isoFilenameArr = deploy_pattern.getAssocISOFilenameArr(opts, filename),
        isodeploy_fileconvertArr = [],
        extname = path.extname(filename),
        dirname = path.dirname(filename);

    fs.readdir(dirname, (err, resArr) => {
      if (err) return fn(err);

      (function next (x, isoFilename, fcBase) {
        if (!x--) return fn(null, isodeploy_fileconvertArr);

        isoFilename = isoFilenameArr[x];

        if (deploy_pattern.arrgetmatchingISOstr(resArr, isoFilename, extname)) {
          isoFilename = path.join(dirname, isoFilename + '.json');
          deploy_fileconvert.getFromFileNew(isoFilename, opts, (err, fcBase) => {
            if (err) return fn(err);
            isodeploy_fileconvertArr.push(fcBase);
            next(x);
          });
        } else {
          fcBase = Object.create(patternobj);
          fcBase.filename = path.join(dirname, isoFilename + '.json');
          isodeploy_fileconvertArr.push(fcBase);
          next(x);
        }
      }(isoFilenameArr.length));
    });
  };

  o.convertForISO = (opts, patternobj, fn) => {

    // needs to write files not found in isofilenamearr.
    o.getAssocISOFileObjArr(opts, patternobj, (err, fileObjArr) => {
      if (err) return fn(err);

      (function next (x, fileObj) {
        if (!x--) return fn(null, fileObjArr);         

        fileObj = fileObjArr[x];

        deploy_pattern.writeAtFilename(fileObj.filename, fileObj.contentObj, opts, (err, res) => {
          if (err) return fn(err);
          
          next(x);
        });
      }(fileObjArr.length));
    });
  };

  o.convertFilesForBase = (filename, opts, fn) => {
    if (!deploy_pattern.isvalidpatternfilename(filename)) {
      return deploy_msg.err_invalidfilename(filename);
    }

    o.getFromFileNew(filename, opts, (err, fcobj) => {
      if (err) return fn(err);

      deploy_pattern.writeAtFilename(filename, fcobj.contentObj, opts, (err, res) => {
        if (err) return fn(err);
        
        deploy_supportconvert.writeSupportDir(opts, {
          supportedFilename : fcobj.filename
        }, (err, res) => {
          if (err) return fn(err);

          o.convertForISO(opts, fcobj, (err, res) => {
            if (err) return fn(err);

            deploy_msg.convertedfilename(filename, opts);

            fn(err, 'success');
          });
        });
      });
    });
  };

  return o;

})({});
