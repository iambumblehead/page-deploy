// Filename: deploy_paths.js  
// Timestamp: 2017.09.03-05:08:17 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  
//
//  specfilepath: /path/to/spec/name/spec-baseLangLocale.json
//   specdirpath: /path/to/spec/name/
// parentdirpath: /path/to/spec/
//

const path = require('path');
const pathpublic = require('pathpublic');

module.exports = (o => {

  o.supportSubDirName = '/support';

  o.pathsupportdir = filename =>
    path.join(path.dirname(filename), o.supportSubDirName);

  // input
  //   src/spec/page/blog/universal
  //
  // return
  //   build/bumblehead-0.0.4/spec/page/blog/universal
  //
  o.dirout = (opts, dirname) => {
    const inputDir = path.normalize(opts.inputDir),
          outputDir = path.normalize(opts.outputDir);

    return path.join(outputDir, dirname.replace(inputDir, ''));
  };

  // filename filename build/bumblehead-0.3/spec/data/gallery/baseLocale.json
  // return
  // build/bumblehead-0.3/spec/build/bumblehead-0.3/spec/data/gallery/support
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
          // eslint-disable-next-line max-len
          supportPathRe = /(["']support\/[^'"]*['"]|^(?:\.\/)?support\/[^\b]*)/gi;

    return str.replace(supportPathRe, (match, m1, m2) => (
      match.replace(/support/, publicPath)));
  };

  o.getspecdirpath = specfilepath =>
    path.dirname(specfilepath);

  o.getparentdirpath = specfilepath =>
    path.dirname(o.getspecdirpath(specfilepath));
  
  return o;
  
})({});
