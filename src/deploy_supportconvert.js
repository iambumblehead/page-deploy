// Filename: deploy_supportconvert.js  
// Timestamp: 2017.06.01-02:26:10 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>
//
// pickup and use 'support' directory and contents
// for given pattern

const fs = require('fs'),
      rcp = require('recursive-copy'),
      path = require('path'),      
      nodefs = require('node-fs'),      
      pathpublic = require('pathpublic'),
      deploy_msg = require('./deploy_msg');      

const deploy_supportconvert = module.exports = (o => {
  
  o.supportSubDirName = '/support';

    // supportedFilename is used to construct
    // all paths for the support directory,
    //  - inputPath, outputPath, publicPath
  o.supportedFilename = '';

  o.getpathin = (opts, cfg) => {
    let filename = cfg.supportedFilename,
        dirname = path.dirname(filename),
        inputPath = path.join(dirname, o.supportSubDirName);

    return inputPath;
  };

  o.getpathout = (opts, cfg) => {
    let inputDir = path.normalize(opts.inputDir),
        outputDir = path.normalize(opts.outputDir),
        inputPath = o.getpathin(opts, cfg),
        inputPathRel = inputPath.replace(inputDir, ''),
        outputPath = path.join(outputDir, inputPathRel);

    return outputPath;
  };

  o.getRelativeOutputPath = (opts, cfg) => {
     let outputPath = o.getpathout(opts, cfg),
         relativeOutputPath = outputPath.
           replace(opts.outputDir, '').
           replace(/^[\/\\]/, '');
      
    return relativeOutputPath;
  };

  o.getpathpublic = (opts, cfg) => {
    let outputPath = o.getpathout(opts, cfg),
        publicPath = pathpublic.get(outputPath, opts.publicPath);

    return publicPath;
  };

  // update the support paths to public support paths.
  o.getWithPublicPathStr = (str, opts, cfg) => {
    let publicPath = o.getpathpublic(opts, cfg),
        supportPathRe = /(["']support\/[^'"]*['"]|^(?:\.\/)?support\/[^\b]*)/gi;

    return str.replace(supportPathRe, (match, m1, m2) => (
      match.replace(/support/, publicPath)));
  };

  o.writeSupportDir = (opts, cfg, fn) => {
    let inputSupportPath = o.getpathin(opts, cfg),
        outputSupportPath = o.getpathout(opts, cfg),
        relativeSupportPath = o.getRelativeOutputPath(opts, cfg);

      // read dir... if dir, copy
      fs.stat(inputSupportPath, (err, stat) => {
        if (stat && stat.isDirectory()) {
          nodefs.mkdir(outputSupportPath, 0755, true, (err, res) => {
            if (err) return fn(err);

            rcp(inputSupportPath, outputSupportPath, {
              overwrite: true
            }, (err, res) => {
              if (err) return fn(err);

              deploy_msg.convertedfilename(relativeSupportPath, opts);
              //console.log('[mmm] wrote: ' + relativeSupportPath);
              fn(null, 'success');
            });          
          });
        } else {
          fn(null, null);
        }
      });
  };

  return o;
  
})({});
