import {
  pgobjcreate,
  pgobjset,
  pgobjget,
  pgobjrm
} from './pgobj.js'

const pggraphcreate = () => (
  pgobjcreate())

const pggraphset = (graph, key, val) => (
  pgobjset(graph, key, val))

const pggraphrm = (graph, key) => (
  pgobjrm(graph, key))

const pggraphsetchildedge = (graph, pkey, langlocale, key) => {
  const pnodeold = pgobjget(graph, pkey)
  const childpropname = `child:${langlocale}`
  const childpropval = [ ...(pnodeold[childpropname] || []), key ]

  return pgobjset(graph, pkey, {
    ...pnodeold,
    [childpropname]: childpropval
  })
}

const pggraphsetrouteedge = (graph, pkey, langlocale, key) => {
  const pnodeold = pgobjget(graph, pkey)
  const routepropname = `route:${langlocale}`
  const routepropval = [ ...(pnodeold[routepropname] || []), key ]

  return pgobjset(graph, pkey, {
    ...pnodeold,
    [routepropname]: routepropval
  })
}

const pggraphsetchild = (graph, pkey, langlocale, key, val) => {
  graph = pggraphsetchildedge(graph, pkey, langlocale, key)

  return pggraphset(graph, key, val)
}

export {
  pggraphsetrouteedge,
  pggraphsetchildedge,
  pggraphsetchild,
  pggraphcreate,
  pggraphset,
  pggraphrm
}

