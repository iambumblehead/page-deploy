// Filename: deploy_convert.js  
// Timestamp: 2017.09.02-21:54:20 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  
//
// meant to replace deploy_fileconvert
//

const fs = require('fs'),
      path = require('path'),
      glob = require('glob'),

      deploy_msg = require('./deploy_msg'),
      deploy_file = require('./deploy_file'),
      deploy_sort = require('./deploy_sort'),
      deploy_article = require('./deploy_article'),
      deploy_pattern = require('./deploy_pattern'),
      deploy_paginate = require('./deploy_paginate');

module.exports = (o => {

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

    require('./deploy_fileobj').getfromfilesimilar(opts, refpath, (err, fileobj) => {
      if (err) deploy_msg.errorreadingfile(filename, err);
      if (err) return fn(err);
      
      fn(null, fileobj);
    });
  };

  // return array of reference objects from filepatharr
  o.createRefSpecFileArr = (opts, filename, filepatharr, fn) => {
    (function next(x, refobjarr, filepath) {
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
