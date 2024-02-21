import url from 'node:url'
import path from 'node:path'

import {
  pgEnumREFTYPELOCAL
} from './pgEnum.js'

import {
  pgLocaleKeyMatchRe
} from './pgLocale.js'

// key:eng-US => /path/key/eng-US.json
const pgKeyPathRelCreate = (opts, key) => {
  const pathSepRe = /\//g
  const match = key.match(pgLocaleKeyMatchRe)
  const localeSuffix = match[1]

  // '/my/path/:eng'
  //
  // 1. -> 'my-path'
  // 2.    -> 'root-my-path'
  // 3.        -> 'root-my-path/eng.json'
  //
  key = key.slice(1, -(match[0].length + 1)).replace(pathSepRe, '-')
  key = key ? 'root-' + key : 'root'
  key = key + '/' + localeSuffix + '.json'

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
const pgKeyChildLangLocaleCreate = (key, childName) => (
  key.replace(pgLocaleKeyMatchRe, childName))

// (below example needs to be verified)
// '/path/to/doc/:eng-US' -> '/path/to/doc/'
const pgKeyLangRemove = key => (
  key.replace(pgLocaleKeyMatchRe, ''))

const pgKeyIsRoot = key => (
  key && pgKeyLangRemove(key) === '')
  
const pgKeyRouteEncode = key => {
  return key
    .replace(/^\/pg-/, '/')
    .replace(/\/index/, '')
    .replace(/:\w\w\w-\w\w$/, '')
}

export {
  pgKeyIsRoot,
  pgKeyRouteEncode,
  pgKeyUrlCreate,
  pgKeyRefChildCreate,
  pgKeyPathRelCreate,
  pgKeyChildLangLocaleCreate,
  pgKeyLangRemove
}
