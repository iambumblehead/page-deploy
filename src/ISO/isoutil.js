var path = require('path');

var IsoUtil = module.exports = (function() {

  return {
    type : {
      Lang : 'Lang',
      Locale : 'Locale',
      LangLocale : 'LangLocale'
    },

    // determine if filename string is 'base'.
    // files must be hyphen-prefixed with one meta-data item, for example,
    //  `spec` in spec-baseLang.json
    //
    // 'lang-baseLocale.md', true
    // 'spec-baseLocale.md', true
    // 'spec-baseLang.json', true
    // 'base.md',       false
    // 'somenotes.txt', false
    getBaseType : function (filename) {
      var type = this.type,
          baseFilename,

          baseType,

          baseLangRe = /^spec-baseLang/,
          baseLocaleRe = /^spec-baseLocale/,
          baseLangLocaleRe = /^spec-baseLangLocale/;

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


    // return `lang` for `lang-baseLang.json`
    // lang and locale files *must* be prefixed
    getPrefix : function (filename) {
      var prefix,
          prefixre = /(spec|lang)-base(?:LangLocale|Lang|Locale)/,
          prefixmatch = filename.match(prefixre);

      if (!prefixmatch) throw new Error('[!!!] file must be prefixed `-spec` or `-lang`: ' + filename);
      
      return prefixmatch[1];
    },

    getRmPrefix : function (filename) {
      var prefixre = /(spec-|lang-)/;
        
      return filename.replace(prefixre, '');
    },


    isBaseFilename : function (filename) {
      return this.getBaseType(filename) ? true : false;
    },

    // return all combinations of filename
    // for the given ISOType.
    getRequiredFilenameArr : function (ISOType, langArr, localeArr) {
      var ISOTypes = this.type, 
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

    // based on type, return all possible filename combinations
    // needed to support the given type, with given lang and locale supports.
    //getFilenameArr : function (ISOType, opts) {
    /*
    getFilenameArr : function (ISOopts, opts) {

      //throw new Error('getFilenameArr');
      var langArr = opts.supportedLangArr,
          localeArr = opts.supportedLocaleArr,
          ISOType = ISOopts.ISOType,
          prefixname = ISOopts.prefix,
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

      // inefficient

//      if (prefixname) { 
//        filenameArr = filenameArr.map(function (filename) {
//          return prefixname + filename;
//        });
//      }

      return filenameArr;
    }
  */
  };

}());
