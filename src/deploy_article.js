// Filename: deploy_article.js  
// Timestamp: 2017.09.03-22:31:15 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

const fs = require('fs'),
      path = require('path'),
      objobjwalk = require('objobjwalk'),

      deploy_iso = require('./deploy_iso'),
      deploy_file = require('./deploy_file'),
      deploy_paths = require('./deploy_paths');

module.exports = (o => {

  o.nsre = /^ns\./;

  o.nsrm = str => str.replace(o.nsre, '');

  o.objlookup = (namespacestr, obj) => 
    String(namespacestr).split('.').reduce(
      (a, b) => a ? (b in a ? a[b] : a[Number(b)]) : null, obj);

  // 2017.08.31-my-article
  // true 2017.08.31-my-article
  o.isarticlepath = specfilepath =>
    /^\d\d\d\d.\d\d.\d\d-.*$/.test(path.basename(specfilepath));

  // 2017.08.31-my-article
  o.isarticledir = specfilepath =>
    deploy_file.isdir(specfilepath) && o.isarticlepath(specfilepath);

  o.isarticlefilepath = specfilepath =>
    deploy_file.isfile(specfilepath)
      && o.isarticlepath(path.dirname(specfilepath));

  //o.getdirarticlepaths = (opts, dirpath, fn) =>
  o.readdirarticles = (opts, dirpath, fn) =>
    deploy_file.readdir(dirpath, (err, filearr) => {
      if (err) return fn(err);

      fn(null, filearr.filter(o.isarticlepath));
    });

  o.readdirarticlesfullpath = (opts, dirpath, fn) =>
    o.readdirarticles(opts, dirpath, (err, filearr) => {
      if (err) return fn(err);

      // TODO remove silly map
      fn(null, filearr.map(file => path.join(dirpath, file)));
    });  


  o.getadjacentarticlepaths = (opts, filepath, fn) => {
    const parentdir = deploy_paths.getparentdirpath(filepath);

    o.readdirarticlesfullpath(opts, parentdir, (err, filearr) => {
      if (err) return fn(err);

      fn(null, filearr.map(file => path.join(file, path.basename(filepath))));
    });
  };

  o.getadjacentarticlepathscached = (opts, filepath, fn) => {
    const parentdir = deploy_paths.getparentdirpath(filepath);

    if (opts.articlescache[parentdir]) {
      return fn(null, opts.articlescache[parentdir]);
    }

    o.getadjacentarticlepaths(opts, filepath, (err, filearr) => {
      if (err) return fn(err);

      opts.articlescache[parentdir] = filearr;

      fn(null, filearr);
    });
  };

  o.getnextprevarticlepath = (opts, filepath, nextprev=1, fn, indexnum) => {
    o.getadjacentarticlepathscached(opts, filepath, (err, filepaths) => {
      if (err) return fn(err);
      
      //
      // filepath:
      //   src/spec/page/blog/2008.09.27-pyramid/spec-baseLang.md
      //
      // filepaths: [
      //   '2008.09.25-actionscript-development/spec-baseLang.md',
      //   '2008.09.27-pyramid/spec-baseLang.md',
      //   '2008.11.11-creation/spec-baseLang.md'
      // ]
      //
      indexnum = typeof indexnum === 'number'
        ? indexnum
        : filepaths.findIndex(nextfilepath => (
          filepath.includes(nextfilepath)));

      indexnum += nextprev === -1 ? -1 : 1;

      if (!(-1 < indexnum && indexnum < filepaths.length)) {
        return fn(null, null, null);
      }

      const fullpath = filepaths[indexnum];

      deploy_file.readobj(fullpath, (err, fileobj) => {
        if (err) return fn(err);

        // if not published, skip
        if (fileobj.ispublished === false) {
          o.getnextprevarticlepath(opts, fullpath, nextprev, fn, indexnum);
        } else {
          fn(null, fullpath, fileobj);
        }
      });
    });
  };

  
  o.getnextprevarticlepathcache = (opts, filepath, nextprev, fn, indexnum) => {
    const nextpath = opts.articlescache[filepath + nextprev];

    if (nextpath) {
      deploy_file.readobj(nextpath, (err, fileobj) => {
        fn(err, nextpath, fileobj);
      });
    } else {
      // eslint-disable-next-line max-len
      o.getnextprevarticlepath(opts, filepath, nextprev, (err, nextpath, fileobj) => {
        if (err) return fn(err);
        
        opts.articlescache[filepath + nextprev] = nextpath;

        fn(null, nextpath, fileobj);
      });
    }
  };

  o.getnextarticlepathcache = (opts, filepath, fn) =>
    o.getnextprevarticlepathcache(opts, filepath, 1, fn);

  o.getprevarticlepathcache = (opts, filepath, fn) => 
    o.getnextprevarticlepathcache(opts, filepath, -1, fn);

  // eslint-disable-next-line max-len
  o.applyuniversearticleisoobj = (opts, articledir, [ isopath, isoobj ], fn) => {
    let articlepath = path.join(
      articledir, deploy_iso.getRmPrefix(path.basename(isopath)));

    objobjwalk.async(JSON.parse(JSON.stringify(isoobj)), (objobj, exitfn) => {
      if (typeof objobj === 'string') {
        if (o.nsre.test(objobj)) {
          objobj = o.nsrm(objobj);

          const [ ns ] = String(objobj).split('.');

          if (ns === 'next') {

            // eslint-disable-next-line max-len
            return o.getnextarticlepathcache(opts, articlepath, (err, nextpath, nextobj) => {
              if (err) return exitfn(err);

              exitfn(null, o.objlookup(objobj, {
                next : nextobj
              }));
            });
          }

          if (ns === 'prev') {
            // eslint-disable-next-line max-len
            return o.getprevarticlepathcache(opts, articlepath, (err, prevpath, prevobj) => {
              if (err) return exitfn(err);

              exitfn(null, o.objlookup(objobj, {
                prev : prevobj
              }));
            });
          }
        }
      }
      exitfn(null, objobj);
    }, (err, obj) => {
      if (err) return fn(err);

      deploy_file.writeassign(articlepath, obj, (err, resobj) => {
        if (err) return fn(err);

        fn(null, resobj);
      });
    });
  };

  o.applyuniversearticleisoobjarr = (opts, articledir, isoobjarr, fn) => {
    if (isoobjarr.length) {
      // eslint-disable-next-line max-len
      o.applyuniversearticleisoobj(opts, articledir, isoobjarr[0], (err, res) => {
        if (err) return fn(err);

        // eslint-disable-next-line max-len
        o.applyuniversearticleisoobjarr(opts, articledir, isoobjarr.slice(1), fn);
      });
    } else {
      fn(null);
    }
  };

  o.applyuniverseisoobjarr = (opts, outputdir, isoobjarr, fn) => {
    o.readdirarticlesfullpath(opts, outputdir, (err, articlearr) => {
      if (err) return fn(err);

      (function next (x, articlearr) {
        if (!x--) return fn(null, articlearr);

        // eslint-disable-next-line max-len
        o.applyuniversearticleisoobjarr(opts, articlearr[x], isoobjarr, (err, res) => {
          if (err) return fn(err);

          next(x, articlearr);
        });
      }(articlearr.length, articlearr));
    });
  };

  return o;
  
})({});
