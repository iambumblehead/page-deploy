// Filename: deploy_opts.js  
// Timestamp: 2017.09.02-22:17:28 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

import castas from 'castas'

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
  const opts = Object.create(defaultopts)

  opts.inputDir = castas.str(spec.inputDir, './')
  opts.publicPath = castas.str(spec.publicPath, './spec')
  opts.outputDir = castas.str(spec.outputDir, './build/spec')
  opts.supportDir = castas.str(spec.supportDir, '')
  opts.datetitlesubdirs = castas.arr(spec.datetitlesubdirs, [])
  opts.supportedLocaleArr = getasboolorarr(spec.supportedLocaleArr)
  opts.supportedLangArr = getasboolorarr(spec.supportedLangArr)

  return opts
}
