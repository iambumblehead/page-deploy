// Filename: deploy_iso.js  
// Timestamp: 2017.08.13-14:17:53 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

const path = require('path');

module.exports = (o => {

  o.type = {
    Lang : 'Lang',
    Locale : 'Locale',
    LangLocale : 'LangLocale'
  };

  o.ISOTypeLang = 'Lang',
  o.ISOTypeLocale = 'Locale',
  o.ISOTypeLangLocale = 'LangLocale';

  o.supportedfileextensions = [ 'json', 'md' ];

  o.isPatternISORe = /^\w\w\w?[-_]?\w?\w?\w?_?\w?\w?\w?/;
  o.isPatternNameRe = /^base(LangLocale|Lang|Locale)/;

  o.isPatternPrefixRe         = /^(spec|lang)-/;
  o.isPatternBaseISORe        = /^(spec|lang)-\w\w\w?[-_]?\w?\w?\w?_?\w?\w?\w?/;
  o.isPatternBaseNameRe       = /^(spec|lang)-base(LangLocale|Lang|Locale)/;
  o.isPatternBaseLangLocaleRe = /^(spec|lang)-baseLangLocale/;
  o.isPatternBaseLocaleRe     = /^(spec|lang)-baseLocale/;
  o.isPatternBaseLangRe       = /^(spec|lang)-baseLang/;
  o.isPatternExtnRe           = /\.(json|md)/;

  // determine if filename string is 'base'.
  // files must be hyphen-prefixed with one meta-data item, for example,
  //  `spec` in spec-baseLang.json
  //
  // 'lang-baseLocale.md', true
  // 'spec-baseLocale.md', true
  // 'spec-baseLang.json', true
  // 'base.md',       false
  // 'somenotes.txt', false
  o.getBaseType = (filename, basetype = null) => {
    const basename = path.basename(String(filename));

    if (!basename) {
      basetype = null;
    } else if (o.isPatternBaseLangLocaleRe.test(basename)) {
      basetype = o.type.LangLocale;
    } else if (o.isPatternBaseLocaleRe.test(basename)) {
      basetype = o.type.Locale;
    } else if (o.isPatternBaseLangRe.test(basename)) {
      basetype = o.type.Lang;
    }

    return basetype;
  };

  // return `lang` for `lang-baseLang.json`
  // lang and locale files *must* be prefixed
  o.getPrefix = filename => {
    const prefixmatch = o.isPatternBaseNameRe.test(filename);

    if (!prefixmatch) {
      throw new Error(
        `[!!!] file must be prefixed '-spec' or '-lang': ${filename}`);
    }
    
    return prefixmatch[1];
  };

  o.getRmPrefix = filename =>
    filename.replace(/(spec-|lang-)/, '');

  o.isBaseFilename = filename =>
    Boolean(o.getBaseType(filename));

  // return all combinations of filename
  // for the given ISOType.
  // o.getRequiredFilenameArr = (ISOType, langArr, localeArr) => {
  o.getisofilenamearr = (ISOType, langArr, localeArr, defaultarr = []) => {
    if (ISOType === o.ISOTypeLang) {
      defaultarr = langArr;
    } else if (ISOType === o.ISOTypeLocale) {
      defaultarr = localeArr;
    } else if (ISOType === o.ISOTypeLangLocale) {
      defaultarr = langArr
        .map(lang => localeArr.map(locale => lang + '_' + locale)).flat();
    }
    
    return defaultarr;
  };

  return o;

})({});
