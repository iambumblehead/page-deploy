
import pgOpts from './pgOpts.js'

import {
  pgDesignNode,
  pgDesignNodeRoutesIs,
  pgDesignNodeChainRun,
  pgDesignNodeLangGrouped,
  pgDesignNodeChildsLangGrouped
} from './pgCreator.js'

import {
  pgGraphCreate,
  pgGraphSet,
  pgGraphSetChild,
  pgGraphSetChildEdge,
  pgGraphSetRouteEdge
} from './pgGraph.js'

import {
  pgEnumNODETYPEPATH,
  // pgEnumNODETYPEPATH,
  pgEnumIsChain,
  // pgEnumQueryNameIsGREEDYRe,,
  pgEnumIsChainANDGREEDY,
  pgEnumIsChainDeep
} from './pgEnum.js'

import {
  key_urlcreate,
  key_refchildcreate,
  key_childlanglocalecreate
} from './pgkey.js'

// /blog/ => blog
// / => pg
const routepathparsename = routepath => (
  routepath.replace(/\//g, ''))

// {
//   requrl: d.typefn('getrequrl'),
//   other: 'val'
// }
//
// [{
//   requrl: d.typefn('getrequrl'),
//   other: 'val'
// }]
//
// [{
//   requrl: d.typefn('getrequrl')
// }, {
//   other: 'val'
// }]
const resolvespec = async (opts, lang, graph, child, spec, prop, acc = []) => {
  if (pgEnumIsChain(spec)) {
    return pgDesignNodeChainRun(
      opts, lang, graph, child, spec, prop)
  }

  if (!pgEnumIsChainDeep(spec))
    return spec // return literal value

  if (Array.isArray(spec)) {
    for (const specprop in spec) {
      acc[specprop] = await resolvespec(
        opts, lang, graph, child, spec[specprop], specprop)
    }

    return acc.flat()
  }

  for (const specprop of Object.keys(spec)) {
    const resolved = await resolvespec(
      opts, lang, graph, child, spec[specprop], specprop)

    if (String(resolved.prop).endsWith('subj.requrl')) {
      // console.log('RESOLVED', resolved, child)
      // throw new Error('====')
    }
    if (pgEnumIsChainANDGREEDY(spec[specprop])) {
      acc.push(resolved)
    } else {
      acc[0] = acc[0] || {}
      acc[0][specprop] = resolved
    }
  }

  return acc[0] === undefined ? acc.slice(1) : acc
}

const resolvespecs = async (opts, lang, graph, child) => {
  const resolvedspec = {}
  const childspec = child.nodespec

  for (const specprop in childspec) {
    const childspecpropval = childspec[specprop]
    
    resolvedspec[specprop] = (
      pgEnumIsChainDeep(childspecpropval)
        || typeof childspecpropval === 'function')
      ? await resolvespec(opts, lang, graph, child, childspecpropval, specprop)
      : childspecpropval
  }

  return resolvedspec
}

const routesdfsgraphset = async (opts, graph, nodespec, parentid, routes) => {
  if (!routes.length)
    return graph

  const route = routes[0]
  const routename = route[0]

  // routedetails ex, { title, description }
  const routedetails = route[1][0]
  const routenamedecoded = routepathparsename(routename)
  const routenoderesolve = route[2]

  // default name 'index' so childs will be contained
  // within *something* comparable to non-index routes
  const routenodename = `pg-${routenamedecoded || 'index'}`
  const routenode = routenoderesolve({}, {}, {
    nodename: routenodename,
    routemeta: routedetails
  })

  graph = await pgGraphBuildDFS(opts, graph, routenode, parentid)

  return routesdfsgraphset(opts, graph, nodespec, parentid, routes.slice(1))
}

const childsdfsgraphset = async (opts, graph, nodespec, parentid) => {
  const nodechildlanglocalegroups = pgDesignNodeChildsLangGrouped(opts, nodespec)
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

      if (pgDesignNodeRoutesIs(child)) {
      // if (child === pgEnumNODETYPEPATH) {
        graph = pgGraphSetChildEdge(
          graph, parentid, childlanglocale, pgEnumNODETYPEPATH)
      } else {
        // entirely different list of childs is possible
        // for each langlocale... so each is generated
        const nodename = child.nodespec.name // '/'
        const nodelanglocalename = nodename + '/:' + childlanglocale
        const nodelanglocalekey = key_childlanglocalecreate(
          parentid, nodelanglocalename)

        if (typeof childresolver === 'function') {
          childresolver.graphkeys = childresolver.graphkeys || []
          childresolver.graphkeys.push(nodelanglocalekey)
        }
        // child.nodespec = resolvespec(child.nodespec)
        // need to set node first
        // console.log(child, nodelanglocalekey)
        child.nodespec = await resolvespecs(
          opts,
          childlanglocale,
          graph,
          // nodelanglocalekey,
          Object.assign(child, {
            key: nodelanglocalekey
          }))

        graph = pgGraphSetChild(
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

const pgGraphBuildDFS = async (opts, graph, nodespec, parentkey) => {
  const isroot = Object.keys(graph).length === 0
  const langlocalegroups = pgDesignNodeLangGrouped(opts, nodespec)
  const nodename = nodespec.nodespec.name // '/'
  // const noderoutes = nodespec.nodemeta.routes || []
  // isRoute(child)
  const noderoutes = nodespec.nodechilds
    .find(c => pgDesignNodeRoutesIs(c)) || []
  // onst noderoutes = nodespec.nodemeta.routes || []

  // maybe some routes only available some langs
  for (const langlocalegroup of langlocalegroups) {
    const nodelanglocale = langlocalegroup[0]
    const noderesolver = langlocalegroup[1]
    const nodelanglocalename =
          (nodename === '/' ? '' : nodename) + '/:' + nodelanglocale
    const nodelanglocalekey = key_childlanglocalecreate(
      parentkey, nodelanglocalename)

    graph = pgGraphSet(graph, nodelanglocalekey, nodespec)
    graph = isroot ? graph : pgGraphSetRouteEdge(
      graph, parentkey, nodelanglocale, nodelanglocalekey)
    graph = await childsdfsgraphset( // nodespec, fullkeytoparent
      opts, graph, noderesolver, nodelanglocalekey)
    graph = await routesdfsgraphset(
      opts, graph, noderesolver, nodelanglocalekey, noderoutes)
  }

  return graph
}

const pgGraphBuild = async (dtree, opts) => {
  opts = pgOpts(opts)

  const dNodeRoot = pgDesignNode('uiroot')('/', null, dtree)()
  const graph = await pgGraphBuildDFS(
    opts, pgGraphCreate(), dNodeRoot, '/:eng-US')

  return graph
}

export {
  pgGraphBuild as default
}
