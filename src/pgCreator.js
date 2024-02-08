import {
  // pgEnumNODETYPEPATH,
  pgEnumNODEDESIGNTYPE,
  pgEnumNODEDESIGNTYPERESOLVER,
  pgEnumSPECPROPTYPEisValidRe
} from './pgEnum.js'

const nextId = ((id = 0) => () => ++id)()

// eg,
// parent([
//   child,
//   child,
//   [['/path', pchild, pchild]],
//   child
// ])
const pgDesignNodeRoutesIs = child => {
  return Array.isArray(child)
    && Array.isArray(child[0])
    && typeof child[0][0] === 'string'
}

// node childs may differ for language and/or locale combinations
//
// if grouped nodechildlangs defined
//   return those
// else if single nodechilds
//   compose default nodechildlangs from tho
const pgDesignNodeChildsLangGrouped = (opts, nodespec) => (
  nodespec.nodechildlangs || (
    nodespec.nodechilds
    // ? [[ opts.i18n[0][0], nodespec.nodechilds ]]
      ? [[ opts.i18nPriority[0], nodespec.nodechilds ]]
      : []))

// dnode,
//   => [['eng-US', dnode]]
// [['eng-US', dnode], ['jap-JP', dnode]]
//   => [['eng-US', dnode], ['jap-JP', dnode]]
const pgDesignNodeLangGrouped = (opts, dnode) => (
  Array.isArray(dnode)
    ? dnode
    : [[ opts.i18nPriority[0], dnode ]])

const pgCreatorHelperArgSpecIsValid = nodespec => (
  nodespec === null || (
    typeof nodespec === 'object' && Object.keys(nodespec).every(
      k => pgEnumSPECPROPTYPEisValidRe.test(k))))

// returns [ nodename, nodespc, nodechilds ]
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

// const pgCreatorHelperCreate = pgname => (nodename, nodespec, nodechilds, m) => {
const pgDesignNode = pgname => (nodename, nodespec, nodechilds, m) => {
  const args = pgCreatorHelperArgsGet(nodename, nodespec, nodechilds)
  const nodescriptid = nextId()
  // console.log({ nodescriptid, nodename })

  nodename = args[0] || pgname
  nodespec = args[1]
  nodechilds = args[2]

  if (nodespec && !pgCreatorHelperArgSpecIsValid(nodespec))
    nodespec = { subj: nodespec }
  if (!nodespec)
    nodespec = {}

  // this allows node to be constructed in lazy way,
  // so parent-defined route-name usable to create node name
  return Object.assign((graph, pnode, nodemeta = {}) => {
    if (nodemeta.nodename) {
      nodename = nodemeta.nodename
    }

    if (nodename === 'dataenv') {
      // console.log({ nodename })
      //throw new Error('nonon')
    }
    
    return {
      // toString: () => pgEnumNODEDESIGNTYPERESOLVER,
      nodetype: pgEnumNODEDESIGNTYPE,
      nodescriptid,
      nodemeta: m ? Object.assign(nodemeta, m) : nodemeta,
      nodechilds,
      nodespec: {
        node: pgname,
        name: nodename,
        ...nodespec
      }
    }
  }, {
    nodetype: pgEnumNODEDESIGNTYPERESOLVER,
    pgscriptid: nodescriptid,
    pgscript: true
  })
}

const pgDesignNodeChainRun = async (opts, lang, graph, node, spec, prop) => {
  // establish the query 'environment'
  spec.state = Object.assign(spec.state, {
    opts,
    lang,
    graph,
    node,
    outerprop: prop,
    key: node.key
  })

  // then, run query
  return spec.run()
}

export {
  pgDesignNode as default,
  pgDesignNode,
  pgDesignNodeChainRun,
  pgDesignNodeRoutesIs,
  pgDesignNodeLangGrouped,
  pgDesignNodeChildsLangGrouped
}
