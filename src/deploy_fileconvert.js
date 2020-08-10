// Filename: deploy_fileconvert.js  
// Timestamp: 2017.09.03-22:40:33 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

const fs = require('fs'),
      path = require('path'),
      glob = require('glob'),
      objobjwalk = require('objobjwalk'),
      htmldecoder = require('html-decoder'),
      striphtmltags = require('strip-html-tags'),

      deploy_iso = require('./deploy_iso'),
      deploy_msg = require('./deploy_msg'),
      deploy_html = require('./deploy_html'),
      deploy_file = require('./deploy_file'),
      deploy_sort = require('./deploy_sort'),
      deploy_paths = require('./deploy_paths'),
      deploy_tokens = require('./deploy_tokens'),
      deploy_pattern = require('./deploy_pattern'),
      deploy_article = require('./deploy_article'),
      deploy_marked = require('./deploy_marked'),
      deploy_paginate = require('./deploy_paginate'),
      deploy_supportconvert = require('./deploy_supportconvert'),
      deploy_fileconvert = require('./deploy_fileconvert');

const {
  UNIVERSAL,
  LOCALREF,
  LOCALREFARR,
  LOCALREFPAGEARR
} = deploy_tokens;  

module.exports = (o => {
  o = (opts, filename, fn) =>
    o.convertbase(opts, filename, fn);


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
      deploy_paths.withpublicpath(opts, str, filename))));

  o.getWithUpdatedLangKeys = (opts, contentobj, filename, fn) => {
    let langpath = filename.replace(/spec-.*/, 'lang-baseLang.json'),
        langcontent;

    // if (!filename.match(/spec-/)) {
    //   return fn(null, contentobj);
    // }

    o.getfromfilesimilar(opts, langpath, (err, langfileobj) => {
      if (!langfileobj) return fn(null, contentobj);

      langcontent = langfileobj;

      o.updateLangKeys(contentobj, langcontent, (err, contentobj) => {
        o.updateLangDefs(contentobj, langcontent, fn);
      });        
    });
  };

  o.convert = (opts, contentobj, filename, fn) => {
    let outfilename = filename;

    if (deploy_pattern.isdatetitlecontent(opts, contentobj, filename)) {
      outfilename = deploy_pattern
        .getasdatetitlesubdir(filename, contentobj, opts);
    }    

    objobjwalk.async(contentobj, (objobj, exitfn) => {
      if (typeof objobj === 'string') {
        objobj = deploy_paths.withpublicpath(opts, objobj, outfilename);
      }

      if (objobj) {
        let { type } = objobj;
      
        if (type === LOCALREF) {
          return o.getObjAtLocalRef(filename, objobj, opts, exitfn);
        }

        // inplace update of this file
        if (type === LOCALREFARR) {
          return o.createRefSpecArr(opts, filename, objobj, exitfn);
        }
        
        if (type === LOCALREFPAGEARR) {
          return o.createRefSpecPages(opts, filename, objobj, exitfn);
        }
      }

      exitfn(null, objobj);
    }, (err, contentobj) => {
      if (err) throw new Error(err);

      // eslint-disable-next-line max-len
      o.getWithUpdatedLangKeys(opts, contentobj, filename, (err, contentobj) => {
        if (err) return fn(err);
        
        fn(null, contentobj);
      });
    });
  };

  o.getRefPath = (filepath, refPath) =>
    path.join(path.dirname(filepath), refPath);

  // refpath,  '../main-linkedscene'
  //
  // return 'src/spec/view/main-linkedscene/spec-baseLocale.json '
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

    fn(null, objobjwalk.type('string', contentObj, str => {
      if (langobjre.test(str)) {
        str = langObj;
      } else if (langkeyre.test(str)) {
        // eslint-disable-next-line max-len
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

    o.getfromfilesimilar(opts, refpath, (err, fileobj) => {
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

  // try to read file
  // does it need spec- and lang- prefix?
  // filepath is full
  o.getisofileobj = (opts, ISOfilepath, fn) => {
    if (deploy_file.exists(ISOfilepath)) {
      o.getfromfile(opts, ISOfilepath, (err, fileobj) => {
        if (err) return fn(err);

        fn(null, fileobj);
      });
    } else {
      fn(null);
    }
  };

  // return an array of deploy_fileconvert objects suited to the iso options
  // if an iso file is found, return deploy_fileconvert objects from file
  // if no iso file is found, return cloned `this` (a deploy_fileconvert object)
  o.getAssocISOFileObjArr = (opts, filename, fileobj, fn) => {
    const ISOnamearr = deploy_pattern.getisooutputfilenamearr(opts, filename),
          isofileobjarr = [],
          dirname = path.dirname(filename);

    (function next (x, ISOname) {
      if (!x--) return fn(null, isofileobjarr);

      const specISOfilepath = path.join(dirname, `spec-${ISOnamearr[x]}.json`);

      // if base version doesn't exist...
      // messy refactor no-tests note: not sure if lang-ISO needed here...
      // langISOfilepath = path.join(dirname, `lang-${ISOname}.json`);

      o.getisofileobj(opts, specISOfilepath, (err, specfileobj) => {
        if (err) return fn(err);

        isofileobjarr.push([
          // messy refactor note: perhaps path should not have 'spec' suffix?
          specISOfilepath,
          specfileobj || fileobj
        ]);

        next(x);
      });
    }(ISOnamearr.length));
  };

  o.convertForISO = (opts, filename, fileobj, fn) => {

    // needs to write files not found in isofilenamearr.
    o.getAssocISOFileObjArr(opts, filename, fileobj, (err, fileObjArr) => {
      if (err) return fn(err);

      (function next (x, fileObj) {
        if (!x--) return fn(null, fileObjArr);

        let [ filename, fileobj ] = fileObjArr[x];

        // eslint-disable-next-line max-len
        deploy_pattern.writeAtFilename(filename, fileobj, opts, (err, res, filename) => {
          if (err) return fn(err);

          next(x);
        });
      }(fileObjArr.length));
    });
  };

  // filename is spec-baseLang.md... you need spec-baseLang.json
  o.convertuniverse = (opts, filename, fileobj, fn) => {
    const universalfilepath = deploy_pattern.getuniversefilepath(filename);

    if (!deploy_file.isfile(universalfilepath) ||
        !deploy_article.isarticledir(path.dirname(filename))) {
      return fn(null, fileobj);
    }

    o.getfromfile(opts, universalfilepath, (err, universeobj) => {
      if (err) return fn(err);

      objobjwalk.async(universeobj, (objobj, exitfn) => {
        if (typeof objobj === 'string') {
          if (o.nsre.test(objobj)) {
            objobj = o.nsrm(objobj);

            const [ ns ] = String(objobj).split('.');

            if (ns === 'next') {
              // eslint-disable-next-line max-len
              return deploy_article.getnextarticlepathcache(opts, filename, (err, nextpath, nextobj) => {
                if (err) return exitfn(err);

                exitfn(null, o.objlookup(objobj, {
                  next : nextobj
                }));
              });
            }

            if (ns === 'prev') {
              // eslint-disable-next-line max-len
              return deploy_article.getprevarticlepathcache(opts, filename, (err, prevpath, prevobj) => {
                if (err) return exitfn(err);

                exitfn(null, o.objlookup(objobj, {
                  prev : prevobj
                }));
              });
            }
          }
        }
        exitfn(null, objobj);
      }, (err, finfileobj) => {
        if (err) throw new Error(err);

        return fn(null, finfileobj);
      });        
    });
  };

  o.applyuniversefilearticlearr = (opts, inputarr, fn) => {
    if (inputarr.length) {
      o.applyuniversearticle(inputarr[0], opts, (err, res) => {
        if (err) return fn(err);

        o.applyuniversearticlearr(opts, inputarr.slice(1), fn);
      });
    } else {
      fn(null);
    }
  };

  o.applyuniversefile = (opts, outputdir, universefile, fn) => {
    deploy_file.readobj(universefile, (err, uobj) => {
      if (err) return fn(err);

      o.getAssocISOFileObjArr(opts, universefile, uobj, (err, objarr) => {
        if (err) return fn(err);

        deploy_article.applyuniverseisoobjarr(opts, outputdir, objarr, fn);
      });
    });
  };

  o.applyuniversefilearr = (opts, outputdir, universefilearr, fn) => {
    if (universefilearr.length) {
      o.applyuniversefile(opts, outputdir, universefilearr[0], (err, res) => {
        if (err) return fn(err);

        o.applyuniversefilearr(opts, outputdir, universefilearr.slice(1), fn);
      });
    } else {
      fn(null);
    }
  };  

  o.applyuniverse = (opts, input, fn) => {
    const universedir = path.join(input, UNIVERSAL),
          outputdir = deploy_paths.dirout(opts, input);
    
    // deploy_file.readdirfullpath(universedir, (err, universefilearr) => {
    deploy_file.readdir(universedir, (err, universefilearr) => {
      universefilearr = universefilearr
        .map(name => path.join(universedir, name));
      
      o.applyuniversefilearr(opts, outputdir, universefilearr, fn);
    });
  };

  o.convertbase = (opts, filename, fn) => {
    if (!deploy_pattern.patternisvalidinputfilename(filename)) {
      return deploy_msg.err_invalidpatternfilename(filename);
    }
    
    o.getfromfile(opts, filename, (err, fileobj) => {
      if (err) return fn(err);

      if (fileobj.ispublished === false) {
        deploy_msg.isnotpublishedfilename(opts, path.dirname(filename));
        return fn(null);
      }

      
      // eslint-disable-next-line max-len
      deploy_pattern.writeAtFilename(filename, fileobj, opts, (err, res, outfilename) => {
        if (err) return fn(err);

        // eslint-disable-next-line max-len
        deploy_supportconvert.writeSupportDir(opts, filename, outfilename, (err, res) => {
          if (err) return fn(err);

          '## messy refactor note: why deeply recursing convertISO calls?';
          // if (!deploy_iso.isPatternBaseISORe.test(filename)) {
          //   return fn(err, 'success');
          // }

          o.convertForISO(opts, filename, fileobj, (err, res) => {
            if (err) return fn(err);

            deploy_msg.convertedfilename(opts, outfilename);

            fn(err, 'success');
          });
        });
      });
    });
  };

  o.parse = (JSONStr, filename) => {
    try {
      return JSON.parse(JSONStr);        
    } catch (x) {
      console.log('[!!!] locale-deploy, parse error: ' + filename);
      throw new Error('[!!!] locale-deploy, parse error: ' + JSONStr);
    }
  };
  
  o.parseJSON = (opts, filestr, filename) =>
    o.parse(filestr, filename);

  o.parseMD = (opts, filestr, filename) => {
    let metadata = {},
        content,
        excerpt;
    
    [ filestr, metadata ] = deploy_marked.extractsymbols(filestr, metadata);
    [ filestr, metadata ] = deploy_marked.extractmetadata(filestr, metadata);

    content = deploy_marked(filestr);
    
    [ content, excerpt ] = deploy_html.extractexcerpt(content);
    
    metadata.content = content;

    if (excerpt) {
      metadata.excerpthtml = excerpt;
      metadata.excerptnohtml = htmldecoder.decode(striphtmltags(excerpt));
    }

    return metadata;
  };

  o.parsefile = (filename, filestr) => {
    let extname = path.extname(filename);

    if (extname === '.json') {
      return o.parseJSON(filename, filestr);
    } else if (extname === '.md') {
      return o.parseMD(filename, filestr);
    } else {
      throw new Error(
        '[!!!] convert-locale, file type not supported: ' + filename);
    }
  };

  o.getfromfile = (opts, filename, fn) => {
    if (opts.patterncache[filename]) {
      return fn(null, opts.patterncache[filename]);
    }

    if (!deploy_pattern.patternisvalidoutputfilename(filename)) {
      deploy_msg.err_invalidpatternfilename(filename);
    }      

    deploy_file.read(filename, (err, res) => {
      if (err) return fn(new Error(err));

      // eslint-disable-next-line max-len
      o.getConverted(opts, filename, o.parsefile(filename, res), (err, fileobj) => {
        if (err) return fn(err);

        opts.patterncache[filename] = fileobj;
        
        fn(null, fileobj);
      });
    });        
  };

  o.getfromfilesimilar = (opts, filename, fn) =>
    deploy_pattern.getsimilarfilename(filename, opts, (err, simfilename) => {
      if (err) return fn(err);

      [ simfilename ] = simfilename.map( sim => (
        path.join(path.dirname(filename), sim)));
      
      // simfilename = path.join(path.dirname(filename), simfilename);
      simfilename
        ? o.getfromfile(opts, simfilename, fn)
        : fn(new Error('[...] similar file not found, ' + filename));
    });

  o.getConverted = (opts, filename, fileobj, fn) => {
    if (opts.patterncache[filename])
      return fn(null, fileobj);

    o.convert(opts, fileobj, filename, (err, fileobj) => {
      if (err) return fn(err);

      opts.patterncache[filename] = true;
      
      fn(null, fileobj);
    });
  };

  o.relpath = (filepath, refpath) =>
    path.join(path.dirname(filepath), refpath);

  // consider reading and saving files in chunks
  o.createRefSpecPages = (opts, filename, fileobj, exitfn) => {
    o.createRefSpecArr(opts, filename, fileobj, (err, specarr) => {
      if (err) return exitfn(err);      
      
      deploy_paginate(opts, filename, fileobj, specarr, exitfn);
    });
  };

  o.createRefObj = (opts, filename, refpath, fn) => {
    //let fullpath = path.join(filename, path.basename(filename));
    //var refpath = refObj.fullpath ||
    //      o.getRefPathFilename(filename, refObj.path);

    o.getfromfilesimilar(opts, refpath, (err, fileobj) => {
      if (err) return fn(err);
      
      fn(null, fileobj);
    });
  };

  // return array of reference objects from filepatharr
  o.createRefSpecFileArr = (opts, filename, filepatharr, fn) => {
    (function next (x, refobjarr, filepath) {
      if (!x--) return fn(null, refobjarr);
      
      o.createRefObj(opts, filename, filepatharr[x], (err, reffileobj) => {
        if (err) return fn(err);
        
        if (reffileobj.ispublished !== false)
          refobjarr.push(reffileobj);

        next(x, refobjarr);
      });
    }(filepatharr.length, []));
  };

  // return array of reference objects using properties
  // defined on fileobj
  o.createRefSpecArr = (opts, filename, fileobj, fn) => {
    const fullpath = o.relpath(filename, fileobj.path);

    glob(fullpath, {}, (err, filearr) => {
      if (err) return fn(new Error(err));

      filearr = filearr
        .filter(deploy_article.isarticledir)
        .map(file =>  path.join(file, path.basename(filename)));

      o.createRefSpecFileArr(opts, filename, filearr, (err, objarr) => {
        if (err) return fn(err);
        
        objarr = deploy_sort(objarr, fileobj.sort);

        fn(null, objarr);
      });
    });
  };  

  return o;

})({});
