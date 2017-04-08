// Filename: deploy_msg.js  
// Timestamp: 2017.04.08-13:35:22 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

const path = require('path');

const deploy_msg = module.exports = (o => {

  o.start = () =>
    console.log('[...] page-deploy: begin.');

  o.finish = () =>
    console.log('[...] page-deploy: done.');  
  
  o.pathInvalid = (path) =>
    '[!!!] pmc: path is invalid: ' + path;
  
  o.status = {
    pathCreated : (path) =>
      '[mmm] pmc: path created: ' + path
  };
  
  o.error = {
    pathInvalid : (path) =>
      '[!!!] pmc: path is invalid: ' + path,

    pathCreation : (path) =>
      '[!!!] pmc: path not created: ' + path
  };

  o.err_invalidfilename = (filename) => {
    let msg = '[!!!] invalid filename: ' + filename;
    
    throw new Error (msg);
  };

  o.convertingfilename = (filename, opts) => {
    var msg = '[...] read: :directory',
        directory = path.dirname(filename);
    
    directory = directory.replace(opts.inputDir, '');
    directory = directory.replace(/^\//, '');
    //directory = directory.replace(process.env.HOME, '~');
    
    console.log(msg.replace(/:directory/, directory));      
  };

  o.convertedfilename = (filename, opts) => {
    var msg = '[mmm] wrote: :directory',
        directory = path.dirname(filename);
    
    directory = directory.replace(opts.inputDir, '');
    directory = directory.replace(/^\//, '');
    
    console.log(msg.replace(/:directory/, directory));      
  };

  return o;
  
})({});
