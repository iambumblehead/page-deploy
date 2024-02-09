import pgGraphBuild from './pgGraphBuild.js'
import pgNodeDesign from './pgNodeDesign.js'
import pgManifest from './pgManifest.js'
import pgReql from './pgReql.js'
import pgOpts from './pgOpts.js'
import pgLog from './pgLog.js'

import {
  pgUrlManifestCreate
} from './pgUrl.js'

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

const graphdfswrite = async (opts, lang, graph, key, keyparent) => {
  const node = graph[key]
  const nodechilds = node['child:' + lang] || []
  const noderoutes = node['route:' + lang] || []
  const nodechildpaths = []

  for (const i in nodechilds) {
    const childpath = nodechilds[i] === pgEnumNODETYPEPATH
      ? ({ ispathnode: true })
      : pgKeyRefChildCreate(opts, keyparent || key, nodechilds[i])
    
    nodechildpaths.push(childpath)

    if (nodechilds[i] !== pgEnumNODETYPEPATH) {
      await graphdfswrite(opts, lang, graph, nodechilds[i], key)
    }
  }

  for (const i in noderoutes) {
    await graphdfswrite(
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

const pg = {
  creator: pgNodeDesign,  
  graphCreate: pgGraphBuild,
  graphWrite: async (graph, opts) => {
    opts = pgOpts(opts)

    await pgFsDirRmDir(opts.outputDir)

    // unknown necessary lang+locale combinations, until children are processed
    // fallback to 'default' eg, en-US
    // eng-US, jap-US, eng-JP, jap-JP
    const langs = opts.i18nPriority
    for (const lang of langs) {
      await graphdfswrite(opts, lang, graph, '/:' + lang)
    }

    const manifest = pgManifest(opts, graph)
    await pgFsWriteObj(
      opts, pgUrlManifestCreate(opts), manifest)
    pgLog(opts, JSON.stringify(manifest, null, '  '))
  }
}

export default Object.assign(pgReql, pg)
