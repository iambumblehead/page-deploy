import fs from 'node:fs/promises'
import path from 'node:path'
import util from 'node:util'
import url from 'node:url'

import pgopts from './pgopts.js'
import pgscriptopts from './pgscriptopts.js'

import pglanglocal from './pglanglocal.js'

import {
  // pgnode,
  pgnode_writedeep,
  pgnode_specrefcreate,
  pgnode_specpathget
  // pgnode_helpercreate
} from './pgnode.js'

import {
  pgscript_helpercreate
} from './pgscript.js'

import {
  pgfs_writeobj,
  pgfs_dirrmdir,
  pgfs_direxists,
  pgfs_fileexists
} from './pgfs.js'

import {
  pgspecroutepathnodecreate,
  pgspecrefrelativecreate
  // pgspecreflocalcreate
} from './pgspecref.js'

import {
  pgenumNODETYPEPATH
} from './pgenum.js'

const childsdfswrite = async (opts, childs, rooturlpath, parenturlpath) => {
  const childrefs = []
  for (const child in childs) {
    if (childs[child] === pgenumNODETYPEPATH) {
      childrefs.push(pgspecroutepathnodecreate())
    } else {
      const childpath = pgnode_specpathget(
        opts, childs[child],
        parenturlpath || rooturlpath)
        // parenturlpath || new url.URL('..', rooturlpath))
      const childsdeep = await childsdfswrite(
        opts, childs[child].nodechilds, rooturlpath, childpath)
      if (childsdeep.length)
        childs[child].nodespec.child = childsdeep
      
      await pgnode_writedeep(opts, childs[child], childpath)

      childrefs.push(pgspecrefrelativecreate(childpath, rooturlpath))
    }
  }

  return childrefs
}

const pgdep = async opts => {
  opts = pgopts(opts)

  const scriptopts = pgscriptopts(opts)

  console.log(opts)
  console.log(opts.outputDir)

  await pgfs_dirrmdir(opts.outputDir)

  const root = await opts.root(scriptopts)
  
  const rootchilds = root.nodechilds
  // const rootchilds = opts.root.nodespec.child
  if (!rootchilds.length) {
    console.log('no childs defined')
    return null
  }
  
  // const rootroutes = opts.root[1]
  const rootroutes = root.routes
  if (!rootroutes.length) {
    console.log('no routes defined')
    return null
  }

    
  // const url = new url.URL('data.txt', opts.metaurl);
  const rootspecurlpath = new url.URL(
    `${opts.outputDir.replace(/\/$/, '')}/view/root/spec-baseLocale.json`, opts.metaurl);
  // build the root spec
  // spec/view/root/spec-baseLocale.json
  // after writing each child... write the above path

  const childrefs = await childsdfswrite(
    opts, rootchilds, rootspecurlpath)

  const rootnode = Object.assign({}, root.nodespec, {
    child: childrefs
  })
  // at src/spec/view... save all 'toot' stuff
  // console.log(opts.root)
  console.log(rootnode)
  await pgfs_writeobj(opts, rootspecurlpath, rootnode)
  // throw new Error('done - write the root')
  // then save each page stuff
  
  
}

export {
  pgdep as default,
  pgscript_helpercreate,
  pglanglocal
}
