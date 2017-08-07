// Filename: deploy_msg.js  
// Timestamp: 2017.08.07-00:23:40 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

const path = require('path');

module.exports = (o => {

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
    const msg = '[!!!] invalid filename: ' + filename;
    
    throw new Error (msg);
  };

  o.convertingfilename = (filename, opts) => {
    const msg = '[...] read: :directory',
          directory = path.dirname(filename);

    directory = directory.replace(opts.inputDir, '');
    directory = directory.replace(/^\//, '');
    //directory = directory.replace(process.env.HOME, '~');
    
    console.log(msg.replace(/:directory/, directory));      
  };

  o.convertedfilename = (filename, opts) => {
    const msg = '[mmm] wrote: :directory',
          directory = path.dirname(filename)
            .replace(opts.inputDir, '')
            .replace(/^\//, '');    
    
    console.log(msg.replace(/:directory/, directory));      
  };

  o.convertedfilenamesupport = (filename, opts) => {
    const msg = '[mmm] wrote: :directory (support)',
          directory = path.dirname(filename)
            .replace(opts.inputDir, '')
            .replace(/^\//, '');    
    
    console.log(msg.replace(/:directory/, directory));      
  };  

  o.isnotpublishedfilename = (filename, opts) => {
    const msg = '[...] unpublished: :filename'
            .replace(/:filename/g, filename);
    
    console.log(msg);      
  };  

  o.errorreadingfile = (filename, err) => {
    const msg = '[!!!] error reading file: :filename'
            .replace(/:filename/, filename);
    
    console.error(err);    
    console.error(msg);
  };

  return o;
  
})({});
