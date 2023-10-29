// Filename: deploy_fileconvert.js  
// Timestamp: 2017.09.03-22:40:33 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

import path from 'path'
import {glob} from 'glob'
import objobjwalk from 'objobjwalk'

import deploy_msg from './deploy_msg.js'
import deploy_file from './deploy_file.js'
import deploy_sort from './deploy_sort.js'
import deploy_paths from './deploy_paths.js'
import deploy_parse from './deploy_parse.js'
import deploy_tokens from './deploy_tokens.js'
import deploy_pattern from './deploy_pattern.js'
import deploy_article from './deploy_article.js'
import deploy_paginate from './deploy_paginate.js'
import deploy_imgprocess from './deploy_imgprocess.js'
import deploy_supportconvert from './deploy_supportconvert.js'

const { UNIVERSAL, LOCALREF, LOCALREFARR, LOCALREFPAGEARR } = deploy_tokens

const foreachasync =  (opts, arr, fn, endfn = () => {}) => {
  if (!arr.length)
    return endfn(null)
  
  fn(opts, arr[0], (err, res) => {
    if (err) return endfn(err)

    foreachasync(opts, arr.slice(1), fn, endfn)
  })
}

// replace support paths found in contentObj strings.
// 
// this:
// <a href="support/img/hand1.jpg">
// 
// becomes something like this:
// <a href="domain.com/public/path/to/support/img/hand1.jpg">
//
const getWithUpdatedSupportPaths = (opts, contentobj, filename, fn) => (
  fn(null, objobjwalk.type('string', contentobj, str => (
    deploy_paths.withpublicpath(opts, str, filename)))))

const getWithUpdatedLangKeys = (opts, contentobj, filename, fn) => {
  const langpath = filename.replace(/spec-.*/, 'lang-baseLang.notjsonmd')

  // if (!filename.match(/spec-/)) {
  //   return fn(null, contentobj)
  // }

  getfromfilesimilar(opts, langpath, (err, langobj) => {
    if (!langobj) return fn(null, contentobj)

    deploy_pattern.updatelangkeys(contentobj, langobj, (err, contentobj) => {
      deploy_pattern.updatelangdefs(contentobj, langobj, fn)
    })        
  })
}

const convert = (opts, contentobj, filename, fn) => {
  let outfilename = filename

  if (deploy_pattern.isdatetitlecontent(opts, contentobj, filename)) {
    outfilename = deploy_pattern
      .getdatetitlestampoutputpath(filename, contentobj, opts)
  }

  objobjwalk.async(contentobj, (objobj, exitfn) => {
    if (typeof objobj === 'string') {
      objobj = deploy_paths.withpublicpath(opts, objobj, outfilename)
    }

    if (objobj) { // inplace update of this file
      let { type } = objobj
      
      if (type === LOCALREF) {
        return getObjAtLocalRef(filename, objobj, opts, exitfn)
      }

      if (type === LOCALREFARR) {
        return createRefSpecArr(opts, filename, objobj, exitfn)
      }
      
      if (type === LOCALREFPAGEARR) {
        return createRefSpecPages(opts, filename, objobj, exitfn)
      }
    }

    exitfn(null, objobj)
  }, (err, contentobj) => {
    if (err) throw new Error(err)

    // eslint-disable-next-line max-len
    getWithUpdatedLangKeys(opts, contentobj, filename, (err, contentobj) => {
      if (err) return fn(err)
      
      fn(null, contentobj)
    })
  })
}

const getRefPath = (filepath, refPath) => (
  path.join(path.dirname(filepath), refPath))

// refpath,  '../main-linkedscene'
//
// return 'src/spec/view/main-linkedscene/spec-baseLocale.json '
const getRefPathFilename = (filepath, refPath) => (
  path.join(getRefPath(filepath, refPath), path.basename(filepath)))
  
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
const getObjAtLocalRef = (filename, refObj, opts, fn) => {
  var refpath = refObj.fullpath ||
      getRefPathFilename(filename, refObj.path)

  // kludge, getsimilar not return exact filename match
  refpath = path.join(
    path.dirname(refpath),
    path.basename(refpath, path.extname(refpath)) + '.notjsonmd')

  getfromfilesimilar(opts, refpath, (err, fileobj) => {
    if (err) return fn(err)

    if (!fileobj) {
      deploy_msg.throw_localrefnotfound(opts, filename, refpath, refObj)
    }
    
    fn(null, fileobj)
  })
}

// not ideal -uses langfilepath to find lang, used
// to construct path for lang file.
const getLangData = (filepath, langfilepath, fn) => {
  const dirname = path.dirname(filepath)
  const langfile = path.join(dirname, 'lang-baseLang.json')

  deploy_file.read(langfile, fn)
}

// try to read file
// does it need spec- and lang- prefix?
// filepath is full
const getisofileobj = (opts, ISOfilepath, fn) => {
  if (deploy_file.exists(ISOfilepath)) {
    getfromfile(opts, ISOfilepath, (err, fileobj) => {
      if (err) return fn(err)

      fn(null, fileobj)
    })
  } else {
    fn(null)
  }
}

