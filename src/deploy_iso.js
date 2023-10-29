// Filename: deploy_iso.js  
// Timestamp: 2017.08.13-14:17:53 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

import path from 'path'

const type = {
  Lang: 'Lang',
  Locale: 'Locale',
  LangLocale: 'LangLocale'
}

const ISOTypeLang = 'Lang'
const ISOTypeLocale = 'Locale'
const ISOTypeLangLocale = 'LangLocale'

const supportedfileextensions = [ 'json', 'md' ]

const isPatternISORe = /^\w\w\w?[-_]?\w?\w?\w?_?\w?\w?\w?/
const isPatternNameRe = /^base(LangLocale|Lang|Locale)/

const isPatternPrefixRe = /^(spec|lang)-/
const isPatternBaseISORe = /^(spec|lang)-\w\w\w?[-_]?\w?\w?\w?_?\w?\w?\w?/
const isPatternBaseNameRe = /^(spec|lang)-base(LangLocale|Lang|Locale)/
const isPatternBaseLangLocaleRe = /^(spec|lang)-baseLangLocale/
const isPatternBaseLocaleRe = /^(spec|lang)-baseLocale/
const isPatternBaseLangRe = /^(spec|lang)-baseLang/
const isPatternExtnRe = /\.(json|md)/

// determine if filename string is 'base'.
// files must be hyphen-prefixed with one meta-data item, for example,
//  `spec` in spec-baseLang.json
//
// 'lang-baseLocale.md', true
// 'spec-baseLocale.md', true
// 'spec-baseLang.json', true
// 'base.md',       false
// 'somenotes.txt', false
const getBaseType = (filename, basetype = null) => {
  const basename = path.basename(String(filename))

  if (!basename) {
    basetype = null
  } else if (isPatternBaseLangLocaleRe.test(basename)) {
    basetype = type.LangLocale
  } else if (isPatternBaseLocaleRe.test(basename)) {
    basetype = type.Locale
  } else if (isPatternBaseLangRe.test(basename)) {
    basetype = type.Lang
  }

  return basetype
}

// return `lang` for `lang-baseLang.json`
// lang and locale files *must* be prefixed
const getPrefix = filename => {
  const prefixmatch = isPatternBaseNameRe.test(filename)

  if (!prefixmatch) {
    throw new Error(
      `[!!!] file must be prefixed '-spec' or '-lang': ${filename}`)
  }
  
  return prefixmatch[1]
}

const getRmPrefix = filename => (
  filename.replace(/(spec-|lang-)/, ''))

const isBaseFilename = filename => (
  Boolean(getBaseType(filename)))

// return all combinations of filename
// for the given ISOType.
// o.getRequiredFilenameArr = (ISOType, langArr, localeArr) => {
const getisofilenamearr = (ISOType, langArr, localeArr, defaultarr = []) => {
  if (ISOType === ISOTypeLang) {
    defaultarr = langArr
  } else if (ISOType === ISOTypeLocale) {
    defaultarr = localeArr
  } else if (ISOType === ISOTypeLangLocale) {
    defaultarr = langArr
      .map(lang => localeArr.map(locale => lang + '_' + locale)).flat()
  }
  
  return defaultarr
}

export default {
  type,
  ISOTypeLang,
  ISOTypeLocale,
  ISOTypeLangLocale,
  supportedfileextensions,
  isPatternISORe,
  isPatternNameRe,
  isPatternPrefixRe,
  isPatternBaseISORe,
  isPatternBaseNameRe,
  isPatternBaseLangLocaleRe,
  isPatternBaseLocaleRe,
  isPatternBaseLangRe,
  isPatternExtnRe,
  getBaseType,
  getPrefix,
  getRmPrefix,
  isBaseFilename,
  getisofilenamearr
}
