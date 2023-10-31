// Filename: deploy_opts.js  
// Timestamp: 2017.09.02-22:17:28 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

import castas from 'castas'
import path from 'path'

const defaultopts = {
  inputDir: './convert/',
  outputDir: './converted/',
  publicPath: 'domain.com/converted',
  supportDir: '',

  supportedLangArr: false,
  supportedLocaleArr: false,

  // a cache of objects constructed here. often referenced 
  // many times, but constructed once only using cache    
  patterncache: {},
  articlescache: {}
}

const getasboolorarr = opt => /true|false/i.test(opt)
  ? castas.bool(opt)
  : castas.arr(opt)

export default spec => {
  const opt = Object.create(defaultopts)
  const stackpathre = /^.*(\(|at )(.*):[\d]*:[\d]*.*$/
  const metaurl = opt.metaurl || (path.dirname(
    (new Error).stack.split('\n')[3].replace(stackpathre, '$2')) + '/')  

  opt.metaurl = metaurl
  opt.inputDir = castas.str(spec.inputDir, './')
  opt.publicPath = castas.str(spec.publicPath, './spec')
  opt.outputDir = castas.str(spec.outputDir, './build/spec')
  opt.supportDir = castas.str(spec.supportDir, '')
  opt.datetitlesubdirs = castas.arr(spec.datetitlesubdirs, [])
  opt.supportedLocaleArr = getasboolorarr(spec.supportedLocaleArr)
  opt.supportedLangArr = getasboolorarr(spec.supportedLangArr)

  return opt
}