// return an array of deploy_fileconvert objects suited to the iso options
// if an iso file is found, return deploy_fileconvert objects from file
// if no iso file is found, return cloned `this` (a deploy_fileconvert object)
const getAssocISOFileObjArr = (opts, filename, fileobj, fn) => {
  const ISOnamearr = deploy_pattern.getisooutputfilenamearr(opts, filename),
        isofileobjarr = [],
        dirname = path.dirname(filename)

  ;(function next (x, ISOname) {
    if (!x--) return fn(null, isofileobjarr)

    const specISOfilepath = path.join(dirname, `spec-${ISOnamearr[x]}.json`)

    // if base version doesn't exist...
    // messy refactor no-tests note: not sure if lang-ISO needed here...
    // langISOfilepath = path.join(dirname, `lang-${ISOname}.json`)

    getisofileobj(opts, specISOfilepath, (err, specfileobj) => {
      if (err) return fn(err)

      isofileobjarr.push([
        // messy refactor note: perhaps path should not have 'spec' suffix?
        specISOfilepath,
        specfileobj || fileobj
      ])

      next(x)
    })
  }(ISOnamearr.length))
}

const convertForISO = (opts, filename, fileobj, fn) => {
  // needs to write files not found in isofilenamearr.
  getAssocISOFileObjArr(opts, filename, fileobj, (err, fileObjArr) => {
    if (err) return fn(err)

    ;(function next (x, fileObj) {
      if (!x--) return fn(null, fileObjArr)

      let [ filename, fileobj ] = fileObjArr[x]

      deploy_pattern.writeAtFilename(filename, fileobj, opts, err => {
        if (err) return fn(err)

        next(x)
      })
    }(fileObjArr.length))
  })
}

/*
// filename is spec-baseLang.md... you need spec-baseLang.json
const convertuniverse = (opts, filename, fileobj, fn) => {
  const universalfilepath = deploy_pattern.getuniversefilepath(filename)

  if (!deploy_file.isfile(universalfilepath) ||
      !deploy_article.isarticlefilepath(filename)) {
    return fn(null, fileobj)
  }

  getfromfile(opts, universalfilepath, (err, universeobj) => {
    if (err) return fn(err)

    objobjwalk.async(universeobj, (objobj, exitfn) => {
      if (typeof objobj !== 'string' || !nsre.test(objobj)) {
        return exitfn(null, objobj)
      }

      objobj = nsrm(objobj)

      const [ ns ] = String(objobj).split('.')

      if (ns === 'next') {
        // eslint-disable-next-line max-len
        return deploy_article.getnextarticlepathcache(opts, filename, (err, nextpath, nextobj) => {
          if (err) return exitfn(err)

          exitfn(null, objlookup(objobj, {
            next: nextobj
          }))
        })
      }

      if (ns === 'prev') {
        // eslint-disable-next-line max-len
        return deploy_article.getprevarticlepathcache(opts, filename, (err, prevpath, prevobj) => {
          if (err) return exitfn(err)

          exitfn(null, o.objlookup(objobj, {
            prev : prevobj
          }))
        })
      }
    }, (err, finfileobj) => {
      if (err) throw new Error(err)

      return fn(null, finfileobj)
    })        
  })
}

const applyuniversefilearticlearr = (opts, inputarr, fn) => {
  if (inputarr.length) {
    applyuniversearticle(inputarr[0], opts, (err, res) => {
      if (err) return fn(err)

      applyuniversearticlearr(opts, inputarr.slice(1), fn)
    })
  } else {
    fn(null)
  }
}
*/
const applyuniversefile = (opts, outputdir, universefile, fn) => {
  deploy_file.readobj(universefile, (err, uobj) => {
    if (err) return fn(err)

    getAssocISOFileObjArr(opts, universefile, uobj, (err, objarr) => {
      if (err) return fn(err)

      deploy_article.applyuniverseisoobjarr(opts, outputdir, objarr, fn)
    })
  })
}

const applyuniversefilearr = (opts, outputdir, universefilearr, fn) => {
  if (universefilearr.length) {
    applyuniversefile(opts, outputdir, universefilearr[0], (err, res) => {
      if (err) return fn(err)

      applyuniversefilearr(opts, outputdir, universefilearr.slice(1), fn)
    })
  } else {
    fn(null)
  }
}  

const applyuniverse = (opts, input, fn) => {
  const universedir = path.join(input, UNIVERSAL)
  const outputdir = deploy_paths.dirout(opts, input)
  
  // deploy_file.readdirfullpath(universedir, (err, universefilearr) => {
  deploy_file.readdir(universedir, (err, universefilearr) => {
    universefilearr = universefilearr
      .map(name => path.join(universedir, name))
    
    applyuniversefilearr(opts, outputdir, universefilearr, fn)
  })
}

