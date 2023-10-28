// Filename: deploy_pattern.js  
// Timestamp: 2017.09.03-05:00:37 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>
//
//  specfilepath: /path/to/spec/name/spec-baseLangLocale.json
//   specdirpath: /path/to/spec/name/
// parentdirpath: /path/to/spec/

import path from 'path'
import objobjwalk from 'objobjwalk'
import simpletime from 'simpletime'
      
import deploy_iso from './deploy_iso.js'
import deploy_file from './deploy_file.js'
import deploy_paths from './deploy_paths.js'
import deploy_tokens from './deploy_tokens.js'

const { UNIVERSAL } = deploy_tokens

// input: 1222580700000, 'articletitle'
// return: '2008.09.27-articletitle'
const getdatetitlestamp = (date, title, datefmt = 'yyyy.MM.dd') => (
  ':date-:title'
    .replace(/:date/, simpletime.applyFormatDate(new Date(date), datefmt))
    .replace(/:title/, String(title).toLowerCase())
    .replace(/ /g, '-'))

const getdatetitlestampdir = (dirpath, content) => path.join(
  path.dirname(dirpath),
  getdatetitlestamp(content.timeDate, content.title))

const getdatetitlestampoutputpath = (filepath, content) => path.join(
  getdatetitlestampdir(path.dirname(filepath), content),
  path.basename(filepath))

//
// unversedirpath relatative to filepath
//
const getuniversaldirpath = filepath => path.join(
  path.dirname(filepath), UNIVERSAL)

//
// unversefilepath relatative to filepath
//
// should be elaborated to locate lang/local or default paths
//
const getuniversefilepath = filepath => {
  const extn = path.extname(filepath)
  const name = path.basename(filepath, extn)

  return path.join(
    getuniversaldirpath(path.dirname(filepath)), `${name}.json`)
}

const isdatetitlecontent = (opts, contentobj, filename) => (
  opts.datetitlesubdirs
    .some(subdir => filename.indexOf(subdir) !== -1 && contentobj.timeDate)
)

const getasoutputpath = (opts, filepath, content) => {
  const outputdirname = deploy_paths.dirout(opts, path.dirname(filepath))
  const outputdirnamestamped = isdatetitlecontent(opts, content, filepath)
    ? getdatetitlestampdir(outputdirname, content)
    : outputdirname
  const extname = path.extname(filepath)
  const basename = path.basename(filepath, extname)
    .replace(/^(spec-|lang-)/, '')

  return path.join(outputdirnamestamped, `${basename}.json`)
}

const writeAtFilename = (filename, content, opts, fn) => {
  const outputpath = getasoutputpath(opts, filename, content)
  const outputStr = deploy_file.stringify(content)

  deploy_file.writeRecursive(outputpath, outputStr, (err, res) => (
    fn(err, res, outputpath)))
}

// return the ISO filenames that should be generated.
const getisooutputfilenamearr = (opts, filename) => {
  const ISOType = deploy_iso.getBaseType(filename)
  const langArr = opts.supportedLangArr
  const localeArr = opts.supportedLocaleArr

  return deploy_iso.getisofilenamearr(ISOType, langArr, localeArr)
}

// input 'en-US.json', 'en-US', '.json'
// return true
const isfilenameisomatch = (filename, ISO, extn) => (
  filename.indexOf(ISO) !== -1 && path.extname(filename) === extn)


// return a matching ISO file from an array of filenames
// 
// << ['en-US.json', 'es-ES.json'], 'en-US', '.json'
// >> 'en-US.json'
// 
// << ['en-US.json', 'es-ES.json'], 'en-US', '.md'
// >>  null
const arrgetmatchingISOstr = (filenameArr, ISO, extn) => (
  filenameArr.find(filename => isfilenameisomatch(filename, ISO, extn)))

// should not be a hidden '.' file
// should end in md or json
// o.isvalidpatternfilename = filename => {
const patternisvalidinputfilename = filename => {
  const extn = path.extname(filename)
  const name = path.basename(filename, extn)

  return deploy_iso.isPatternExtnRe.test(extn) && (
    deploy_iso.isPatternBaseNameRe.test(name) ||
      deploy_iso.isPatternBaseISORe.test(name))
}

const patternisvalidoutputfilename = filename => {
  const extn = path.extname(filename)
  const name = path.basename(filename, extn)

  return deploy_iso.isPatternExtnRe.test(extn) && (
    deploy_iso.isPatternBaseNameRe.test(name) ||
      deploy_iso.isPatternISORe.test(name))
}

// return the value defined on the given namespace or null
//
// ex,
//
//   o.objlookup('hello.my', {hello:{my:'world'}})
//
// return,
//
//   'world'
//
const objlookup = (namespacestr, obj) => (
  String(namespacestr)
    .split('.').reduce(
      (a, b) => a ? (b in a ? a[b] : a[Number(b)]) : null, obj))

// unit test this
// returns other pattern file in the same directory
const getsimilarfilename = (filename, opts, fn) => {
  const ext = path.extname(filename)
  const dir = path.dirname(filename)
  const basename = path.basename(filename)
  const basenameRe = new RegExp(
    `${path.basename(filename, ext)}\\.(json|md)`)
  
  deploy_file.readdir(dir, (err, patharr) => {
    if (err) return fn(err)

    fn(null, patharr.filter(p => (
      p !== basename
        && basenameRe.test(p)
        && patternisvalidinputfilename(p))))
  })
}

const updatelangdefs = (contentObj, langObj, fn) => {
  const langkeyre = /^pd\.langkey\./
  const langobjre = /^pd\.langobj/

  fn(null, objobjwalk.type('string', contentObj, str => {
    if (langobjre.test(str)) {
      str = langObj
    } else if (langkeyre.test(str)) {
      str = o.objlookup(str.replace(langkeyre, ''), langObj) || str
    }

    return str
  }))
}

// takes a keys object and replaces `langkey` properties
// with corresponding value from keys obj
const updatelangkeys = (contentObj, langObj, fn) => (
  objobjwalk.async(contentObj, (objobj, exitFn) => {
    if (objobj.langkey) {
      exitFn(null, langObj[objobj.langkey])
    } else if (objobj.langobj) {
      exitFn(null, langObj)
    } else {
      exitFn(null, objobj)
    }
  }, fn))

export default {
  getdatetitlestamp,
  getdatetitlestampdir,
  getdatetitlestampoutputpath,
  getuniversaldirpath,
  getuniversefilepath,
  isdatetitlecontent,
  getasoutputpath,
  writeAtFilename,
  getisooutputfilenamearr,
  isfilenameisomatch,
  arrgetmatchingISOstr,
  patternisvalidinputfilename,
  patternisvalidoutputfilename,
  objlookup,
  getsimilarfilename,
  updatelangdefs,
  updatelangkeys
}
