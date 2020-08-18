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

  o.removedir = (filepath, dir, sep = path.sep) => {
    dir =  dir.replace(/^\.\//, '');

    return filepath
      .replace(dir + (dir.substr(-1) === sep ? '' : sep), '');
  };

  o.removeinputdir = (opts, filepath) => o.removedir(filepath, opts.inputDir);

  o.removeoutputdir = (opts, filepath) => o.removedir(filepath, opts.outputDir);

  o.narrowcwdhome = filepath => String(filepath)
    .replace(process.cwd(), '.')
    .replace(process.env.HOME, '~');

  o.narrowdir = (opts, filepath) => o.narrowcwdhome(
    o.removeoutputdir(opts, o.removeinputdir(opts, filepath)));

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
  o.outputsupportpath = (opts, filename) => {
    let inputDir = path.normalize(opts.inputDir),
        outputDir = path.normalize(opts.outputDir),
        inputPath = o.pathsupportdir(filename),
        inputPathRel = o.narrowdir(opts, inputPath),
        outputPath = path.join(outputDir, inputPathRel);
    
    return outputPath;
  };

  o.publicsupportpath = (opts, filename) =>
    pathpublic.get(o.outputsupportpath(opts, filename), opts.publicPath);

  // update the support paths to public support paths.
  o.withpublicpath = (opts, str, filename) => {
    const publicPath = o.publicsupportpath(opts, filename),
          supportPathRe =
            /(["']support\/[^'"]*['"]|^(?:\.\/)?support\/[^\b]*)/gi;

    return str.replace(supportPathRe, (match, m1, m2) => (
      match.replace(/support/, publicPath)));
  };

  o.getspecdirpath = specfilepath =>
    path.dirname(specfilepath);

  o.getparentdirpath = specfilepath =>
    path.dirname(o.getspecdirpath(specfilepath));
  
  return o;
  
})({});
