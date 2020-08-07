// Filename: deploy_pattern.js  
// Timestamp: 2017.09.03-05:00:37 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>
//
//  specfilepath: /path/to/spec/name/spec-baseLangLocale.json
//   specdirpath: /path/to/spec/name/
// parentdirpath: /path/to/spec/

const path = require('path'),
      simpletime = require('simpletime').default,
      
      deploy_iso = require('./deploy_iso'),
      deploy_msg = require('./deploy_msg'),
      deploy_file = require('./deploy_file'),
      deploy_tokens = require('./deploy_tokens');

module.exports = (o => {

  const {
    UNIVERSAL
  } = deploy_tokens;

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
  
  
  // filepath : inputpath/spec/data/actions/lang-baseLang.json
  //
  // return 'outputpath/spec/data/actions/baseLang.json'
  o.getasoutputdir = (opts, filepath, content) => {
    let outputdir = filepath.replace(path.normalize(opts.inputDir), '');

    if (opts.datetitlesubdirs.find(subdir => (
      outputdir.indexOf(subdir) !== -1 && content && content.timeDate
    ))) {
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
          outputStr = o.stringify(content);

    deploy_file.writeRecursive(outputpath, outputStr, (err, res) => (
      fn(err, res, outputpath)));
  };
  
  // return the ISO filenames that should be generated.
  o.getAssocISOFilenameArr = (opts, filename) => {
    const ISOType = deploy_iso.getBaseType(filename),
          langArr = opts.supportedLangArr,
          localeArr = opts.supportedLocaleArr;

    return deploy_iso.getRequiredFilenameArr(ISOType, langArr, localeArr);
  };
  
  // return a matching ISO file from an array of filenames
  // 
  // << ['en-US.json', 'es-ES.json'], 'en-US', '.json'
  // >> 'en-US.json'
  // 
  // << ['en-US.json', 'es-ES.json'], 'en-US', '.md'
  // >>  null
  o.arrgetmatchingISOstr = (filenameArr, ISO, extn) =>
    filenameArr.find(filename => (
      filename.indexOf(ISO) !== -1 &&
        path.extname(filename) === extn));

  // should not be a hidden '.' file
  // should end in md or json
  o.isvalidpatternfilename = filename => (
    deploy_iso.isBaseFilename(filename)
      && /^[^.].*(json|md)$/.test(filename));

  o.stringify = obj =>
    JSON.stringify(obj, null, 2);

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

  // returns other pattern file in the same directory
  o.getsimilarfilename = (filename, opts, fn) => {
    let ext = path.extname(filename),    
        dir = path.dirname(filename),
        name = path.basename(filename, ext),
        nameRe = new RegExp(name + '\\.(json|md)');
    
    deploy_file.readdir(dir, (err, patharr) => {
      if (err) return fn(err);
      
      let similarpath = patharr.find(p => (
        nameRe.test(p) &&        
          o.isvalidpatternfilename(p)));
      
      if (similarpath) {
        similarpath = path.join(dir, similarpath);
      }

      return fn(null, similarpath);      
    });      
  };
  
  return o;
  
})({});
