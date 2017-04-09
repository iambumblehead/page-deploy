// Filename: deploy_iso.js  
// Timestamp: 2017.04.09-01:34:55 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

const path = require('path');

const deploy_iso = module.exports = (o => {

  o.type = {
    Lang       : 'Lang',
    Locale     : 'Locale',
    LangLocale : 'LangLocale'
  };

  // determine if filename string is 'base'.
  // files must be hyphen-prefixed with one meta-data item, for example,
  //  `spec` in spec-baseLang.json
  //
  // 'lang-baseLocale.md', true
  // 'spec-baseLocale.md', true
  // 'spec-baseLang.json', true
  // 'base.md',       false
  // 'somenotes.txt', false
  o.getBaseType = (filename) => {
    let baseLangLocaleRe = /^(spec|lang)-baseLangLocale/,
        baseLocaleRe     = /^(spec|lang)-baseLocale/,    
        baseLangRe       = /^(spec|lang)-baseLang/,
        basename = typeof filename === 'string'
          && path.basename(filename),
        basetype;

    if (!basename) {
      basetype = null;
    } else if (baseLangLocaleRe.test(basename)) {
      basetype = o.type.LangLocale;
    } else if (baseLocaleRe.test(basename)) {
      basetype = o.type.Locale;
    } else if (baseLangRe.test(basename)) {        
      basetype = o.type.Lang;
    }

    return basetype;
  };

  // return `lang` for `lang-baseLang.json`
  // lang and locale files *must* be prefixed
  o.getPrefix = (filename) => {
    var prefix,
        prefixre = /(spec|lang)-base(?:LangLocale|Lang|Locale)/,
        prefixmatch = filename.match(prefixre);

    if (!prefixmatch) throw new Error('[!!!] file must be prefixed `-spec` or `-lang`: ' + filename);
    
    return prefixmatch[1];
  };

  o.getRmPrefix = (filename) => {
    var prefixre = /(spec-|lang-)/;
    
    return filename.replace(prefixre, '');
  };

  o.isBaseFilename = (filename) =>
    Boolean(o.getBaseType(filename));

  // return all combinations of filename
  // for the given ISOType.
  o.getRequiredFilenameArr = (ISOType, langArr, localeArr) => {
    var ISOTypes = o.type, 
        filenameArr = [];

    if (ISOType === ISOTypes.Lang) {
      filenameArr = langArr;
    } else if (ISOType === ISOTypes.Locale) {
      filenameArr = localeArr;
    } else if (ISOType === ISOTypes.LangLocale) {
      langArr.map(lang => (
        localeArr.map(locale => (
          filenameArr.push(lang + '_' + locale)))));
    }
    
    return filenameArr;
  };

  return o;

})({});
