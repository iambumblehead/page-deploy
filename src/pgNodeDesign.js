import {
  pgEnumNODEDESIGNTYPE,
  pgEnumNODEDESIGNTYPERESOLVER,
  pgEnumSPECPROPTYPEisValidRe,

  pgEnumIsChain,
  pgEnumIsChainDeep,
  pgEnumIsChainANDGREEDY
} from './pgEnum.js'

import {
  pgLocaleKeyCreate
} from './pgLocale.js'

import {
  pgKeyChildLangLocaleCreate
} from './pgKey.js'

const nextId = ((id = 0) => () => ++id)()

// eg,
// parent([
//   child,
//   child,
//   [['/path', pchild, pchild]],
//   child
// ])
const pgNodeDesignRoutesIs = child => {
  return Array.isArray(child)
    && Array.isArray(child[0])
    && typeof child[0][0] === 'string'
}

const pgCreatorHelperArgSpecIsValid = nodespec => (
  nodespec === null || (
    typeof nodespec === 'object' && Object.keys(nodespec).every(
      k => pgEnumSPECPROPTYPEisValidRe.test(k))))

// returns normalized args
// ex, [ nodename, nodespc, nodechilds ]
const pgCreatorHelperArgsGet = (nodename, nodespec, nodechilds) => {
  const args = [nodename, nodespec, nodechilds]

  if (typeof args[0] !== 'string' && args !== null)
    args.unshift(null)
  if (Array.isArray(args[1]))
    args.splice(1, 0, null)
  if (!Array.isArray(args[2]))
    args.splice(2, 0, null)

  return args
}

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
const pgNodeDesignPropRun = async (opts, ll, graph, node, prop, val) => {
  if (pgEnumIsChain(val)) {
    return pgNodeDesignChainRun(
      opts, ll, graph, node, val, prop)
  }

  if (!pgEnumIsChainDeep(val))
    return val // return literal value

  const acc = []
  if (Array.isArray(val)) {
    for (const valprop in val) {
      acc[valprop] = await pgNodeDesignPropRun(
        opts, ll, graph, node, valprop, val[valprop])
    }

    return acc.flat()
  }

  for (const valprop of Object.keys(val)) {
    const resolved = await pgNodeDesignPropRun(
      opts, ll, graph, node, valprop, val[valprop])

    if (pgEnumIsChainANDGREEDY(val[valprop])) {
      acc.push(resolved)
    } else {
      acc[0] = acc[0] || {}
      acc[0][valprop] = resolved
    }
  }

  return acc[0] === undefined ? acc.slice(1) : acc
}

// possibly the caller could call nodeproprun directly
// a placeholder in case the order of top-level properties
// becomes important or if resolving downward and upward
// becomes important
const pgNodeDesignRun = async (opts, ll, graph, child) => {
  const nodespec = child.nodespec
  const nodespecresolved = {}

  for (const prop in nodespec) {
    nodespecresolved[prop] = await pgNodeDesignPropRun(
      opts, ll, graph, child, prop, nodespec[prop])
  }

  return Object.assign(child, {
    nodespec: nodespecresolved
  })
}

const pgNodeDesignLangLocaleKeyCreate = (localeId, parentKey, node) => {
  const nodename = node.nodespec.name
  const nodekey = pgLocaleKeyCreate(
    pgKeyChildLangLocaleCreate(parentKey, nodename) + '/', localeId)

  // { nodelanglocalekey: '/dataenv/:eng' }
  return nodekey
}

const pgNodeDesign = pgname => (nodename, nodespec, nodechilds, m) => {
  const args = pgCreatorHelperArgsGet(nodename, nodespec, nodechilds)
  const nodescriptid = nextId()

  nodename = args[0] || pgname
  nodespec = args[1]
  nodechilds = args[2]

  if (nodespec && !pgCreatorHelperArgSpecIsValid(nodespec))
    nodespec = { subj: nodespec }
  if (!nodespec)
    nodespec = {}

  // this allows node to be constructed in lazy way,
  // so parent-defined route-name usable to create node name
  return Object.assign((nodemeta = {}) => {
    if (nodemeta && nodemeta.nodename) {
      nodename = nodemeta.nodename
    }

    return {
      nodetype: pgEnumNODEDESIGNTYPE,
      nodescriptid,
      nodemeta: m ? Object.assign(nodemeta, m) : nodemeta,
      nodechilds,
      nodespec: Object.assign({
        node: pgname,
        name: nodename
      }, nodespec)
    }
  }, {
    nodetype: pgEnumNODEDESIGNTYPERESOLVER,
    nodescriptid
  })
}

// define the query 'environment' then run query
const pgNodeDesignChainRun = async (opts, lang, graph, node, spec, prop) => {
  spec.state = Object.assign(spec.state, {
    opts,
    lang,
    graph,
    node,
    outerprop: prop
  })

  return spec.run()
}

export {
  pgNodeDesign as default,
  pgNodeDesign,
  pgNodeDesignRun,
  pgNodeDesignPropRun,
  pgNodeDesignChainRun,
  pgNodeDesignRoutesIs,
  pgNodeDesignLangLocaleKeyCreate
}
