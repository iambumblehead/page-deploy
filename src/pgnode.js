import fs from 'node:fs/promises'
import url from 'node:url'
import path from 'path'

import {
  // pgfs_write
  pgfs_writeobj
} from './pgfs.js'

const pgnode_nameisdata = name => {
  return [
    'data',
    'gnpgdata'
  ].some(n => name.startsWith(n))
}

/*
const pgnode = (pg, pgname, pgargs, pgchilds) => {  
  return {
    nodechilds: pgchilds,
    nodespec: {
      name: pgname,
      node: pg,
      // child: pgchilds || [],
      ...pgargs
    }
  }
}
*/
// to get the 'dirname' from the url, do this
// ```
// new url.URL('.', nodePathFull)
// ```
const pgnode_specpathget = (opts, node) => {
  const outputDirFull = new url.URL(
    `${opts.outputDir.replace(/\/$/, '')}/view/`, opts.metaurl);
  const nodeDirFull = new url.URL(`${node.nodespec.name}/`, outputDirFull)
  const nodePathFull = new url.URL('spec-baseLocale.json', nodeDirFull)
/*
  console.log({
    // 'node stuff': node
    'node stuff': nodePathFull
    })
*/    
  // new url.URL('.', nodePathFull)
  return nodePathFull
}

const pgnode_writedeep = async (opts, node, fullpath) => {
  // console.log('NODE', node)
  // const nodespec = { ...node.nodespec }
  const nodespec = node.nodespec
//  const outputDirFull = new url.URL(
//    `${opts.outputDir.replace(/\/$/, '')}/view/`, opts.metaurl);

//  console.log({ outputDirFull })
//  throw new Error('==')
  // const nodeDirFull = new url.URL(nodespec.name, outputDirFull);
  // const nodeDirFull = new url.URL(
  //   nodespec.name, new url.URL('view', outputDirFull));
  // const nodeDirFull = new url.URL('view/', outputDirFull)
  // console.log({ nodeDirFull: new url.URL(nodespec.name, nodeDirFull) })
  // throw new Error('===')
//   const nodePathFull = new url.URL('spec-baseLocale.json', outputDirFull)

  await pgfs_writeobj(fullpath, nodespec)
  // await fs.mkdir(outputDirFull, { recursive: true }).catch(e => e)
  
  
//  console.log('nodename', node.name)
//  console.log('write deep', node, { nodePathFull })
  
}

const pgnode_specrefcreate = () => {
  
}

/*
const pgnode_helpercreate = pgname => {
  const argsget = args => {
    if (typeof args[0] === 'string')
    const pgname = typeof args[0] === 'string' ? args[0] : null
    // const 
    // const pgspec = pgname === 
    // typeof args[0] === 'string'
    //  ? args
    //  : [ null, args[0], args[1] ]
  }
  
  return (...args) => {
    const [name, opts, childs] = argsget(args)

    return pgnode(pgname, name, opts, childs)
  }
}
*/

// const pgnode_pathnode = 'PATHNODE'

export {
  // pgnode,
  // pgnode_pathnode,
  pgnode_writedeep,
  pgnode_nameisdata,
  pgnode_specpathget,
  pgnode_specrefcreate
  // pgnode_helpercreate
}
