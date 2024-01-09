import fs from 'node:fs/promises'
import path from 'node:path'
import util from 'node:util'
import url from 'node:url'

import pgopts from './pgopts.js'
import pgscriptopts from './pgscriptopts.js'

import pglanglocal from './pglanglocal.js'

import {
  pgnode_writedeep,
  pgnode_specrefcreate,
  pgnode_specurlcreate
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
} from './pgspecref.js'

import {
  pgenumNODETYPEPATH
} from './pgenum.js'

const childsdfswrite = async (opts, childs, rurlpath, purlpath) => {
  const childrefs = []
  for (const childindex in childs) {
    const childresolver = childs[childindex]
    const child = typeof childresolver === 'function'
      ? childresolver() : childresolver

    if (child === pgenumNODETYPEPATH) {
      childrefs.push(pgspecroutepathnodecreate())
    } else {
      const childpath = pgnode_specurlcreate(
        opts, child, purlpath || rurlpath)

      // parenturlpath || new url.URL('..', rooturlpath))
      const childsdeep = await childsdfswrite(
        opts, child.nodechilds, rurlpath, childpath)

      if (childsdeep.length)
        child.nodespec.child = childsdeep
      
      await pgnode_writedeep(opts, child, childpath)

      childrefs.push(pgspecrefrelativecreate(childpath, rurlpath))
    }
  }

  return childrefs
}

// /blog/ => blog
// / => pg
const routepathparsename = routepath => (
  routepath.replace(/\//g, ''))

// for '/' put inside spec/view/page-home
// or maybe use page-root-index or maybe just 'page' or 'pg' <-- like this
// const pgdepbuildroutes = async (opts, rootspecurlpath, rootnode, routes, fin) => {
const pgdepbuildroutes = async (opts, purlpath, pnode, routes, f = []) => {
  if (!routes.length)
    return

  const route = routes[0]
  const routename = route[0]
  const routenamedecoded = routepathparsename(routename)
  const routedetails = route[1]
  const routenoderesolve = route[2]
  const routenodename = routenamedecoded
    ? 'pg-' + routenamedecoded
    : 'pg'
  const routenode = routenoderesolve({}, {}, {
    nodename: routenodename
  })

  // need to find a way to pass down the name
  // maybe the node should return instead a function...
  // function is used here...

  const routenodepath = pgnode_specurlcreate(
    opts, routenode, purlpath)

  const childrefs = await childsdfswrite(
    opts, routenode.nodechilds, routenodepath)

  const rootnode = Object.assign({}, routenode.nodespec, {
    child: childrefs
  })

  await pgfs_writeobj(opts, routenodepath, rootnode)

  // const rootspecurlpath = new url.URL(
  //  `${opts.outputDir.replace(/\/$/, '')}/view/root/spec-baseLocale.json`, opts.metaurl);
  /*
  console.log({
    purlpath,
    routename,
    routedetails,
    routenode,
    routenodename
  })
  */
  return pgdepbuildroutes(opts, purlpath, pnode, routes.slice(1))
}

const pgdep = async opts => {
  opts = pgopts(opts)

  const scriptopts = pgscriptopts(opts)

  await pgfs_dirrmdir(opts.outputDir)

  const rootresolver = await opts.root(scriptopts)
  const root = rootresolver()

  const rootchilds = root.nodechilds
  if (!rootchilds.length) {
    console.log('no childs defined')
    return null
  }

  const rootroutes = root.nodemeta.routes
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

  await pgfs_writeobj(opts, rootspecurlpath, rootnode)

  // then save each page stuff
  await pgdepbuildroutes(
    opts, rootspecurlpath, rootnode, rootroutes)

  // throw new Error('==')
}

export {
  pgdep as default,
  pgscript_helpercreate,
  pglanglocal
}
