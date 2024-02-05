const pgGraphCreate = () => ({})

const pgGraphSet = (graph, key, val) => (
  graph[key] = Object.assign(val, { key }),
  graph)

const pgGraphRm = (graph, key) => (
  delete graph[key],
  graph)

const pgGraphSetChildEdge = (graph, pkey, langlocale, key) => {
  const pnodeold = graph[pkey]
  const childpropname = `child:${langlocale}`
  const childpropval = [ ...(pnodeold[childpropname] || []), key ]

  return pgGraphSet(graph, pkey, {
    ...pnodeold,
    [childpropname]: childpropval
  })
}

const pgGraphSetRouteEdge = (graph, pkey, langlocale, key) => {
  const pnodeold = graph[pkey]
  const routepropname = `route:${langlocale}`
  const routepropval = [ ...(pnodeold[routepropname] || []), key ]

  return pgGraphSet(graph, pkey, {
    ...pnodeold,
    [routepropname]: routepropval
  })
}

const pgGraphSetChild = (graph, pkey, langlocale, key, val) => {
  graph = pgGraphSetChildEdge(graph, pkey, langlocale, key)

  return pgGraphSet(graph, key, val)
}

export {
  pgGraphSetRouteEdge,
  pgGraphSetChildEdge,
  pgGraphSetChild,
  pgGraphCreate,
  pgGraphSet,
  pgGraphRm
}
