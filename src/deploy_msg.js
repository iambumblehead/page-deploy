// Filename: deploy_msg.js  
// Timestamp: 2017.09.03-12:55:49 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

const path = require('path');

module.exports = (o => {

  o.start = () =>
    console.log('[...] page-deploy: begin.');

  o.finish = () =>
    console.log('[...] page-deploy: done.');  
  
  o.pathInvalid = path =>
    '[!!!] page-deploy: path is invalid: ' + path;
  
  o.err_invalidfilename = filename => {
    const msg = '[!!!] invalid filename: ' + filename;
    
    throw new Error (msg);
  };

  o.convertingfilename = (filename, opts) => {
    const msg = '[...] read: :directory',
          directory = path.dirname(filename);

    directory = directory.replace(opts.inputDir, '');
    directory = directory.replace(/^\//, '');
    
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

  o.applyuniverse = (filename, opts) => {
    const msg = '[...] universe: :filename'
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
