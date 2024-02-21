import {
  pgEnumGRAPHMETADESIGNNODEMAPS,
  pgEnumGRAPHMETADETAILS,
  pgEnumGRAPHTYPE
} from './pgEnum.js'

const pgGraphCreate = details => ({
  nodetype: pgEnumGRAPHTYPE,
  [pgEnumGRAPHMETADETAILS]: details,
  [pgEnumGRAPHMETADESIGNNODEMAPS]: {}
})

const pgGraphSet = (graph, key, val) => (
  graph[key] = val,
  graph)

const pgGraphSetNode = (graph, key, val) => (
  pgGraphSet(graph, key, Object.assign(val, { key })))

const pgGraphRm = (graph, key) => (
  delete graph[key],
  graph)

const pgGraphSetChildEdge = (graph, pkey, langlocale, key) => {
  const pnodeold = graph[pkey]
  const childpropname = `child:${langlocale}`
  const childpropval = [ ...(pnodeold[childpropname] || []), key ]

  return pgGraphSetNode(graph, pkey, {
    ...pnodeold,
    [childpropname]: childpropval
  })
}

const pgGraphSetRouteEdge = (graph, pkey, langlocale, key) => {
  const pnodeold = graph[pkey]
  const routepropname = `route:${langlocale}`
  const routepropval = [ ...(pnodeold[routepropname] || []), key ]

  return pgGraphSetNode(graph, pkey, {
    ...pnodeold,
    [routepropname]: routepropval
  })
}

const pgGraphSetChild = (graph, pkey, langlocale, key, val) => {
  graph = pgGraphSetChildEdge(graph, pkey, langlocale, key)

  return pgGraphSetNode(graph, key, val)
}

// graph: {
//   META_DESIGN_NODE_MAP: {
//     [$designid]: {
//       eng_US: '/root/home/footer/:eng_US',
//       jap_JP: '/root/home/footer/:jap_JP'
//     }
//   }
// }
const pgGraphResolverLocaleKeySet = (graph, locale, localekey, id) => {
  const designNodeMaps = graph[pgEnumGRAPHMETADESIGNNODEMAPS] || {}
  const designNodeMap =  Object.assign(designNodeMaps, {
    [id]: designNodeMaps[id] || ({
      [locale]: localekey
    })
  })
  
  return pgGraphSet(graph, pgEnumGRAPHMETADESIGNNODEMAPS, designNodeMap)
}

const pgGraphResolverLocaleKeyGet = (graph, locale, id) => {
  const designNodeMaps = graph[pgEnumGRAPHMETADESIGNNODEMAPS]
  const idNodeMaps = designNodeMaps[id]

  return idNodeMaps[locale]
}

const pgGraphGetRootKeys = graph => (
  Object.keys(graph)
    .filter(key => key.startsWith('/:')))

export {
  pgGraphSet,
  pgGraphSetNode,
  pgGraphSetRouteEdge,
  pgGraphSetChildEdge,
  pgGraphSetChild,
  pgGraphCreate,
  pgGraphGetRootKeys,
  pgGraphRm,
  pgGraphResolverLocaleKeySet,
  pgGraphResolverLocaleKeyGet
}
