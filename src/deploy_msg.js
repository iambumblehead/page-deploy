// Filename: deploy_msg.js  
// Timestamp: 2017.09.03-12:55:49 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

const path = require('path');

module.exports = (o => {
  o.removedir = (filepath, dir, sep = path.sep) => filepath
    .replace(dir + (dir.substr(-1) === sep ? '' : sep), '');

  o.removeinputdir = (opts, filepath) => o.removedir(filepath, opts.inputDir);

  o.removeoutputdir = (opts, filepath) => o.removedir(filepath, opts.outputDir);
  
  o.narrowdir = (opts, filepath) =>
    o.removeoutputdir(opts, o.removeinputdir(opts, filepath))
      .replace(process.cwd(), '.')
      .replace(process.env.HOME, '~');

  o.start = () => console.log('[...] page-deploy: begin.');

  o.finish = () => console.log('[...] page-deploy: done.');  

  o.throw = err => { throw new Error(err); };

  o.err_invalidpatternfilename = filename => o.throw(
    `[!!!] page-deploy: path is invalid: ${filename}
 * must not be hidden '.' file,
 * must end in .md or .json,
 * must have spec or lang prefix,
 * must have base qualifier and suffix

ex, spec-baseLang.md, lang-baseLangLocale.json, spec-spa-ES_ES.json
`);

  o.convertedfilename = (opts, filename) => console.log(
    '[mmm] wrote: :filepath'
      .replace(/:filepath/, o.narrowdir(opts, filename))
  );

  o.convertedfilenamesupport = (opts, filename) => console.log(
    '[mmm] wrote: :directory (support)'
      .replace(/:directory/, o.narrowdir(path.dirname(filename))));

  o.isnotpublishedfilename = (opts, filename) => console.log(
    '[...] unpublished: :filename'
      .replace(/:filename/g, filename));

  o.applyuniverse = (opts, filename) => console.log(
    '[...] universe: :filename'
      .replace(/:filename/g, o.narrowdir(opts, filename)));

  return o;
  
})({});
