// Filename: deploy_article.js  
// Timestamp: 2017.09.03-22:31:15 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

import fs from 'fs'
import path from 'path'
import objobjwalk from 'objobjwalk'

import deploy_iso from './deploy_iso.js'
import deploy_file from './deploy_file.js'
import deploy_paths from './deploy_paths.js'

const nsre = /^ns\./

const nsrm = str => str.replace(nsre, '')

const objlookup = (namespacestr, obj) => (
  String(namespacestr).split('.').reduce(
    (a, b) => a ? (b in a ? a[b] : a[Number(b)]) : null, obj))

// 2017.08.31-my-article
// true 2017.08.31-my-article
const isarticlepath = specfilepath => (
  /^\d\d\d\d.\d\d.\d\d-.*$/.test(path.basename(specfilepath)))

// 2017.08.31-my-article
const isarticledir = specfilepath => (
  deploy_file.isdir(specfilepath) && isarticlepath(specfilepath))

const isarticlefilepath = specfilepath => (
  deploy_file.isfile(specfilepath)
    && isarticlepath(path.dirname(specfilepath)))

//o.getdirarticlepaths = (opts, dirpath, fn) =>
const readdirarticles = (opts, dirpath, fn) => (
  deploy_file.readdir(dirpath, (err, filearr) => {
    if (err) return fn(err)

    fn(null, filearr.filter(isarticlepath))
  }))

const readdirarticlesfullpath = (opts, dirpath, fn) => (
  readdirarticles(opts, dirpath, (err, filearr) => {
    if (err) return fn(err)

    // TODO remove silly map
    fn(null, filearr.map(file => path.join(dirpath, file)))
  }))

const getadjacentarticlepaths = (opts, filepath, fn) => {
  const parentdir = deploy_paths.getparentdirpath(filepath)

  readdirarticlesfullpath(opts, parentdir, (err, filearr) => {
    if (err) return fn(err)

    fn(null, filearr.map(file => path.join(file, path.basename(filepath))))
  })
}

const getadjacentarticlepathscached = (opts, filepath, fn) => {
  const parentdir = deploy_paths.getparentdirpath(filepath)

  if (opts.articlescache[parentdir]) {
    return fn(null, opts.articlescache[parentdir])
  }

  getadjacentarticlepaths(opts, filepath, (err, filearr) => {
    if (err) return fn(err)

    opts.articlescache[parentdir] = filearr

    fn(null, filearr)
  })
}

const getnextprevarticlepath = (opts, filepath, nextprev=1, fn, indexnum) => {
  getadjacentarticlepathscached(opts, filepath, (err, filepaths) => {
    if (err) return fn(err)
    
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
        filepath.includes(nextfilepath)))

    indexnum += nextprev === -1 ? -1 : 1

    if (!(-1 < indexnum && indexnum < filepaths.length)) {
      return fn(null, null, null)
    }

    const fullpath = filepaths[indexnum]

    deploy_file.readobj(fullpath, (err, fileobj) => {
      if (err) return fn(err)

      // if not published, skip
      if (fileobj.ispublished === false) {
        getnextprevarticlepath(opts, fullpath, nextprev, fn, indexnum)
      } else {
        fn(null, fullpath, fileobj)
      }
    })
  })
}

// eslint-disable-next-line max-len
const getnextprevarticlepathcache = (opts, filepath, nextprev, fn, indexnum) => {
  const nextpath = opts.articlescache[filepath + nextprev]

  if (nextpath) {
    deploy_file.readobj(nextpath, (err, fileobj) => {
      fn(err, nextpath, fileobj)
    })
  } else {
    // eslint-disable-next-line max-len
    getnextprevarticlepath(opts, filepath, nextprev, (err, nextpath, fileobj) => {
      if (err) return fn(err)
        
      opts.articlescache[filepath + nextprev] = nextpath

      fn(null, nextpath, fileobj)
    })
  }
}

const getnextarticlepathcache = (opts, filepath, fn) => (
  getnextprevarticlepathcache(opts, filepath, 1, fn))

const getprevarticlepathcache = (opts, filepath, fn) => (
  getnextprevarticlepathcache(opts, filepath, -1, fn))

// eslint-disable-next-line max-len
const applyuniversearticleisoobj = (opts, articledir, [ isopath, isoobj ], fn) => {
  let articlepath = path.join(
    articledir, deploy_iso.getRmPrefix(path.basename(isopath)))

  objobjwalk.async(JSON.parse(JSON.stringify(isoobj)), (objobj, exitfn) => {
    if (typeof objobj === 'string') {
      if (nsre.test(objobj)) {
        objobj = nsrm(objobj)

        const [ ns ] = String(objobj).split('.')

        if (ns === 'next') {

          // eslint-disable-next-line max-len
          return getnextarticlepathcache(opts, articlepath, (err, nextpath, nextobj) => {
            if (err) return exitfn(err)

            exitfn(null, objlookup(objobj, {
              next: nextobj
            }))
          })
        }

        if (ns === 'prev') {
          // eslint-disable-next-line max-len
          return getprevarticlepathcache(opts, articlepath, (err, prevpath, prevobj) => {
            if (err) return exitfn(err)

            exitfn(null, objlookup(objobj, {
              prev: prevobj
            }))
          })
        }
      }
    }
    exitfn(null, objobj)
  }, (err, obj) => {
    if (err) return fn(err)

    deploy_file.writeassign(articlepath, obj, (err, resobj) => {
      if (err) return fn(err)

      fn(null, resobj)
    })
  })
}

const applyuniversearticleisoobjarr = (opts, articledir, isoobjarr, fn) => {
  if (isoobjarr.length) {
    // eslint-disable-next-line max-len
    applyuniversearticleisoobj(opts, articledir, isoobjarr[0], (err, res) => {
      if (err) return fn(err)

      // eslint-disable-next-line max-len
      applyuniversearticleisoobjarr(opts, articledir, isoobjarr.slice(1), fn)
    })
  } else {
    fn(null)
  }
}

const applyuniverseisoobjarr = (opts, outputdir, isoobjarr, fn) => {
  readdirarticlesfullpath(opts, outputdir, (err, articlearr) => {
    if (err) return fn(err)

    ;(function next (x, articlearr) {
      if (!x--) return fn(null, articlearr)

      // eslint-disable-next-line max-len
      applyuniversearticleisoobjarr(opts, articlearr[x], isoobjarr, (err, res) => {
        if (err) return fn(err)

        next(x, articlearr)
      })
    }(articlearr.length, articlearr))
  })
}

export default {
  nsre,
  nsrm,
  objlookup,
  isarticlepath,
  isarticledir,
  isarticlefilepath,
  readdirarticles,
  readdirarticlesfullpath,
  getadjacentarticlepaths,
  getadjacentarticlepathscached,
  getnextprevarticlepath,
  getnextprevarticlepathcache,
  getnextarticlepathcache,
  getprevarticlepathcache,
  applyuniversearticleisoobj,
  applyuniversearticleisoobjarr,
  applyuniverseisoobjarr
}
