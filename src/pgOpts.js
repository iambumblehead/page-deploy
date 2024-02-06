import castas from 'castas'
import clak from 'clak'
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
  // opt.datetitlesubdirs = castas.arr(useropts.datetitlesubdirs, [])

  opt.appname = useropts.appname
    || 'app.gani'
  opt.appdescription = useropts.appdescription
    || 'gani app description'
  opt.deploytype = useropts.deploytype || 'flat'
  opt.i18nSource = useropts.i18n
  opt.i18nType = 'csv'
  opt.i18nPriority = useropts.i18nPriority
    || (opt.i18nSource
        && opt.i18nSource.match(/(?<=")\w\w\w?-\w\w(?=")/g))
    || ['eng-US']

  opt.i18n = (key, valdefault, langLocaleId = 'eng-US') => {
    // memoize csv to a function returning lang store and tuples
    opt.c = opt.c || clak(opt.i18nSource)
    
    // lang store defines lang priority and col position each lang
    // ex, [['en-US','ja-JP'], {'en-US': 2, 'ja-JP': 3}]
    opt.clangs = opt.clangs || opt.c(opt.i18nPriority)

    valdefault = typeof valdefault === 'string' ? valdefault : key
    const access_denied = opt.c(key, valdefault)

    // from each tuple to return the final language-specific value needed.
    return clak(access_denied, opt.clangs, [langLocaleId]) // 'あなたが入れない駄目です'
  }
  // opt.i18n = [['eng-US', {}]]
  // opt.i18n =
  // pending removal
  opt.root = useropts.root
  
  return opt
}
