// Filename: deploy_supportconvert.js  
// Timestamp: 2017.03.25-16:16:44 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>
//
// pickup and use 'support' directory and contents
// for given pattern

const fs = require('fs'),
      path = require('path'),
      pathpublic = require('pathpublic'),
      objobjwalk = require('objobjwalk'),
    
      cpr = require('recursive-copy'),
      nodefs = require('node-fs');

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

    console.error('outputpath', outputPath, opts.publicPath);
    
    return publicPath;
  };

    // update the support paths to public support paths.
  o.getWithPublicPathStr = (str, opts, cfg) => {
    let publicPath = o.getpathpublic(opts, cfg),
        supportPathRe = /(["']support\/[^'"]*['"]|^(?:\.\/)?support\/[^\b]*)/gi;

    return str.replace(supportPathRe, (match, m1, m2) => {
      return match.replace(/support/, publicPath);
    });
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

            cpr(inputSupportPath, outputSupportPath, (err, res) => {
              if (err) return fn(err);
              
              console.log('[mmm] wrote: ' + relativeSupportPath);
              fn(null, 'success');
            });          
          });
        } else {
          fn(null, null);
        }
      });
  };

  o.getUpdatedObjSupportPaths = (obj, opts, cfg) => {
    obj = objobjwalk.type('string', obj, ob => (
      o.getWithPublicPathStr(ob, opts, cfg)));

    return obj;
  };

  o.getUpdatedObj = (obj, opts, cfg, fn) => {
    obj = o.getUpdatedObjSupportPaths(obj, opts, cfg);
    
    fn(null , 'success');
  };

  return o;
  
})({});
