import url from 'node:url'
import path from 'node:path'

import {
  pgEnumREFTYPELOCAL
} from './pgEnum.js'

const keylanglocalere = /\/:\w\w\w?-\w\w$/

// key:eng-US => /path/key/eng-US.json
const pgKeyPathRelCreate = (opts, key) => {
  const match = key.match(keylanglocalere)
  const langlocalesuffix = match[0]

  key = key.slice(1, -langlocalesuffix.length).replace(/\//g, '-')
  key = key ? 'root-' + key : 'root'
  key = key + '/' + `${langlocalesuffix.slice(2)}.json`

  return key
}

const pgKeyUrlCreate = (opts, key) => {
  const outUrl = new url.URL(opts.outputDir, opts.metaurl)
  const keyUrl = new url.URL(pgKeyPathRelCreate(opts, key), outUrl)

  return keyUrl
}

const pgKeyRefChildCreate = (opts, keyparent, keychild) => {
  const urlParent = pgKeyUrlCreate(opts, keyparent)
  const urlParentDir = new url.URL(`.`, urlParent)
  const urlChild = pgKeyUrlCreate(opts, keychild)

  const pathtodirrelative = path.relative(
    urlParentDir.pathname, urlChild.pathname)

  return {
    type: pgEnumREFTYPELOCAL,
    path: pathtodirrelative
  }
}

// ('/:eng-US', '/:eng-US') => '/:eng-US'
// ('/:eng-US', 'label/:eng-US') => '/label/:eng-US'
// ('/label/:eng-US', 'checkbox/:eng-US') => '/label/checkbox/:eng-US'
const pgKeyChildLangLocaleCreate = (parentid, childname) => {
  const res = parentid.replace(keylanglocalere, '')
    + (childname.startsWith('/') ? '' : '/') + childname

  return res
}

const pgKeyLangRemove = key => (
  key.replace(keylanglocalere, ''))

const pgKeyRouteEncode = key => {
  return key
    .replace(/^\/pg-/, '/')
    .replace(/\/index/, '')
    .replace(/:\w\w\w-\w\w$/, '')
}

export {
  pgKeyRouteEncode,
  pgKeyUrlCreate,
  pgKeyRefChildCreate,
  pgKeyPathRelCreate,
  pgKeyChildLangLocaleCreate,
  pgKeyLangRemove
}
