
import pgOpts from './pgOpts.js'

import {
  pgNodeDesignPropRun,
  pgNodeDesignRun,
  pgNodeDesign,
  pgNodeDesignRoutesIs,
  // pgNodeDesignChainRun,
  pgNodeDesignLangGrouped,
  pgNodeDesignChildsLangGrouped
} from './pgNodeDesign.js'

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
  const routenode = routenoderesolve({
    nodename: routenodename,
    routemeta: routedetails
  })

  graph = await pgGraphBuildDFS(opts, graph, routenode, parentid)

  return routesdfsgraphset(opts, graph, nodespec, parentid, routes.slice(1))
}

const childsdfsgraphset = async (opts, graph, nodespec, parentid) => {
  const nodechildlanglocalegroups = pgNodeDesignChildsLangGrouped(
    opts, nodespec)
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

      if (pgNodeDesignRoutesIs(child)) {
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
        child.nodespec = await pgNodeDesignRun(
          opts,
          childlanglocale,
          graph,
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
  const langlocalegroups = pgNodeDesignLangGrouped(opts, nodespec)
  const nodename = nodespec.nodespec.name // eg, '/'
  const noderoutes = nodespec.nodechilds
    .find(c => pgNodeDesignRoutesIs(c)) || []

  // some routes only available some langs
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

  const dNodeRoot = pgNodeDesign('uiroot')('/', null, dtree)()
  const graph = await pgGraphBuildDFS(
    opts, pgGraphCreate(), dNodeRoot, '/:eng-US')

  return graph
}

export {
  pgGraphBuild as default
}
