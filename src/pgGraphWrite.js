import pgOpts from './pgOpts.js'

import {
  pgKeyUrlCreate,
  pgKeyRefChildCreate
} from './pgKey.js'

import {
  pgFsWriteObj,
  pgFsDirRmDir
} from './pgFs.js'

import {
  pgEnumNODETYPEPATH
} from './pgEnum.js'

const cache = {}

const pgGraphWriteIsRecursed = (c => key => (
  c[key] || ((c[key] = true) && false)
))({})

const pgGraphWriteLang = async (opts, lang, graph, key, keyparent) => {
  const node = graph[key]
  const nodechilds = node['child:' + lang] || []
  const noderoutes = node['route:' + lang] || []
  const nodechildpaths = []

  // has happened when key is '/:eng-US'
  // ```
  // route:eng-US': [
  //   '/:eng-US', '/pg-index/:eng-US', '/pg-about/:eng-US' ],'
  // ```
  if (pgGraphWriteIsRecursed(key)) {
    throw new Error("key is recursed: " + key, node)
  }

  for (const i in nodechilds) {
    const childpath = nodechilds[i] === pgEnumNODETYPEPATH
      ? ({ ispathnode: true })
      : pgKeyRefChildCreate(opts, keyparent || key, nodechilds[i])
    
    nodechildpaths.push(childpath)

    if (nodechilds[i] !== pgEnumNODETYPEPATH) {
      await pgGraphWriteLang(opts, lang, graph, nodechilds[i], key)
    }
  }

  for (const i in noderoutes) {
    await pgGraphWriteLang(
      opts, lang, graph, noderoutes[i], key)
  }

  const nodespec = Object.assign({}, node.nodespec, {
    ...(nodechilds.length && {
      child: nodechildpaths
    })
  })

  const nodemeta = node.nodemeta || {}
  const routemeta = nodemeta.routemeta
  if (routemeta) {
    nodespec.subj = Object.assign(
      nodespec.subj || {},
      Object.keys(routemeta).reduce((acc, k) => (
        acc[`gnmeta${k}`] = routemeta[k],
        acc), {}))
  }

  await pgFsWriteObj(
    opts, pgKeyUrlCreate(opts, key), nodespec)
}


const pgGraphWrite = async (graph, opts) => {
  // opts = pgOpts(opts)
  await pgFsDirRmDir(opts.outputDir)

  // unknown necessary lang+locale combinations, until children are processed
  // fallback to 'default' eg, en-US
  // eng-US, jap-US, eng-JP, jap-JP  
  const langs = opts.i18nPriority
  for (const lang of langs) {
    await pgGraphWriteLang(opts, lang, graph, '/:' + lang)
  }
}

export {
  pgGraphWrite as default
}
