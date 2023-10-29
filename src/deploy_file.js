// Filename: deploy_file.js  a
// Timestamp: 2017.09.03-13:23:35 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>
//
// useful for mocking with tests

import fs from 'fs'
import path from 'path'

const relpath = (filepath, refpath) => (
  path.join(path.dirname(filepath), refpath))
  
const exists = filepath => (
  fs.existsSync(filepath))

const isdir = filepath => (
  exists(filepath) && fs.statSync(filepath).isDirectory())

const isfile = filepath => (
  exists(filepath) && fs.statSync(filepath).isFile())

const readdir = (filepath, fn) => fs.readdir(filepath, fn)

const read = (filepath, fn) => fs.readFile(filepath, 'utf8', fn)

const stringify = obj => (
  /string|boolean|number/.test(typeof obj)
    ? obj
    : JSON.stringify(obj, null, '  '))

const write = (filename, content, fn) => (
  fs.writeFile(filename, stringify(content), fn))

const readobj = (filepath, fn, defaultobj) => {
  if (typeof defaultobj === 'object' && !isfile(filepath)) {
    return fn(null, defaultobj)
  }
    
  read(filepath, (err, file) => {
    if (err) return fn(err)
      
    if (!/json$/.test(filepath))
      return fn(null, file)

    try {
      file = JSON.parse(file)
    } catch (e) {
      err = e
    }
      
    fn(err, file)
  })
}

const writeassign = (filename, content, fn) => {
  readobj(filename, (err, obj) => {
    if (err) return fn(err)

    write(filename, Object.assign(obj, content), (err, res) => {
      if (err) return fn(err)

      fn(null, obj)
    })
  }, {})
}

// only creates the path if it does not exist
const createPath = (directory, fn) => (
  isdir(directory)
    ? fn(null, directory)
    : fs.mkdir(directory, {recursive: true}, fn))

const writeRecursive = (filename, content, fn) => (
  createPath(path.dirname(filename), (err, res) => {
    if (err) return fn(err)
      
    write(filename, content, fn)
  }))

export default {
  relpath,
  exists,
  isdir,
  isfile,
  readdir,
  read,
  stringify,
  write,
  readobj,
  writeassign,
  createPath,
  writeRecursive
}
