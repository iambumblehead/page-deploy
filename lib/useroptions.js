var path = require('path'),
    util = require('util');

var UserOptions = module.exports = (function () {

  var userOptions = {
    inputDir : './convert/',
    outputDir : './converted/',
    publicPath : 'domain.com/converted',
    supportDir : '',

    supportedLangArr : false,
    supportedLocaleArr : false
  };

  return {
    getNew : function (spec) {
      var that = Object.create(userOptions),
          homeDir = process.env.HOME + '/',
          getAsPath = function (p) {
            if (typeof p === 'string') {
              return p
              .replace(/^~(?=\/)/, process.env.HOME)
              .replace(/^.(?=\/)/, process.cwd());
            } else {
              return p;            
            }
          },
          isTrue = function (opt) {
            return opt === true || opt === 'true';
          },
          isFalse = function (opt) {
            return opt === false || opt === 'false';
          },
          getAsBoolOrArr = function (opt) {
            if (opt === true || opt === 'true') {
              return true;
            } else if (typeof opt === 'string') {
              return opt.split(',');      
            } else if (util.isArray(opt)) {
              return opt;      
            }
          };

      if (spec.inputDir) {
        that.inputDir = getAsPath(path.normalize(spec.inputDir));       
      }

      if (spec.publicPath) {
        that.publicPath = getAsPath(path.normalize(spec.publicPath));       
      }

      if (spec.outputDir) {
        that.outputDir = getAsPath(path.normalize(spec.outputDir));       
      }

      if (spec.supportDir) {
        that.supportDir = getAsPath(path.normalize(spec.supportDir));       
      }

      that.supportedLocaleArr = getAsBoolOrArr(spec.supportedLocaleArr);
      that.supportedLangArr = getAsBoolOrArr(spec.supportedLangArr);

      return that;
    }
  };

}());


