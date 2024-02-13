import fs from 'node:fs/promises'
import path from 'node:path'

import {
  pgLogWriteUrl
} from './pgLog.js'

const pgFsDirExists = async dir => (
  dir = await fs.stat(dir).catch(() => null),
  dir && dir.isDirectory())

const pgFsFileExists = async dir => (
  dir = await fs.stat(dir).catch(() => null),
  dir && dir.isFile())

const pgFsDirMkDir = async dir => (
  fs.mkdir(dir, { recursive: true }))

const pgFsDirMkDirP = async dir => (
  !await pgFsDirExists(dir)
    && pgFsDirMkDir(dir))

const pgFsWrite = async (fsurl, content) => {
  await pgFsDirMkDirP(path.dirname(fsurl.pathname) + '/')

  return fs.writeFile(fsurl, content)
}

const pgFsRead = async fsurl => (
  fs.readFile(fsurl, 'utf8'))

const pgFsWriteObj = async (opts, fsurl, spec) => (
  pgLogWriteUrl(opts, fsurl),
  pgFsWrite(fsurl, JSON.stringify(spec, null, '  ')))

const pgFsDirRmDir = async dir => (
  await pgFsDirExists(dir) &&
    fs.rm(dir, { recursive: true }))

export {
  pgFsRead,
  pgFsWrite,
  pgFsWriteObj,
  pgFsDirRmDir,
  pgFsDirExists,
  pgFsFileExists
}
