import fs from 'node:fs/promises'
import path from 'node:path'

import {
  pglog_writeurl
} from './pglog.js'

const pgfs_direxists = async dir => (
  dir = await fs.stat(dir).catch(e => null),
  dir && dir.isDirectory())

const pgfs_fileexists = async dir => (
  dir = await fs.stat(dir).catch(e => null),
  dir && dir.isFile())

const pgfs_dirmkdir = async dir => (
  fs.mkdir(dir, { recursive: true }))

const pgfs_write = async (fsurl, content) => {
  const fsurldir = path.dirname(fsurl.pathname) + '/'
  if (!await pgfs_direxists(fsurldir))
    await pgfs_dirmkdir(fsurldir)

  return fs.writeFile(fsurl, content)
}

const pgfs_read = async fsurl => (
  fs.readFile(fsurl, 'utf8'))

const pgfs_writeobj = async (opts, fsurl, spec) => (
  // console.log({ opts, fsurl }),
  pglog_writeurl(opts, fsurl),
  pgfs_write(fsurl, JSON.stringify(spec, null, '  ')))

const pgfs_dirrmdir = async dir => (
  await pgfs_direxists(dir) && 
    fs.rm(dir, { recursive: true }))

export {
  pgfs_read,
  pgfs_write,
  pgfs_writeobj,
  pgfs_dirrmdir,
  pgfs_direxists,
  pgfs_fileexists
}
