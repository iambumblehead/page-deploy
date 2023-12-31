import fs from 'node:fs/promises'
import url from 'node:url'
import path from 'path'

import {
  // pgfs_write
  pgfs_writeobj
} from './pgfs.js'

// to get the 'dirname' from the url, do this
// ```
// new url.URL('.', nodePathFull)
// ```
const pgnode_specpathget = (opts, node, parentpath) => {
  const parentDirUrl = new url.URL('.', parentpath)
  const parentDirName = path.basename(parentDirUrl.pathname)
  const nodename = node.nodespec.name
  const nodeDirName = (
    parentDirName === 'root'
      ? nodename + '/'
      : parentDirName + '-' + nodename + '/')
  const outputDirUrl = new url.URL('..', parentpath)
  const nodeDirUrl = new url.URL(nodeDirName, outputDirUrl)
  const nodePathUrl = new url.URL('spec-baseLocale.json', nodeDirUrl)

  return nodePathUrl
}

const pgnode_writedeep = async (opts, node, fullpath) => {
  const nodespec = node.nodespec

  await pgfs_writeobj(opts, fullpath, nodespec)
}

const pgnode_specrefcreate = () => {
  
}

export {
  pgnode_writedeep,
  pgnode_specpathget,
  pgnode_specrefcreate
}
