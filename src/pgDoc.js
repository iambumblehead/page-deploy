import url from 'node:url'
import path from 'node:path'

import pgMd from './pgMd.js'

import {
  pgFsStat,
  pgFsDirRead,
  pgFsRead
} from './pgFs.js'

import {
  pgErrFileOrDirNotFound,
  pgErrDocIncompatibleFile
} from './pgErr.js'

import {
  pgLocaleIdParse
} from './pgLocale.js'

// wrap clumsy URL object with dir endSlash
const pgDocUrlAsDir = cUrl => (
  cUrl = cUrl.href,
  cUrl += cUrl.endsWith('/') ? '' : '/',
  new url.URL(cUrl))

const docParseFnMap = {
  '.md': pgMd,
  '.json': (url, str) => JSON.parse(str)
}

const isPgFilenameRe = /((?!\.)\w\w\w?-\w\w|(?!\.)\w\w\w?)?\.doc\.(md|json)$/

const pgDoc = async cUrl => {
  const href = cUrl.href
  const docParseFn = docParseFnMap[path.extname(href)]
  if (!docParseFn)
    throw new pgErrDocIncompatibleFile(cUrl)

  const doc = await docParseFn(cUrl, await pgFsRead(cUrl))
  const urlmatch = href.match(isPgFilenameRe)
  const localeId = (urlmatch || [])[1]
  const locale = pgLocaleIdParse(localeId)

  doc['meta:urlorigin'] = href
  doc['meta:region'] = locale[1]
  doc['meta:lang'] = locale[0]

  // wip
  doc.id = path.basename(href, path.extname(href))
    .slice(3, -4) // remove /(^pg\..|\.doc$)/
    .replace(localeId, locale.join('-'))

  // console.log('id', doc.id)
  // doc.id = (doc.id || doc.name || doc.title)
  //   + (localeId ? '.' + localeId : '')

  return doc
}

// url to a directory or file,
// recursively finds md and json files in directory
// loads them as documents
const pgDocsRecursiveNames = async (cUrl, names, maxdepth = 3, docs = []) => {
  if (!names.length)
    return docs

  const nameurl = new url.URL(names[0], cUrl.href)
  const dDocs = await pgDocsRecursive(nameurl, maxdepth)
  if (Array.isArray(dDocs)) {
    if (dDocs.length) {
      docs = docs.concat(dDocs)
    }
  } else if (dDocs) {
    docs.push(dDocs)
  }

  return pgDocsRecursiveNames(cUrl, names.slice(1), maxdepth, docs)
}

const pgDocsRecursive = async (cUrl, maxdepth = 1, docs = []) => {
  const stat = await pgFsStat(cUrl)
  
  if (!stat) {
    throw pgErrFileOrDirNotFound({}, cUrl)
  } else if (stat.isFile()) {
    if (isPgFilenameRe.test(cUrl)) {
      docs = await pgDoc(cUrl)
    }
  } else if (stat.isDirectory() && maxdepth--) {
    cUrl = pgDocUrlAsDir(cUrl)
    docs = await pgDocsRecursiveNames(
      cUrl, await pgFsDirRead(cUrl), maxdepth)
  }

  return docs
}

const pgDocsRefLoadAll = async (opts, docsRefList) => (
  await Promise.all(docsRefList.map(docsRef => (
    pgDocsRecursive(
      new url.URL(docsRef, opts.metaurl)))))).flat()

export {
  pgDoc,
  pgDocsRecursive as default,
  pgDocsRefLoadAll
}
