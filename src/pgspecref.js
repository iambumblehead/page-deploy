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
  const urlfromdir = new url.URL(`.`, urlfrom)
  const pathtodirrelative = path.relative(
    urlfromdir.pathname, urltodir.pathname) + '/'

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
