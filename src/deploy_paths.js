// Filename: deploy_paths.js  
// Timestamp: 2017.08.13-16:25:51 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

const path = require('path'),
      pathpublic = require('pathpublic');

module.exports = (o => {

  o.supportSubDirName = '/support';

  o.pathsupportdir = filename =>
    path.join(path.dirname(filename), o.supportSubDirName);

  // filename filename build/bumblehead-0.0.3/spec/data/gallery/baseLocale.json
  // return   build/bumblehead-0.0.3/spec/build/bumblehead-0.0.3/spec/data/gallery/support  
  o.pathout = (opts, filename) => {
    let inputDir = path.normalize(opts.inputDir),
        outputDir = path.normalize(opts.outputDir),
        inputPath = o.pathsupportdir(filename),
        inputPathRel = inputPath.replace(inputDir, ''),
        outputPath = path.join(outputDir, inputPathRel);

    return outputPath;
  };

  o.pathpublic = (opts, filename) =>
    pathpublic.get(o.pathout(opts, filename), opts.publicPath);

  // update the support paths to public support paths.
  o.withpublicpath = (opts, str, filename) => {
    const publicPath = o.pathpublic(opts, filename),
          supportPathRe = /(["']support\/[^'"]*['"]|^(?:\.\/)?support\/[^\b]*)/gi;

    return str.replace(supportPathRe, (match, m1, m2) => (
      match.replace(/support/, publicPath)));
  };
  
  
  return o;
  
})({});
