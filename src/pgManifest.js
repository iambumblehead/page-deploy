import {
  key_routeencode
} from './pgkey.js'

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

const pgManifestroutes = (graph, key, lang, noderoutes, routes = []) => {
  if (!noderoutes.length)
    return routes

  const route = pgManifestroute(graph, noderoutes[0], lang)

  routes.push(route)

  return pgManifestroutes(graph, key, lang, noderoutes.slice(1), routes)
}

const pgManifestroute = (graph, key, lang) => {
  const node = graph[key]
  const noderoutes = node['route:' + lang] || []

  const routes = pgManifestroutes(graph, key, lang, noderoutes)
  const route = key_routeencode(key)
  
  return routes.length
    ? [ route, [ routes.flat() ]]
    : [ route ]
}

const pgManifestcreate = (opts, graph) => {
  const manifestroutes = pgManifestroute(
    graph, '/:eng-US', 'eng-US')

  return {
    appname: opts.appname,
    deploytype: opts.deploytype,
    routes: (manifestroutes[1] || [])[0] || []
  }
}

export {
  pgManifestcreate as default
}
