// Filename: deploy_paths.js  
// Timestamp: 2017.09.03-05:08:17 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  
//
//  specfilepath: /path/to/spec/name/spec-baseLangLocale.json
//   specdirpath: /path/to/spec/name/
// parentdirpath: /path/to/spec/
//

import path from 'path'
import pathpublic from 'pathpublic'

const supportSubDirName = '/support'

const removedir = (filepath, dir, sep = path.sep) => {
  dir =  dir.replace(/^\.\//, '')

  return filepath
    .replace(dir + (dir.substr(-1) === sep ? '' : sep), '')
}

const removeinputdir = (opts, filepath) => (
  removedir(filepath, opts.inputDir))

const removeoutputdir = (opts, filepath) => (
  removedir(filepath, opts.outputDir))

const narrowcwdhome = filepath => (
  String(filepath)
    .replace(process.cwd(), '.')
    .replace(process.env.HOME, '~'))

const narrowdir = (opts, filepath) => narrowcwdhome(
  removeoutputdir(opts, removeinputdir(opts, filepath)))

const pathsupportdir = filename => (
  path.join(path.dirname(filename), supportSubDirName))

// input
//   src/spec/page/blog/universal
//
// return
//   build/bumblehead-0.0.4/spec/page/blog/universal
//
const dirout = (opts, dirname) => {
  const inputDir = path.normalize(opts.inputDir)
  const outputDir = path.normalize(opts.outputDir)

  return path.join(outputDir, dirname.replace(inputDir, ''))
}

// filename filename build/bumblehead-0.3/spec/data/gallery/baseLocale.json
// return
// build/bumblehead-0.3/spec/build/bumblehead-0.3/spec/data/gallery/support
const outputsupportpath = (opts, filename) => {
  // const inputDir = path.normalize(opts.inputDir)
  const outputDir = path.normalize(opts.outputDir)
  const inputPath = pathsupportdir(filename)
  const inputPathRel = narrowdir(opts, inputPath)
  const outputPath = path.join(outputDir, inputPathRel)
    
  return outputPath
}

const publicsupportpath = (opts, filename) => (
  pathpublic.get(outputsupportpath(opts, filename), opts.publicPath))

// update the support paths to public support paths.
const withpublicpath = (opts, str, filename) => {
  const publicPath = publicsupportpath(opts, filename)
  const supportPathRe = (
    /(["']support\/[^'"]*['"]|^(?:\.\/)?support\/[^\b]*)/gi)

  return str.replace(supportPathRe, match => (
    match.replace(/support/, publicPath)))
}

const getspecdirpath = specfilepath => (
  path.dirname(specfilepath))

const getparentdirpath = specfilepath => (
  path.dirname(getspecdirpath(specfilepath)))
  
export default {
  supportSubDirName,
  removedir,
  removeinputdir,
  removeoutputdir,
  narrowcwdhome,
  narrowdir,
  pathsupportdir,
  dirout,
  outputsupportpath,
  publicsupportpath,
  withpublicpath,
  getspecdirpath,
  getparentdirpath
}
