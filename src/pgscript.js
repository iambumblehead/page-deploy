import {
  pgenumNODETYPEPATH,
  pgenumSPECPROPTYPEisValidRe
} from './pgenum.js'

const pgscript_helperargspecisvalid = nodespec => (
  nodespec === null || (
    typeof nodespec === 'object' && Object.keys(nodespec).every(
      k => pgenumSPECPROPTYPEisValidRe.test(k))))

// returns [ nodename, nodespc, nodechilds ]
const pgscript_helperargsget = (nodename, nodespec, nodechilds) => {
  const args = [nodename, nodespec, nodechilds]

  if (typeof args[0] !== 'string' && args !== null)
    args.unshift(null)
  if (Array.isArray(args[1]))
    args.splice(1, 0, null)
  if (!Array.isArray(args[2]))
    args.splice(2, 0, null)

  return args
}

const pgscript_helpercreate = pgname => (nodename, nodespec, nodechilds, m) => {
  const args = pgscript_helperargsget(nodename, nodespec, nodechilds)

  nodename = args[0] || pgname
  nodespec = args[1]
  nodechilds = args[2]

  if (nodespec && !pgscript_helperargspecisvalid(nodespec))
    nodespec = { subj: nodespec }
  if (!nodespec)
    nodespec = {}

  // this allows node to be constructed in lazy way,
  // so parent-defined route-name usable to create node name
  return (graph, pnode, nodemeta = {}) => {
    if (nodemeta.nodename) {
      nodename = nodemeta.nodename
    }

    return {
      nodemeta: m ? Object.assign(nodemeta, m) : nodemeta,
      nodechilds,
      nodespec: {
        node: pgname,
        name: nodename,
        ...nodespec
      }
    }
  }
}

const pgroot = (childs, routes) => {
  return pgscript_helpercreate('uiroot')('/', null, childs, {
    routes
  })
}

const pgpathtree = pgenumNODETYPEPATH

export {
  pgscript_helpercreate,
  pgpathtree,
  pgroot
}
