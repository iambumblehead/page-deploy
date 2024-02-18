import clak from 'clak'

import {
  pgEnumLOCALETYPEUNIVERSALREGION,
  pgEnumLOCALETYPEUNIVERSALLANG
} from './pgEnum.js'

// ex,
//  'eng-US' -> ['eng', 'US']
//  'eng' -> ['eng', 'ZZ']
//  'US' -> ['zzz', 'US']
//  '' -> ['zzz', 'ZZ']
const pgLocaleIdParse = localeId => {
  const charCodeHyphen = 45

  return localeId.charCodeAt(3) === charCodeHyphen
    ? [localeId.slice(0, 3), localeId.slice(4)]
    : localeId.length === 3
      ? [localeId, pgEnumLOCALETYPEUNIVERSALREGION]
      : [pgEnumLOCALETYPEUNIVERSALLANG, localeId]
}

const pgLocaleResolveJSON = (opt, i18n, key, valdef, localeId = 'eng-US') => {
  return localeId
}

const pgLocaleResolveCSV = (opt, i18n, key, valdef, localeId = 'eng-US') => {
  // memoize csv to a function returning lang store and tuples
  opt.c = opt.c || clak(i18n.csv) // csv source
    
  // lang store defines lang priority and col position each lang
  // ex, [['eng-US','jap-JP'], {'eng-US': 2, 'jap-JP': 3}]
  opt.clangs = opt.clangs || opt.c(opt.i18nPriority)

  valdef = typeof valdef === 'string' ? valdef : key
  const access_denied = opt.c(key, valdef)

  // from each tuple to return the final language-specific value needed.
  return clak(access_denied, opt.clangs, [localeId]) // 'あなたが入れない駄目です'
}

// convert this to return i18n values from opt only... create a namespace
const pgLocaleResolve = (opt, i18nDoc, key, valdef, localeId = 'eng-US') => {
  if (i18nDoc.csv)
    return pgLocaleResolveCSV(opt, i18nDoc, key, valdef, localeId)
  if (i18nDoc.json)
    return pgLocaleResolveJSON(opt, i18nDoc, key, valdef, localeId)

  return null
}

export {
  pgLocaleIdParse,
  pgLocaleResolve
}
