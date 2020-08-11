// Filename: deploy_msg.js  
// Timestamp: 2017.09.03-12:55:49 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

const path = require('path'),
      deploy_paths = require('./deploy_paths');

module.exports = (o => {
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

  o.throw_parseerror = (filename, e) => o.throw(
    `[!!!] page-deploy: parser error, ${filename} ${e}`
  );

  o.throw_parsefiletypeerror = (opts, filename) => o.throw(
    `[!!!] page-deploy: parser error file type not supported, ${filename}`
  );  

  o.convertedfilename = (opts, filename) => console.log(
    '[mmm] wrote: :filepath'
      .replace(/:filepath/, deploy_paths.narrowdir(opts, filename))
  );

  o.convertedfilenamesupport = (opts, filename) => console.log(
    '[mmm] wrote: :directory'
      .replace(/:directory/, deploy_paths.narrowdir(opts, filename)));

  o.isnotpublishedfilename = (opts, filename) => console.log(
    '[...] unpublished: :filename'
      .replace(/:filename/g, filename));

  o.applyuniverse = (opts, filename) => console.log(
    '[...] universe: :filename'
      .replace(/:filename/g, deploy_paths.narrowdir(opts, filename)));

  return o;
  
})({});
