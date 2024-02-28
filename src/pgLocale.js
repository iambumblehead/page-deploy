import clak from 'clak'

import {
  pgEnumLOCALETYPEUNIVERSALREGION,
  pgEnumLOCALETYPEUNIVERSALLANG,
  pgEnumLOCALETYPEUNIVERSALID
} from './pgEnum.js'

// returns the lang from the 'start' locale
// ex,
//   localeStart: ['eng-US'] -> 'eng'
//   localeStart: ['jap-JP'] -> 'jap'
const pgLocaleOptsLocaleLangStart = opts => (
  pgLocaleIdParse(opts.i18nDoc.localeStart[0])[0])

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

// ex,
//  'eng-US' -> 'eng-US'
//  'eng' -> 'eng-ZZ'
//  'US' -> 'zzz-US'
//  '' -> 'zzz-ZZ'
const pgLocaleIdResolve = localeId => {
  const charCodeHyphen = 45

  return !localeId || (localeId.charCodeAt(3) === charCodeHyphen)
    ? localeId || pgEnumLOCALETYPEUNIVERSALID
    : localeId.length === 3
      ? localeId + '-' + pgEnumLOCALETYPEUNIVERSALREGION
      : pgEnumLOCALETYPEUNIVERSALLANG + '-' + localeId
}

// returns a lookup mapping from nested lists,
//
// [[['eng', 'US'], 'eng-US', 'eng-GB'],[['jap', 'JP'], 'jap-US']]]
//
// {
//   eng: ['eng-US', 'eng-GB'],
//   US: ['eng-US', 'eng-GB'],
//   jap: ['jap-JP'],
//   JP: ['jap-JP']
// }
const pgLocaleTreeMapCreate = localeTreePriorityLists => (
  localeTreePriorityLists.reduce((acc, treeLocaleT) => (
    treeLocaleT[0].reduce((accd, treeL) => (
      accd[treeL] = treeLocaleT.slice(1),
      accd
    ), acc),
    acc), {}))

const pgLocaleDocResolveJSON = (opt, i18n, key, valdef, localeId) => {
  return localeId
}

const pgLocaleDocResolveCSV = (opt, i18n, key, valdef, localeId) => {
  // memoize csv to a function returning lang store and tuples
  opt.c = opt.c || clak(i18n.csv) // csv source

  // lang store defines lang priority and col position each lang
  // ex, [['eng-US','jap-JP'], {'eng-US': 2, 'jap-JP': 3}]
  // opt.clangs = opt.clangs || opt.c(opt.i18nPriority)
  opt.clangs = opt.clangs || opt.c(i18n.localeStart)

  const localePriorityMap = i18n.localeTreePriorityMap[localeId]
    || [localeId]

  valdef = typeof valdef === 'string' ? valdef : key
  const access_denied = opt.c(key, valdef)

  return clak(access_denied, opt.clangs, localePriorityMap) // 'あなたが入れない駄目です'
}

// convert this to return i18n values from opt only... create a namespace
const pgLocaleDocResolve = (opt, i18nDoc, key, valdef, localeId = 'eng-US') => {
  if (i18nDoc.csv)
    return pgLocaleDocResolveCSV(opt, i18nDoc, key, valdef, localeId)
  if (i18nDoc.json)
    return pgLocaleDocResolveJSON(opt, i18nDoc, key, valdef, localeId)

  return null
}

// User may explicitly specify Locales, Regions or Langs on design nodes
//
// If not specified, use the language from the start Locale. If start
// locale is 'eng-US', use 'eng' as the start loop
//
// dnode,
//   => [['eng-US', dnode]]
// [['eng-US', dnode], ['jap-JP', dnode]]
//   => [['eng-US', dnode], ['jap-JP', dnode]]
// const pgNodeDesignLangGrouped = (opts, dnode) => (
const pgLocaleGroupsNodeDesign = (opts, dnode) => (
  Array.isArray(dnode)
    ? dnode
    : [[ pgLocaleOptsLocaleLangStart(opts), dnode ]])

// User may explicitly specify childs combinations for language and region
//
// if grouped nodechildlangs defined
//   return those
// else if single nodechilds
//   compose default nodechildlangs from tho
const pgLocaleGroupsNodeDesignChilds = (opts, nodespec) => (
  nodespec.nodechildlangs || (
    nodespec.nodechilds
      ? [[ pgLocaleOptsLocaleLangStart(opts), nodespec.nodechilds ]]
      : []))

// '/:eng-US' -> ':eng-US' [':eng-US', 'eng-US']
// '/label/:eng-US' -> ':eng-US' [':eng-US', 'eng-US']
// '/label/checkbox/:eng-US' -> ':eng-US' [':eng-US', 'eng-US']
const pgLocaleKeyMatchRe = /(?!\/):(\w\w\w?$|\w\w\w?-\w\w)$/

const pgLocaleKeyCreate = (key, localeId) => (
  key + ':' + localeId)

export {
  pgLocaleIdParse,
  pgLocaleIdResolve,
  pgLocaleDocResolve,
  pgLocaleOptsLocaleLangStart,
  pgLocaleGroupsNodeDesign,
  pgLocaleGroupsNodeDesignChilds,
  pgLocaleTreeMapCreate,
  pgLocaleKeyMatchRe,
  pgLocaleKeyCreate
}
