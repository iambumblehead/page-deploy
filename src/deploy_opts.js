// Filename: deploy_opts.js  
// Timestamp: 2017.09.02-22:17:28 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

const path = require('path');
const util = require('util');
const castas = require('castas');

module.exports = (o => {

  const defaultopts = {
    inputDir : './convert/',
    outputDir : './converted/',
    publicPath : 'domain.com/converted',
    supportDir : '',

    supportedLangArr : false,
    supportedLocaleArr : false,

    // a cache of objects constructed here. often referenced 
    // many times, but constructed once only using cache    
    patterncache : {},
    articlescache : {}
  };

  o = spec =>
    o.getNew(spec);

  o.getasboolorarr = opt => /true|false/i.test(opt)
    ? castas.bool(opt)
    : castas.arr(opt);

  o.getNew = spec => {
    const opts = Object.create(defaultopts);

    opts.inputDir = castas.str(spec.inputDir, './');
    opts.publicPath = castas.str(spec.publicPath, './spec');
    opts.outputDir = castas.str(spec.outputDir, './build/spec');
    opts.supportDir = castas.str(spec.supportDir, '');
    opts.datetitlesubdirs = castas.arr(spec.datetitlesubdirs, []);
    opts.supportedLocaleArr = o.getasboolorarr(spec.supportedLocaleArr);
    opts.supportedLangArr = o.getasboolorarr(spec.supportedLangArr);

    return opts;
  };

  return o;

})();
