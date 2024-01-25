import pgopts from './pgopts.js'
import pgscriptopts from './pgscriptopts.js'
import pglanglocale from './pglanglocale.js'

import {
  pggraphcreate,
  pggraphset,
  pggraphsetchild,
  pggraphsetchildedge,
  pggraphsetrouteedge
} from './pggraph.js'

import {
  key_urlcreate,
  key_refchildcreate,
  key_childlanglocalecreate
} from './pgkey.js'

import {
  pgscript_helpercreate
} from './pgscript.js'

import {
  pgfs_writeobj,
  pgfs_dirrmdir
} from './pgfs.js'

import {
  pgenumNODETYPEPATH
} from './pgenum.js'

// if grouped nodechildlangs defined
//   return those
// else if single nodechilds
//   compose default nodechildlangs from tho
const nodechildlangsget = (opts, nodespec) => (
  nodespec.nodechildlangs || (
    nodespec.nodechilds
      ? [[ opts.i18n[0][0], nodespec.nodechilds ]]
      : []))

const nodechildaslangsgroup = (opts, nodespec) => (
  Array.isArray(nodespec)
    ? nodespec
    : [[ opts.i18n[0][0], nodespec ]])

const routesdfsgraphset = async (opts, graph, nodespec, parentid, routes) => {
  if (!routes.length)
    return graph

  const route = routes[0]
  const routename = route[0]
  const routenamedecoded = routepathparsename(routename)
  // const routedetails = route[1]
  const routenoderesolve = route[2]

  // default name 'index' so childs will be contained
  // within *something* comparable to non-index routes
  const routenodename = `pg-${routenamedecoded || 'index'}`
  const routenode = routenoderesolve({}, {}, {
    nodename: routenodename
  })

  graph = await specdfsgraphsetroot(opts, graph, routenode, parentid)

  return routesdfsgraphset(opts, graph, nodespec, parentid, routes.slice(1))
}

// sets graph nodes recursively deeply from nodespec
// each parent node contains language-locale-specific child lists
const childsdfsgraphset = async (opts, graph, nodespec, parentid) => {
  const nodechildlanglocalegroups = nodechildlangsget(opts, nodespec)
  // const noderoutes = (nodespec.nodemeta || {}).routes
  // const nodechildrefs = []

  for (const nodechildlanglocalegroup of nodechildlanglocalegroups) {
    const childlanglocale = nodechildlanglocalegroup[0]
    const childresolvers = nodechildlanglocalegroup[1]

    for (const i in childresolvers) {
      const childresolver = childresolvers[i]
      const child = (
        typeof childresolver === 'function'
          ? childresolver()
          : childresolver)

      if (child === pgenumNODETYPEPATH) {
        graph = pggraphsetchildedge(
          graph, parentid, childlanglocale, pgenumNODETYPEPATH)
      } else {
        // entirely different list of childs is possible
        // for each langlocale... so each is generated
        const nodename = child.nodespec.name // '/'
        const nodelanglocalename = nodename + '/:' + childlanglocale
        const nodelanglocalekey = key_childlanglocalecreate(
          parentid, nodelanglocalename)

        graph = pggraphsetchild(
          graph, parentid, childlanglocale, nodelanglocalekey, child)

        if (child.nodechilds && child.nodechilds.length) {
          graph = await childsdfsgraphset( // nodespec, fullkeytoparent
            opts, graph, child, nodelanglocalekey)
        }
      }
    }
  }

  return graph
}


const specdfsgraphsetroot = async (opts, graph, nodespec, parentkey) => {
  const isroot = Object.keys(graph).length === 0
  const langlocalegroups = nodechildaslangsgroup(opts, nodespec)
  const nodename = nodespec.nodespec.name // '/'
  const noderoutes = nodespec.nodemeta.routes || []

  // maybe some routes only available some langs
  for (const langlocalegroup of langlocalegroups) {
    const nodelanglocale = langlocalegroup[0]
    const noderesolver = langlocalegroup[1]
    const nodelanglocalename =
          (nodename === '/' ? '' : nodename) + '/:' + nodelanglocale
    const nodelanglocalekey = key_childlanglocalecreate(
      parentkey, nodelanglocalename)

    graph = pggraphset(graph, nodelanglocalekey, nodespec)
    graph = isroot ? graph : pggraphsetrouteedge(
      graph, parentkey, nodelanglocale, nodelanglocalekey)
    graph = await childsdfsgraphset( // nodespec, fullkeytoparent
      opts, graph, noderesolver, nodelanglocalekey)
    graph = await routesdfsgraphset(
      opts, graph, noderesolver, nodelanglocalekey, noderoutes)
  }

  return graph
}

const graphdfswrite = async (opts, lang, graph, key, keyparent) => {
  const node = graph[key]
  const nodechilds = node['child:' + lang] || []
  const noderoutes = node['route:' + lang] || []
  const nodechildpaths = []

  for (const i in nodechilds) {
    const childpath = nodechilds[i] === pgenumNODETYPEPATH
      ? ({ ispathnode: true })
      : key_refchildcreate(opts, keyparent || key, nodechilds[i])
    
    nodechildpaths.push(childpath)

    if (nodechilds[i] !== pgenumNODETYPEPATH) {
      await graphdfswrite(opts, lang, graph, nodechilds[i], key)
    }
  }

  for (const i in noderoutes) {
    const noderoute = noderoutes[i]

    await graphdfswrite(opts, lang, graph, noderoute, key)
  }

  const outputurl = key_urlcreate(opts, key)
  const nodespec = Object.assign({}, node.nodespec, {
    ...(nodechilds.length && {
      child: nodechildpaths
    })
  })

  await pgfs_writeobj(opts, outputurl, nodespec)
}

// /blog/ => blog
// / => pg
const routepathparsename = routepath => (
  routepath.replace(/\//g, ''))

const pgdep = async opts => {
  opts = pgopts(opts)

  const scriptopts = pgscriptopts(opts)

  await pgfs_dirrmdir(opts.outputDir)

  const rootresolver = await opts.root(scriptopts)
  const root = rootresolver()

  const graph = await specdfsgraphsetroot(
    opts, pggraphcreate(), root, '/:eng-US')

  const langs = opts.i18n.reduce((accum, i18n) => {
    accum.push(i18n[0])
    return accum
  }, [])

  // unknown necessary lang+locale combinations, until children are processed
  // fallback to 'default' eg, en-US
  // eng-US, jap-US, eng-JP, jap-JP
  for (const lang of langs) {
    graphdfswrite(opts, lang, graph, '/:' + lang)
  }
}

export {
  pgdep as default,
  pgscript_helpercreate,
  pglanglocale
}
