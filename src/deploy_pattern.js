// Filename: deploy_pattern.js  
// Timestamp: 2017.04.08-13:59:15 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

const path = require('path'),

      deploy_iso = require('./deploy_iso'),
      deploy_file = require('./deploy_file');

const deploy_pattern = module.exports = (o => {

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
