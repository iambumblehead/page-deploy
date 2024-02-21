
import pgOpts from './pgOpts.js'

import {
  pgNodeDesignRun,
  pgNodeDesign,
  pgNodeDesignRoutesIs,
  pgNodeDesignLangLocaleKeyCreate
} from './pgNodeDesign.js'

import {
  pgGraphCreate,
  pgGraphSet,
  pgGraphSetChild,
  pgGraphSetChildEdge,
  pgGraphSetRouteEdge,
  pgGraphResolverLocaleKeySet
} from './pgGraph.js'

import {
  pgLocaleKeyCreate,
  pgLocaleGroupsNodeDesign,
  pgLocaleGroupsNodeDesignChilds,
  pgLocaleOptsLocaleLangStart
} from './pgLocale.js'

import {
  pgEnumNODETYPEPATH,
  pgEnumNodeDesignTypeResolverIs
} from './pgEnum.js'

import {
  pgKeyChildLangLocaleCreate
} from './pgKey.js'

const pathSepRe = /\//g

// /blog/ => blog
// / => pg
const routepathparsename = routepath => routepath.replace(pathSepRe, '')

const pgGraphBuildNodeRoutes = async (opts, graph, parentKey, node, routes) => {
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

  graph = await pgGraphBuildNode(opts, graph, parentKey, routenode)

  return pgGraphBuildNodeRoutes(
    opts, graph, parentKey, node, routes.slice(1))
}

const pgGraphBuildNodeChilds = async (opts, graph, parentKey, nodespec) => {
  const nodechildlanglocalegroups = (
    pgLocaleGroupsNodeDesignChilds(opts, nodespec))

  for (const nodechildlanglocalegroup of nodechildlanglocalegroups) {
    const childll = nodechildlanglocalegroup[0]
    const childllresolvers = nodechildlanglocalegroup[1]

    for (const i in childllresolvers) {
      const childllresolver = childllresolvers[i]

      if (pgNodeDesignRoutesIs(childllresolver)) {
        graph = pgGraphSetChildEdge(
          graph, parentKey, childll, pgEnumNODETYPEPATH)
      } else {
        const childDesign = pgEnumNodeDesignTypeResolverIs(childllresolver)
          ? childllresolver()
          : childllresolver

        // different childs list possible each language
        const nodelanglocalekey = pgNodeDesignLangLocaleKeyCreate(
          childll, parentKey, childDesign)

        graph = pgGraphResolverLocaleKeySet(
          graph, childll, nodelanglocalekey, childDesign.nodescriptid)

        const childDesignHydrated = await pgNodeDesignRun(
          opts, childll, graph,
          Object.assign(childDesign, { key: nodelanglocalekey }))
        const childDesignHydratedChilds =
          childDesignHydrated.nodechilds || []

        graph = pgGraphSetChild(
          graph, parentKey,
          childll, nodelanglocalekey, childDesignHydrated)

        if ((childDesignHydratedChilds || []).length) {
          graph = await pgGraphBuildNodeChilds(
            opts, graph, nodelanglocalekey, childDesignHydrated)
        }
      }
    }
  }

  return graph
}

const pgGraphBuildNode = async (opts, graph, parentkey, nodespec) => {
  // /:eng-US <-- root node looks like this
  const langlocalegroups = pgLocaleGroupsNodeDesign(opts, nodespec)
  const nodename = nodespec.nodespec.name // eg, '/'
  const noderoutes = nodespec.nodechilds
    .find(c => pgNodeDesignRoutesIs(c)) || []
  const nodeIsRoot = nodename === '/'  

  // some routes only available some langs
  for (const langlocalegroup of langlocalegroups) {
    const nodelanglocale = langlocalegroup[0]
    const noderesolver = langlocalegroup[1]
    const nodelanglocalename = (
      nodename === '/' ? '' : nodename + '/') + ':' + nodelanglocale
    const nodelanglocalekey = pgKeyChildLangLocaleCreate(
      parentkey, nodelanglocalename)
    
    graph = pgGraphSet(graph, nodelanglocalekey, nodespec)
    graph = nodeIsRoot ? graph : pgGraphSetRouteEdge(
      graph, parentkey, nodelanglocale, nodelanglocalekey)
    graph = await pgGraphBuildNodeChilds(
      opts, graph, nodelanglocalekey, noderesolver)
    graph = await pgGraphBuildNodeRoutes(
      opts, graph, nodelanglocalekey, noderesolver,  noderoutes)
  }

  return graph
}

const pgGraphBuild = async (dtree, opts) => {
  opts = pgOpts(opts)

  const treemanifest = dtree[0]
  const tree = dtree[1]
  const rootPath = '/'
  const rootDNode = pgNodeDesign('uiroot')(rootPath, null, tree)()
  const rootLocaleId = pgLocaleOptsLocaleLangStart(opts)
  const rootKey = pgLocaleKeyCreate(rootPath, rootLocaleId)
  const graph = await pgGraphBuildNode(
    opts, pgGraphCreate(treemanifest), rootKey, rootDNode)

  return graph
}

export {
  pgGraphBuild as default
}
