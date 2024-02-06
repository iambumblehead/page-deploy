import {
  pgEnumNODETYPEPATH,
  pgEnumSPECPROPTYPEisValidRe
} from './pgEnum.js'

const nextId = ((id = 0) => () => ++id)()

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

const pgCreatorHelperCreate = pgname => (nodename, nodespec, nodechilds, m) => {
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
      toString: () => 'NODEDESIGN',
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
    pgscriptid: nodescriptid,
    pgscript: true
  })
}

export default pgCreatorHelperCreate

/*
const pgroot = (childs, routes) => {
  // root/
  // return pgCreatorHelpercreate('uiroot')('/root/', null, childs, {
  return pgCreatorHelpercreate('uiroot')('/', null, childs, {
    routes
  })
}

export {
  pgCreatorHelpercreate,
  // pgpathtree,
  pgroot
}
*/
