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

const pgmanifestroutes = (graph, key, lang, noderoutes, routes = []) => {
  if (!noderoutes.length)
    return routes

  const route = pgmanifestroute(graph, noderoutes[0], lang)

  routes.push(route)

  return pgmanifestroutes(graph, key, lang, noderoutes.slice(1), routes)
}

const pgmanifestroute = (graph, key, lang) => {
  const node = graph[key]
  const noderoutes = node['route:' + lang] || []

  const routes = pgmanifestroutes(graph, key, lang, noderoutes)
  const route = key_routeencode(key)
  
  return routes.length
    ? [ route, [ routes.flat() ]]
    : [ route ]
}

const pgmanifestcreate = (opts, graph) => {
  const manifestroutes = pgmanifestroute(
    graph, '/:eng-US', 'eng-US')

  return manifestroutes[1][0]
}

export {
  pgmanifestcreate as default
}
