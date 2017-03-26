// Filename: deploy_pattern.js  
// Timestamp: 2017.03.25-21:16:26 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

const deploy_pattern = module.exports = (o => {

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

  return o;
  
})({});
