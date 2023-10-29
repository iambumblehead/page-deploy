// Filename: deploy_msg.js  
// Timestamp: 2017.09.03-12:55:49 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

import deploy_paths from './deploy_paths.js'

const start = () => console.log('[...] page-deploy: begin.')

const finish = () => console.log('[...] page-deploy: done.')

const getbytesasmb = byteLength => byteLength / Math.pow(1024,2)

const rounded = num => (Math.round(num * 100)/100).toFixed(2)

const getbytesasmbrounded = byteLength => rounded(getbytesasmb(byteLength))

const getbyteslabel = byteLength => `~${(getbytesasmbrounded(byteLength))}mb`

const throwerr = err => { throw new Error(err) }

const err_invalidpatternfilename = filename => throwerr(
  `[!!!] page-deploy: path is invalid: ${filename}
 * must not be hidden '.' file,
 * must end in .md or .json,
 * must have spec or lang prefix,
 * must have base qualifier and suffix

ex, spec-baseLang.md, lang-baseLangLocale.json, spec-spa-ES_ES.json
`)

const throw_similarfilenotfound = filename => throwerr(
  `[!!!] page-deploy: similar file not found, ${filename}`)

const throw_imgnotfound = filename => throwerr(
  `[!!!] page-deploy: image not found, ${filename}`)

const throw_parseerror = (filename, e) => throwerr(
  `[!!!] page-deploy: parser error, ${filename} ${e}`)

const throw_parsefiletypeerror = (opts, filename) => throwerr(
  `[!!!] page-deploy: parser error file type not supported, ${filename}`)

const throw_localrefnotfound = (opts, filename, refpath, refopts) => throwerr(
  `[!!!] page-deploy: local-ref not found, \n${[
    deploy_paths.narrowcwdhome(filename),
    deploy_paths.narrowcwdhome(refpath)
  ].join('\n')}\n${refopts && JSON.stringify(refopts, null, '  ')}`)

const scaledimage = (opts, filename, oldbytelen, newbytelen) => console.log(
  '[mmm] wrote: :filename :oldsize -> :newsize'
    .replace(/:filename/, deploy_paths.narrowdir(opts, filename))
    .replace(/:oldsize/, getbyteslabel(oldbytelen))
    .replace(/:newsize/, getbyteslabel(newbytelen)))

const convertedfilename = (opts, filename) => (
  console.log(
    '[mmm] wrote: :filepath'
      .replace(/:filepath/, deploy_paths.narrowdir(opts, filename))))

const isnotpublishedfilename = (opts, filename) => (
  console.log(
    '[...] unpublished: :filename'
      .replace(/:filename/g, filename)))

const applyuniverse = (opts, filename) => (
  console.log(
    '[...] universe: :filename'
      .replace(/:filename/g, deploy_paths.narrowdir(opts, filename))))

export default {
  start,
  finish,
  getbytesasmb,
  rounded,
  getbytesasmbrounded,
  getbyteslabel,
  throw: throwerr,
  err_invalidpatternfilename,
  throw_similarfilenotfound,
  throw_imgnotfound,
  throw_parseerror,
  throw_parsefiletypeerror,
  throw_localrefnotfound,
  scaledimage,
  convertedfilename,
  isnotpublishedfilename,
  applyuniverse
}
