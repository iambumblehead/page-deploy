import fs from 'node:fs/promises'
import url from 'node:url'

import {
  pgfs_read,
  pgfs_direxists
} from './pgfs.js'

import {
  pgerrmddirnotfound,
  pgerrmdfilenotfound,
  pgerrmdfileordirnotfound
} from './pgerr.js'

import pgmd from './pgmd.js'

import simpletime from 'simpletime'

/*
console.log(
  'DATE changed',
  String(simpletime.extractDateFormatted(
    '2016.11.25-12:06:00',
    'yyyy.MM.dd-HH:mm:ss'
  ))
)
*/
const parsedatestr = (datestr, fmt='yyyy.MM.dd-HH:mm:ss') => (
  simpletime.extractDateFormatted(datestr, fmt))

const mdfile = async (opts, path) => {
  const mdfileurl = new url.URL(path, opts.metaurl)
  if (!pgerrmdfilenotfound(mdfileurl))
    throw pgerrmddirnotfound(path)

  const mdmeta = pgmd(mdfileurl, await pgfs_read(mdfileurl))

  //console.log('===========', mdmeta)

  return mdmeta
}

const mddir = async (opts, path) => {
  const mddirurl = new url.URL(path, opts.metaurl)
  if (!pgfs_direxists(mddirurl))
    throw pgerrmddirnotfound(path)
}

const md = async (opts, path) => {
  const mdurl = new url.URL(path, opts.metaurl)
  const stat = await fs.stat(mdurl).catch(e => null)
  if (stat && stat.isFile())
    return mdfile(opts, path)
  if (stat && stat.isDirectory())
    return mddir(opts, path)

  throw pgerrmdfileordirnotfound(path)
}

const pgscriptopts = opts => ({
  mdfile: async path => mdfile(opts, path),
  mddir: async path => mddir(opts, path),
  md: async path => md(opts, path)
})

export {
  pgscriptopts as default
}
