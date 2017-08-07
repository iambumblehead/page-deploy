// Filename: deploy_supportconvert.js  
// Timestamp: 2017.08.07-00:21:32 (last modified)
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

module.exports = (o => {
  
  o.supportSubDirName = '/support';

    // supportedFilename is used to construct
    // all paths for the support directory,
    //  - inputPath, outputPath, publicPath
  o.supportedFilename = '';

  o.getpathin = (opts, filename) => {
    const dirname = path.dirname(filename),
          inputPath = path.join(dirname, o.supportSubDirName);

    return inputPath;
  };

  o.getpathout = (opts, filename) => {
    let inputDir = path.normalize(opts.inputDir),
        outputDir = path.normalize(opts.outputDir),
        inputPath = o.getpathin(opts, filename),
        inputPathRel = inputPath.replace(inputDir, ''),
        outputPath = path.join(outputDir, inputPathRel);

    return outputPath;
  };

  o.getRelativeOutputPath = (opts, filename) => {
     let outputPath = o.getpathout(opts, filename),
         relativeOutputPath = outputPath.
           replace(opts.outputDir, '').
           replace(/^[\/\\]/, '');
      
    return relativeOutputPath;
  };

  o.getpathpublic = (opts, filename) => {
    let outputPath = o.getpathout(opts, filename),
        publicPath = pathpublic.get(outputPath, opts.publicPath);

    return publicPath;
  };

  // update the support paths to public support paths.
  o.getWithPublicPathStr = (str, opts, filename) => {
    const publicPath = o.getpathpublic(opts, filename),
          supportPathRe = /(["']support\/[^'"]*['"]|^(?:\.\/)?support\/[^\b]*)/gi;

    return str.replace(supportPathRe, (match, m1, m2) => (
      match.replace(/support/, publicPath)));
  };

  o.writeSupportDir = (opts, rootfilename, fn) => {
    const inputSupportPath = o.getpathin(opts, rootfilename),
          outputSupportPath = o.getpathout(opts, rootfilename),
          relativeSupportPath = o.getRelativeOutputPath(opts, rootfilename);

    // read dir... if dir, copy
    fs.stat(inputSupportPath, (err, stat) => {
      if (stat && stat.isDirectory()) {
        nodefs.mkdir(outputSupportPath, 0755, true, (err, res) => {
          if (err) return fn(err);

          rcp(inputSupportPath, outputSupportPath, {
            overwrite: true
          }, (err, res) => {
            if (err) return fn(err);

            deploy_msg.convertedfilenamesupport(relativeSupportPath, opts);

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
