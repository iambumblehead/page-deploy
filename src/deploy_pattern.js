// Filename: deploy_pattern.js  
// Timestamp: 2017.09.03-05:00:37 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>
//
//  specfilepath: /path/to/spec/name/spec-baseLangLocale.json
//   specdirpath: /path/to/spec/name/
// parentdirpath: /path/to/spec/

const path = require('path'),
      objobjwalk = require('objobjwalk'),
      simpletime = require('simpletime').default,
      
      deploy_iso = require('./deploy_iso'),
      deploy_msg = require('./deploy_msg'),
      deploy_file = require('./deploy_file'),
      deploy_tokens = require('./deploy_tokens'),

      { UNIVERSAL } = deploy_tokens;

module.exports = (o => {

  //o.getparentdirpath = (filepath) => 
  //  path.dirname(path.dirname(filepath));

  o.getasdatetitlesubdir = (outputpath, content, opts) => {
    const datefmt='yyyy.MM.dd',
          basename = path.basename(outputpath),
          dirname = path.dirname(path.dirname(outputpath)),
          titlesubdir = ':date-:title'
            .replace(/:date/, simpletime.applyFormatDate(
              new Date(content.timeDate), datefmt))
            .replace(/:title/, content.title.toLowerCase())
            .replace(/ /g, '-');
    
    return path.join(dirname, titlesubdir, basename);
  };

  //
  // unversedirpath relatative to filepath
  //
  o.getuniversaldirpath = filepath =>
    path.join(path.dirname(path.dirname(filepath)), UNIVERSAL);

  //
  // unversefilepath relatative to filepath
  //
  // should be elaborated to locate lang/local or default paths
  //
  o.getuniversefilepath = filepath => {
    const specname = path.basename(filepath),
          universaldirpath = o.getuniversaldirpath(filepath);
          
    return path.join(universaldirpath, specname.replace(/\.([^.]*)$/, '.json'));
  };

  o.isdatetitlecontent = (opts, contentobj, filename) => (
    opts.datetitlesubdirs
      .some(subdir => filename.indexOf(subdir) !== -1 && contentobj.timeDate)
  );
  
  // filepath : inputpath/spec/data/actions/lang-baseLang.json
  //
  // return 'outputpath/spec/data/actions/baseLang.json'
  o.getasoutputdir = (opts, filepath, content) => {
    let outputdir = filepath.replace(path.normalize(opts.inputDir), '');

    if (o.isdatetitlecontent(opts, content, filepath)) {
      outputdir = o.getasdatetitlesubdir(outputdir, content, opts);
    }

    return outputdir;
  };
  
  o.getasoutputpath = (opts, filepath, content) => (
    path.join(opts.outputDir, o.getasoutputdir(opts, filepath, content))
      .replace(/\.([^.]*)$/, '.json')
      .replace(/spec-|lang-/, ''));
  
  o.writeAtFilename = (filename, content, opts, fn) => {
    const outputpath = o.getasoutputpath(opts, filename, content),
          outputStr = deploy_file.stringify(content);

    deploy_file.writeRecursive(outputpath, outputStr, (err, res) => (
      fn(err, res, outputpath)));
  };
  
  // return the ISO filenames that should be generated.
  o.getisooutputfilenamearr = (opts, filename) => {
    const ISOType = deploy_iso.getBaseType(filename),
          langArr = opts.supportedLangArr,
          localeArr = opts.supportedLocaleArr;

    return deploy_iso.getisofilenamearr(ISOType, langArr, localeArr);
  };

  // input 'en-US.json', 'en-US', '.json'
  // return true
  o.isfilenameisomatch = (filename, ISO, extn) => (
    filename.indexOf(ISO) !== -1 && path.extname(filename) === extn);

  
  // return a matching ISO file from an array of filenames
  // 
  // << ['en-US.json', 'es-ES.json'], 'en-US', '.json'
  // >> 'en-US.json'
  // 
  // << ['en-US.json', 'es-ES.json'], 'en-US', '.md'
  // >>  null
  o.arrgetmatchingISOstr = (filenameArr, ISO, extn) =>
    filenameArr.find(filename => o.isfilenameisomatch(filename, ISO, extn));

  // should not be a hidden '.' file
  // should end in md or json
  // o.isvalidpatternfilename = filename => {
  o.patternisvalidinputfilename = filename => {
    const extn = path.extname(filename),
          name = path.basename(filename, extn);

    return deploy_iso.isPatternExtnRe.test(extn) && (
      deploy_iso.isPatternBaseNameRe.test(name) ||
        deploy_iso.isPatternBaseISORe.test(name));
  };

  o.patternisvalidoutputfilename = filename => {
    const extn = path.extname(filename),
          name = path.basename(filename, extn);

    return deploy_iso.isPatternExtnRe.test(extn) && (
      deploy_iso.isPatternBaseNameRe.test(name) ||
        deploy_iso.isPatternISORe.test(name));
  };
  
  // return the value defined on the given namespace or null
  //
  // ex,
  //
  //   o.objlookup('hello.my', {hello:{my:'world'}})
  //
  // return,
  //
  //   'world'
  //
  o.objlookup = (namespacestr, obj) => String(namespacestr)
    .split('.').reduce(
      (a, b) => a ? (b in a ? a[b] : a[Number(b)]) : null, obj);

  // unit test this
  // returns other pattern file in the same directory
  o.getsimilarfilename = (filename, opts, fn) => {
    const ext = path.extname(filename),
          dir = path.dirname(filename),
          basename = path.basename(filename),
          basenameRe = new RegExp(
            `${path.basename(filename, ext)}\\.(json|md)`);
    
    deploy_file.readdir(dir, (err, patharr) => {
      if (err) return fn(err);

      fn(null, patharr.filter(p => (
        p !== basename
          && basenameRe.test(p)
          && o.patternisvalidinputfilename(p))));
    });
  };

  o.updatelangdefs = (contentObj, langObj, fn) => {
    const langkeyre = /^pd\.langkey\./,
          langobjre = /^pd\.langobj/;

    fn(null, objobjwalk.type('string', contentObj, str => {
      if (langobjre.test(str)) {
        str = langObj;
      } else if (langkeyre.test(str)) {
        str = o.objlookup(str.replace(langkeyre, ''), langObj) || str;
      }

      return str;
    }));
  };

  // takes a keys object and replaces `langkey` properties
  // with corresponding value from keys obj
  o.updatelangkeys = (contentObj, langObj, fn) => 
    objobjwalk.async(contentObj, (objobj, exitFn) => {
      if (objobj.langkey) {
        exitFn(null, langObj[objobj.langkey]);
      } else if (objobj.langobj) {
        exitFn(null, langObj);
      } else {
        exitFn(null, objobj);
      }
    }, fn);

  return o;
})({});
