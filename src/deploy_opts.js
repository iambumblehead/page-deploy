// Filename: deploy_opts.js  
// Timestamp: 2017.08.06-20:05:29 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

const path = require('path'),
      util = require('util'),
      castas = require('castas');

const deploy_opts = module.exports = (o => {

  var userOptions = {
    inputDir : './convert/',
    outputDir : './converted/',
    publicPath : 'domain.com/converted',
    supportDir : '',

    supportedLangArr : false,
    supportedLocaleArr : false,

    // a cache of objects constructed here. often referenced 
    // many times, but constructed once only using cache    
    patterncache : {}
  };

  o.getasboolorarr = opt => /true|false/i.test(opt)
    ? castas.bool(opt)
    : castas.arr(opt);

  o.getaspath = p => (
    String(p)
      .replace(/^~(?=\/)/, process.env.HOME)
      .replace(/^.(?=\/)/, process.cwd()));    

  o.getNew = (spec) => {
    var that = Object.create(userOptions);

    if (spec.inputDir) {
      that.inputDir = o.getaspath(path.normalize(spec.inputDir));       
    }

    if (spec.publicPath) {
      that.publicPath = o.getaspath(path.normalize(spec.publicPath));       
    }

    if (spec.outputDir) {
      that.outputDir = o.getaspath(path.normalize(spec.outputDir));       
    }

    if (spec.supportDir) {
      that.supportDir = o.getaspath(path.normalize(spec.supportDir));       
    }

    that.datetitlesubdirs = castas.arr(spec.datetitlesubdirs, []);
    that.supportedLocaleArr = o.getasboolorarr(spec.supportedLocaleArr);
    that.supportedLangArr = o.getasboolorarr(spec.supportedLangArr);

    return that;
  };

  return o;

})({});


