// Filename: deploy_pattern.js  
// Timestamp: 2017.08.06-23:16:34 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

const path = require('path'),
      simpletime = require('simpletime'),
      
      deploy_iso = require('./deploy_iso'),
      deploy_msg = require('./deploy_msg'),
      deploy_file = require('./deploy_file');

module.exports = (o => {

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
  
  // filepath : inputpath/spec/data/actions/lang-baseLang.json
  //
  // return 'outputpath/spec/data/actions/baseLang.json'
  o.getasoutputdir = (filepath, content, opts) => {
    let outputdir = filepath.replace(opts.inputDir, '');

    if (opts.datetitlesubdirs.find(subdir => (
      outputdir.indexOf(subdir) !== -1 && content.timeDate
    ))) {
      outputdir = o.getasdatetitlesubdir(outputdir, content, opts);
    }
    
    return outputdir;
  };
  
  o.getasoutputpath = (filepath, content, opts) => (
    path.join(opts.outputDir, o.getasoutputdir(filepath, content, opts))
      .replace(/\.([^.]*)$/, '.json')
      .replace(/spec-|lang-/, ''));
  
  o.writeAtFilename = (filename, content, opts, fn) => {
    const outputpath = o.getasoutputpath(filename, content, opts),
          outputStr = o.stringify(content);

    deploy_file.writeRecursive(outputpath, outputStr, fn);
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

  // filename given here for error scenario only  
  o.parse = (JSONStr, filename) => {
    let obj = null;

    try {
      obj = JSON.parse(JSONStr);        
    } catch (x) {
      console.log('[!!!] locale-deploy, parse error: ' + filename);
      throw new Error('[!!!] locale-deploy, parse error: ' + JSONStr);
    }

    return obj;
  };

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
  o.objlookup = (namespacestr, obj) => 
    String(namespacestr).split('.').reduce(
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