const convertbase = (opts, filename, fn) => {
  if (!deploy_pattern.patternisvalidinputfilename(filename)) {
    return deploy_msg.err_invalidpatternfilename(filename)
  }
  
  getfromfile(opts, filename, (err, fileobj) => {
    if (err) return fn(err)

    if (fileobj.ispublished === false) {
      deploy_msg.isnotpublishedfilename(opts, path.dirname(filename))
      return fn(null)
    }

    // eslint-disable-next-line max-len
    deploy_pattern.writeAtFilename(filename, fileobj, opts, (err, res, outfilename) => {
      if (err) return fn(err)

      // eslint-disable-next-line max-len
      deploy_supportconvert.writeSupportDir(opts, filename, outfilename, (err, res) => {
        if (err) return fn(err)

        // ## messy refactor note: why deeply recursing convertISO calls?
        convertForISO(opts, filename, fileobj, (err, res) => {
          if (err) return fn(err)

          deploy_msg.convertedfilename(opts, outfilename)

          fn(err, 'success')
        })
      })
    })
  })
}

const getfromfile = (opts, filename, fn) => {
  if (opts.patterncache[filename]) {
    return fn(null, opts.patterncache[filename])
  }

  if (!deploy_pattern.patternisvalidoutputfilename(filename)) {
    deploy_msg.err_invalidpatternfilename(filename)
  }      

  deploy_file.read(filename, (err, res) => {
    if (err) return fn(new Error(err))

    getConverted(
      opts, filename, deploy_parse.parsefile(opts, res, filename), fn)
  })        
}

const getfromfilesimilar = (opts, filename, fn) => (
  deploy_pattern.getsimilarfilename(filename, opts, (err, simfilename) => {
    if (err) return fn(err)

    [ simfilename ] = simfilename.map(sim => (
      path.join(path.dirname(filename), sim)))

    simfilename
      ? getfromfile(opts, simfilename, fn)
      : fn(null, null)
  }))

const postprocess = (opts, filename, fileobj, fn) => {
  if (deploy_article.isarticlefilepath(filename)) {
    deploy_imgprocess.process(opts, filename, fileobj, fn)
  } else {
    fn(null, fileobj)
  }
}

const getConverted = (opts, filename, fileobj, fn) => {
  if (opts.patterncache[filename])
    return fn(null, fileobj)

  convert(opts, fileobj, filename, (err, fileobj) => {
    if (err) return fn(err)

    postprocess(opts, filename, fileobj, (err, res) => {
      if (err) return fn(err)

      opts.patterncache[filename] = fileobj

      fn(null, fileobj)
    })
  })
}

// consider reading and saving files in chunks
const createRefSpecPages = (opts, filename, fileobj, exitfn) => {
  createRefSpecArr(opts, filename, fileobj, (err, specarr) => {
    if (err) return exitfn(err)      
    
    deploy_paginate(opts, filename, fileobj, specarr, exitfn)
  })
}

const createRefObj = (opts, filename, refpath, fn) => {
  //let fullpath = path.join(filename, path.basename(filename))
  //var refpath = refObj.fullpath ||
  //      o.getRefPathFilename(filename, refObj.path)

  getfromfilesimilar(opts, refpath, (err, fileobj) => {
    if (err) return fn(err)
    
    fn(null, fileobj)
  })
}

// return array of reference objects from filepatharr
const createRefSpecFileArr = (opts, filename, filepatharr, fn) => {
  (function next (x, refobjarr, filepath) {
    if (!x--) return fn(null, refobjarr)
    
    createRefObj(opts, filename, filepatharr[x], (err, reffileobj) => {
      if (err) return fn(err)

      if (reffileobj && reffileobj.ispublished !== false)
        refobjarr.push(reffileobj)

      next(x, refobjarr)
    })
  }(filepatharr.length, []))
}

// return array of reference objects using properties
// defined on fileobj
const createRefSpecArr = async (opts, filename, fileobj, fn) => {
  const fullpath = deploy_file.relpath(filename, fileobj.path)

  let filearr = await glob(fullpath)

  filearr = filearr
    .filter(deploy_article.isarticledir)
    .map(file => path.join(
      file, path.basename(filename, path.extname(filename))))

  createRefSpecFileArr(opts, filename, filearr, (err, objarr) => {
    if (err) return fn(err)
    
    objarr = deploy_sort(objarr, fileobj.sort)

    fn(null, objarr)
  })
}  

export default Object.assign(convertbase, {
  foreachasync,
  getWithUpdatedSupportPaths,
  getWithUpdatedLangKeys,
  convert,
  getRefPath,
  getRefPathFilename,
  getObjAtLocalRef,
  getLangData,
  getisofileobj,
  getAssocISOFileObjArr,
  convertForISO,
  applyuniversefile,
  applyuniversefilearr,
  applyuniverse,
  convertbase,
  getfromfile,
  getfromfilesimilar,
  postprocess,
  getConverted,
  createRefSpecPages,
  createRefObj,
  createRefSpecFileArr,
  createRefSpecArr
})
