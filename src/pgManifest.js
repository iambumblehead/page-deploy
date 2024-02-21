import url from 'node:url'

import {
  pgFsRead
} from './pgFs.js'

import {
  pgKeyRouteEncode
} from './pgKey.js'

import {
  pgGraphGetRootKeys
} from './pgGraph.js'

import {
  pgLocaleKeyMatchRe
} from './pgLocale.js'

// generates something like below
// [
//    '/',
//    '/about/',
//    '/links/',
//    '/gallery/',
//    '/site-map/',
//    '/blog/', [[
//      '/blog/',
//      '/blog/all',
//      '/blog/pg-:num',
//      '/blog/:article'
//    ]],
//    '/media/', [[
//      '/media/',
//      '/media/all',
//      '/media/pg-:num',
//      '/media/:article'
//    ]]
//  ]
const pgManifestRoutes = (graph, key, lang, noderoutes, routes = []) => {
  if (!noderoutes.length)
    return routes

  const route = pgManifestRoute(graph, noderoutes[0], lang)

  routes.push(route)

  return pgManifestRoutes(graph, key, lang, noderoutes.slice(1), routes)
}

const pgManifestRoute = (graph, key, lang) => {
  const node = graph[key]
  const noderoutes = node['route:' + lang] || []
  const routes = pgManifestRoutes(graph, key, lang, noderoutes)
  const route = pgKeyRouteEncode(key)
    .replace(pgLocaleKeyMatchRe, '')
  
  return routes.length
    ? [ route, [ routes.flat() ]]
    : [ route ]
}

// 'appname:1.0.0,gjson.gani:48.3.2,2024.10.03'
const pgManifestBuildIdCreate = async opts => {
  const date = new Date()
  const packageUrl = new url.URL('../package.json', import.meta.url)
  const packageVersion = (
    await pgFsRead(packageUrl)
      .then(s => JSON.parse(s))
      .then(p => p.version)
      .catch(() => '??.??.??'))

  return [
    opts.name + ':' + opts.version,
    'gani.gjson:' + packageVersion,
    [ date.getFullYear(),
      ("0" + date.getMonth() + 1).slice(-2),
      ("0" + date.getDay()).slice(-2)
    ].join('.')
  ].join()
}

const pgManifestCreate = async (opts, graph, arg) => {
  const rootKeys = pgGraphGetRootKeys(graph)
  const rootKey = rootKeys[0]
  const rootKeyLocaleId = rootKey.match(pgLocaleKeyMatchRe)[1]
  const manifestroutes = pgManifestRoute(
    graph, rootKey, rootKeyLocaleId)

  return {
    buildid: await pgManifestBuildIdCreate(opts),
    deploy: opts.deploytype,
    name: opts.name,
    version: opts.version,
    description: opts.description,
    routes: (manifestroutes[1] || [])[0] || []
  }
}

export {
  pgManifestCreate as default
}
