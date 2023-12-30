import fs from 'node:fs/promises'
import path from 'node:path'

const pgfs_direxists = async dir => (
  dir = await fs.stat(dir).catch(e => null),
  dir && dir.isDirectory())

const pgfs_dirmkdir = async dir => (
  fs.mkdir(dir, { recursive: true }))

const pgfs_write = async (fsurl, content) => {
  const fsurldir = path.dirname(fsurl.pathname) + '/'
  if (!await pgfs_direxists(fsurldir))
    await pgfs_dirmkdir(fsurldir)

  return fs.writeFile(fsurl, content)
}

const pgfs_writeobj = async (fsurl, spec) => (
  pgfs_write(fsurl, JSON.stringify(spec, null, '  ')))

const pgfs_dirrmdir = async dir => (
  await pgfs_direxists(dir) && 
    fs.rmdir(dir, { recursive: true }))

export {
  pgfs_write,
  pgfs_writeobj,
  pgfs_dirrmdir
}
