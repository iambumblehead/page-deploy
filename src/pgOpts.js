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

  opt.appname = useropts.appname
    || 'app.gani'
  opt.appdescription = useropts.appdescription
    || 'gani app description'
  opt.deploytype = useropts.deploytype || 'flat'
  opt.i18nPriority = useropts.i18nPriority
  
  return opt
}
