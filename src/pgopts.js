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

export default useropts => {
  const opt = Object.create(defaultopts)
  const stackpathre = /^.*(\(|at )(.*):[\d]*:[\d]*.*$/
  const metaurl = opt.metaurl || (path.dirname(
    (new Error).stack.split('\n')[3].replace(stackpathre, '$2')) + '/')  

  opt.verbose = typeof useropts.verbose === 'number'
    ? useropts.verbose : 1
  opt.metaurl = metaurl
  opt.inputDir = castas.str(useropts.inputDir, './')
  opt.publicPath = castas.str(useropts.publicPath, './spec')
  opt.outputDir = castas.str(useropts.outputDir, './build/spec')
  opt.supportDir = castas.str(useropts.supportDir, '')
  opt.datetitlesubdirs = castas.arr(useropts.datetitlesubdirs, [])
  opt.supportedLocaleArr = getasboolorarr(useropts.supportedLocaleArr)
  opt.supportedLangArr = getasboolorarr(useropts.supportedLangArr)
  opt.root = useropts.root
  
  return opt
}
