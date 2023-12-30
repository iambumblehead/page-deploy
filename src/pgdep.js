import fs from 'node:fs/promises'
import path from 'node:path'
import util from 'node:util'
import url from 'node:url'

import pglanglocal from './pglanglocal.js'

import {
  // pgnode,
  pgnode_nameisdata,
  pgnode_writedeep,
  pgnode_specrefcreate,
  pgnode_specpathget
  // pgnode_helpercreate
} from './pgnode.js'

import {
  pgscript_helpercreate
} from './pgscript.js'

import {
  pgfs_writeobj
} from './pgfs.js'

import {
  pgspecroutepathnodecreate,
  pgspecrefrelativecreate
  // pgspecreflocalcreate
} from './pgspecref.js'

import {
  pgenumNODETYPEPATH
} from './pgenum.js'

const childsdfswrite = async (opts, childs, rooturlpath) => {
  const childrefs = []
  for (const child in childs) {
    if (childs[child] === pgenumNODETYPEPATH) {
      childrefs.push(pgspecroutepathnodecreate())
    } else {
      const childpath = pgnode_specpathget(opts, childs[child])
      const childsdeep = await childsdfswrite(
        opts, childs[child].nodechilds, rooturlpath)
      if (childsdeep.length)
        childs[child].nodespec.child = childsdeep
      
      await pgnode_writedeep(opts, childs[child], childpath)

      childrefs.push(pgspecrefrelativecreate(childpath, rooturlpath))
    }
  }

  return childrefs
}

const pgdep = async opts => {
  console.log(opts)
  console.log(opts.outputDir)
  // opts.metaurl
  const rootchilds = opts.root.nodechilds
  // const rootchilds = opts.root.nodespec.child
  if (!rootchilds.length) {
    console.log('no childs defined')
    return null
  }
  
  // const rootroutes = opts.root[1]
  const rootroutes = opts.root.routes
  if (!rootroutes.length) {
    console.log('no routes defined')
    return null
  }

    
  // const url = new url.URL('data.txt', opts.metaurl);
  const rootspecurlpath = new url.URL(
    `${opts.outputDir.replace(/\/$/, '')}/view/root/spec-baseLocale.json`, opts.metaurl);
  // return fs.readFileSync(url, {encoding: 'UTF-8'});
  // const res = await fs.mkdir(outputDirFull, { recursive: true }).catch(e => e)
  // if (res) {
    // console.log(`[...] mkdir: ${res}`)
  // }

  // build the root spec
  // spec/view/root/spec-baseLocale.json
  // after writing each child... write the above path

  /*
  const childrefs = []
  for (const child in rootchilds) {
    console.log('=================loop')
    console.log({
      child: rootchilds[child],
      pgenumNODETYPEPATH,
      rootchilds: rootchilds[0].nodechilds
    })
    if (rootchilds[child] === pgenumNODETYPEPATH) {
      childrefs.push(pgspecroutepathnodecreate())
    } else {
      const childpath = pgnode_specpathget(opts, rootchilds[child])
      await pgnode_writedeep(opts, rootchilds[child], childpath)

      childrefs.push(pgspecrefrelativecreate(childpath, outputDirFull))
      // add ref...

      // "type" : "local-ref",
      // "path" : "../data-errors/"
      // console.log(pgspecrefrelativecreate(childpath, outputDirFull))

    }
    //const outputDirFull = new url.URL(opts.outputDir, opts.metaurl);
  }
  */
  // console.log(childrefs)
  // now that the childs are written...
  // await pgnode_specpathget(opts, rootchilds[0])
  // console.log({ res })
  // console.log('here', JSON.stringify(rootchilds, null, '  '))
  // throw new Error('===')
  
  const childrefs = await childsdfswrite(
    opts, rootchilds, rootspecurlpath)

  const rootnode = Object.assign({}, opts.root.nodespec, {
    child: childrefs
  })
  // at src/spec/view... save all 'toot' stuff
  // console.log(opts.root)
  console.log(rootnode)
  await pgfs_writeobj(rootspecurlpath, rootnode)
  throw new Error('done - write the root')
  // then save each page stuff
  
  
}

// builds something like...
// writes to 'src/spec/page'
/*
const pgroot = (childs, routes) => {
  const pg = pgnode('uiroot', '/', {}, childs)

  pg.routes = routes

  return pg
  // create src/spec/page
  
  // throw new Error('pgroot!')
  // copy childs into view... all childs should be data
  // return [childs, routes]
}

const pgroot_nodepath = 'PATHNODE'
*/
export {
  pgdep as default,
  // pgnode,
  pgscript_helpercreate,
  // pgnode_helpercreate,
//  pgroot,
//  pgroot_nodepath,
  // pgnodepath,
  pglanglocal
}
