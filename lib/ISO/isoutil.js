var path = require('path');

var IsoUtil = module.exports = (function() {

  return {
    type : {
      Lang : 'Lang',
      Locale : 'Locale',
      LangLocale : 'LangLocale'
    },

    // detarmine if filename string is 'base'.
    // 'baseLang.json', true
    // 'baseLocale.md', true
    // 'base.md',       false
    // 'somenotes.txt', false
    getBaseType : function (filename) {
      var type = this.type,
          baseFilename,
          baseType,

          baseLangRe = /^baseLang/,
          baseLocaleRe = /^baseLocale/,
          baseLangLocaleRe = /^baseLangLocale/;

      if (typeof filename === 'string') {
        baseFilename = path.basename(filename);

        if (baseFilename.match(baseLangLocaleRe)) {
          baseType = type.LangLocale;
        } else if (baseFilename.match(baseLocaleRe)) {
          baseType = type.Locale;
        } else if (baseFilename.match(baseLangRe)) {
          baseType = type.Lang;
        }
      }


      return baseType;
    },

    isBaseFilename : function (filename) {
      return this.getBaseType(filename) ? true : false;
    },

    // based on type, return all possible filename combinations
    // needed to support the given type, with given lang and locale supports.
    getFilenameArr : function (ISOType, opts) {
      var langArr = opts.supportedLangArr,
          localeArr = opts.supportedLocaleArr,
          ISOTypes = this.type,
          filenameArr = [];

      if (ISOType === ISOTypes.Lang) {
        filenameArr = langArr;
      } else if (ISOType === ISOTypes.Locale) {
        filenameArr = localeArr;
      } else if (ISOType === ISOTypes.LangLocale) {
        langArr.map(function (lang) {
          localeArr.map(function (locale) {
            filenameArr.push(lang + '_' + locale);
          });
        });
      }

      return filenameArr;
    }
  };

}());