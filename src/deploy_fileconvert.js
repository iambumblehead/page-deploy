// Filename: deploy_fileconvert.js  
// Timestamp: 2017.08.13-14:30:56 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

const fs = require('fs'),
      path = require('path'),
      glob = require('glob'),
      objobjwalk = require('objobjwalk'),


      deploy_msg = require('./deploy_msg'),
      deploy_html = require('./deploy_html'),
      deploy_file = require('./deploy_file'),
      deploy_sort = require('./deploy_sort'),
      deploy_marked = require('./deploy_marked'),
      deploy_tokens = require('./deploy_tokens'),
      deploy_fileobj = require('./deploy_fileobj'),
      deploy_pattern = require('./deploy_pattern'),
      deploy_convert = require('./deploy_convert'),
      deploy_supportconvert = require('./deploy_supportconvert');

module.exports = (o => {

  const {
    LOCALREF,
    LOCALREFARR,
    LOCALREFPAGEARR
  } = deploy_tokens;

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
      deploy_supportconvert.getWithPublicPathStr(str, opts, filename))));

  o.getWithUpdatedLangKeys = (opts, contentobj, filename, fn) => {
    let langpath = filename.replace(/spec-.*/, 'lang-baseLang.json'),
        langcontent;

    if (!filename.match(/spec-/)) {
      return fn(null, contentobj);
    }
    
    deploy_fileobj.getfromfilesimilar(opts, langpath, (err, langfileobj) => {
      if (!langfileobj) return fn(null, contentobj);

      langcontent = langfileobj;

      o.updateLangKeys(contentobj, langcontent, (err, contentobj) => {

        o.updateLangDefs(contentobj, langcontent, fn);
      });        
    });
  };

  o.convert = (opts, contentobj, filename, fn) => {
    let outfilename = filename;
    if (opts.datetitlesubdirs.find(subdir => (
      filename.indexOf(subdir) !== -1 && contentobj.timeDate
    ))) {
      outfilename = deploy_pattern.getasdatetitlesubdir(filename, contentobj, opts);
    }    
    
    objobjwalk.async(contentobj, (objobj, exitfn) => {
      if (typeof objobj === 'string') {
        objobj = deploy_supportconvert.getWithPublicPathStr(objobj, opts, outfilename);
      }

      if (objobj) {
        var type = objobj.type;
      
        if (type === LOCALREF) {
          return o.getObjAtLocalRef(filename, objobj, opts, exitfn);
        }

        // inplace update of this file
        if (type === LOCALREFARR) {
          //return o.getObjArrAtLocalRef(opts, filename, objobj, exitfn);
          return deploy_convert.createRefSpecArr(opts, filename, objobj, exitfn);
        }
        
        if (type === LOCALREFPAGEARR) {
          return deploy_convert.createRefSpecPages(opts, filename, objobj, exitfn);
          //console.log('aaaa', objobj.grouptype, contentobj);
          // constructed paginated groups...
          
          //return o.getObjArrAtLocalRef(opts, filename, objobj, exitfn);
        }
      }

      exitfn(null, objobj);
    }, (err, contentobj) => {
      if (err) throw new Error(err);

      o.getWithUpdatedLangKeys(opts, contentobj, filename, (err, contentobj) => {
        if (err) return fn(err);
        
        fn(null, contentobj);
      });
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
    const langkeyre = /^pd\.langkey\./,
          langobjre = /pd\.langobj/;

    fn(null, objobjwalk.type('string', contentObj, (str) => {
      if (langobjre.test(str)) {
        str = langObj;
      } else if (langkeyre.test(str)) {
        str = deploy_pattern.objlookup(str.replace(langkeyre, ''), langObj) || str;
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
    
    deploy_fileobj.getfromfilesimilar(opts, refpath, (err, fileobj) => {
      if (err) deploy_msg.errorreadingfile(filename, err);
      if (err) return fn(err);
      
      fn(null, fileobj);
    });
  };

  // not ideal -uses langfilepath to find lang, used
  // to construct path for lang file.
  o.getLangData = (filepath, langfilepath, fn) => {
    let dirname = path.dirname(filepath),
        langfile = path.join(dirname, 'lang-baseLang.json');

    deploy_file.read(langfile, fn);
  };

  // return an array of deploy_fileconvert objects suited to the iso options
  // if an iso file is found, return deploy_fileconvert objects from file
  // if no iso file is found, return cloned `this` (a deploy_fileconvert object)
  // matching extension checked for precision.
  o.getAssocISOFileObjArr = (opts, filename, fileobj, fn) => {
    var ISOnamearr = deploy_pattern.getAssocISOFilenameArr(opts, filename),
        isofileobjarr = [],
        extname = path.extname(filename),
        dirname = path.dirname(filename);

    fs.readdir(dirname, (err, resArr) => {
      if (err) return fn(err);

      (function next (x, ISOname) {
        if (!x--) return fn(null, isofileobjarr);

        ISOname = ISOnamearr[x];

        if (deploy_pattern.arrgetmatchingISOstr(resArr, ISOname, extname)) {
          ISOname = path.join(dirname, ISOname + '.json');

          deploy_fileobj.getfromfile(opts, ISOname, (err, fileobj) => {
            if (err) return fn(err);
            
            isofileobjarr.push([
              ISOname,
              fileobj
            ]);
            next(x);
          });
        } else {          
          isofileobjarr.push([
            path.join(dirname, ISOname + '.json'),
            Array.isArray(fileobj)
              ? fileobj.slice()
              : Object.assign({}, fileobj)
          ]);
          next(x);
        }
      }(ISOnamearr.length));
    });
  };

  o.convertForISO = (opts, filename, fileobj, fn) => {

    // needs to write files not found in isofilenamearr.
    o.getAssocISOFileObjArr(opts, filename, fileobj, (err, fileObjArr) => {
      if (err) return fn(err);

      (function next (x, fileObj) {
        if (!x--) return fn(null, fileObjArr);         

        let [filename, fileobj] = fileObjArr[x];

        deploy_pattern.writeAtFilename(filename, fileobj, opts, (err, res, filename) => {
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

    deploy_fileobj.getfromfile(opts, filename, (err, fileobj) => {
      if (err) return fn(err);

      if (fileobj.ispublished === false) {
        deploy_msg.isnotpublishedfilename(path.dirname(filename), opts);
        return fn(null);
      }

      deploy_pattern.writeAtFilename(filename, fileobj, opts, (err, res, outfilename) => {
        if (err) return fn(err);
        
        deploy_supportconvert.writeSupportDir(opts, filename, outfilename, (err, res) => {
          if (err) return fn(err);

          o.convertForISO(opts, filename, fileobj, (err, res) => {
            if (err) return fn(err);

            deploy_msg.convertedfilename(outfilename, opts);

            fn(err, 'success');
          });
        });
      });
    });
  };

  return o;

})({});
