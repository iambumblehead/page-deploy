import url from 'node:url'
import path from 'node:path'

import {
  pgenumREFTYPELOCAL
} from './pgenum.js'

const keylanglocalere = /\/:\w\w\w?-\w\w$/

// key:eng-US => /path/key/eng-US.json
const key_pathrelcreate = (opts, key) => {
  const match = key.match(keylanglocalere)
  const langlocalesuffix = match[0]

  key = key.slice(1, -langlocalesuffix.length).replace(/\//g, '-')
  key = key ? 'root-' + key : 'root'
  key = key + '/' + `${langlocalesuffix.slice(2)}.json`

  return key
}

const key_urlcreate = (opts, key) => {
  const outUrl = new url.URL(opts.outputDir, opts.metaurl)
  const keyUrl = new url.URL(key_pathrelcreate(opts, key), outUrl)

  return keyUrl
}

const key_refchildcreate = (opts, keyparent, keychild) => {
  const urlParent = key_urlcreate(opts, keyparent)
  const urlParentDir = new url.URL(`.`, urlParent)
  const urlChild = key_urlcreate(opts, keychild)

  const pathtodirrelative = path.relative(
    urlParentDir.pathname, urlChild.pathname)

  return {
    type: pgenumREFTYPELOCAL,
    path: pathtodirrelative
  }
}

// ('/:eng-US', '/:eng-US') => '/:eng-US'
// ('/:eng-US', 'label/:eng-US') => '/label/:eng-US'
// ('/label/:eng-US', 'checkbox/:eng-US') => '/label/checkbox/:eng-US'
const key_childlanglocalecreate = (parentid, childname) => {
  const res = parentid.replace(keylanglocalere, '')
    + (childname.startsWith('/') ? '' : '/') + childname

  return res
}

const key_routeencode = key => {
  return key
    .replace(/^\/pg-/, '/')
    .replace(/\/index/, '')
    .replace(/:\w\w\w-\w\w$/, '')
}

export {
  key_routeencode,
  key_urlcreate,
  key_refchildcreate,
  key_pathrelcreate,
  key_childlanglocalecreate
}
