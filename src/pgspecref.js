import path from 'node:path'
import url from 'node:url'

import {
  pgenumREFTYPELOCAL
} from './pgenum.js'

// ex,
// {
//   type: 'local-ref',
//   path: '../dataerrors/'
// }
const pgspecrefrelativecreate = (urlto, urlfrom) => {
  const urltodir = new url.URL(`.`, urlto)
  const pathtodirrelative = path.relative(
    urlfrom.pathname, urltodir.pathname) + '/'

  return {
    type: pgenumREFTYPELOCAL,
    path: pathtodirrelative
  }
}

const pgspecroutepathnodecreate = (urlto, urlfrom) => {
  return {
    ispathnode: true
  }
}

export {
  pgspecrefrelativecreate,
  pgspecroutepathnodecreate
}
