// Filename: deploy_msg.js  
// Timestamp: 2017.09.03-12:55:49 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

const path = require('path'),
      deploy_paths = require('./deploy_paths');

module.exports = (o => {
  o.start = () => console.log('[...] page-deploy: begin.');

  o.finish = () => console.log('[...] page-deploy: done.');

  o.getbytesasmb = byteLength => byteLength / Math.pow(1024,2);

  o.rounded = num => (Math.round(num * 100)/100).toFixed(2);

  o.getbytesasmbrounded = byteLength => o.rounded(o.getbytesasmb(byteLength));

  o.getbyteslabel = byteLength => `~${(o.getbytesasmbrounded(byteLength))}mb`;

  o.throw = err => { throw new Error(err); };

  o.err_invalidpatternfilename = filename => o.throw(
    `[!!!] page-deploy: path is invalid: ${filename}
 * must not be hidden '.' file,
 * must end in .md or .json,
 * must have spec or lang prefix,
 * must have base qualifier and suffix

ex, spec-baseLang.md, lang-baseLangLocale.json, spec-spa-ES_ES.json
`);

  o.throw_similarfilenotfound = filename => o.throw(
    `[!!!] page-deploy: similar file not found, ${filename}`
  );

  o.throw_imgnotfound = filename => o.throw(
    `[!!!] page-deploy: image not found, ${filename}`
  );

  o.throw_parseerror = (filename, e) => o.throw(
    `[!!!] page-deploy: parser error, ${filename} ${e}`
  );

  o.throw_parsefiletypeerror = (opts, filename) => o.throw(
    `[!!!] page-deploy: parser error file type not supported, ${filename}`
  );

  o.throw_localrefnotfound = (opts, filename, refpath, refopts) => o.throw(
    `[!!!] page-deploy: local-ref not found, \n${[
      deploy_paths.narrowcwdhome(filename),
      deploy_paths.narrowcwdhome(refpath)
    ].join('\n')}\n${refopts
       && JSON.stringify(refopts, null, '  ')}`);

  o.scaledimage = (opts, filename, oldbytelen, newbytelen) => console.log(
    '[mmm] wrote: :filename :oldsize -> :newsize'
      .replace(/:filename/, deploy_paths.narrowdir(opts, filename))
      .replace(/:oldsize/, o.getbyteslabel(oldbytelen))
      .replace(/:newsize/, o.getbyteslabel(newbytelen)));

  o.convertedfilename = (opts, filename) => console.log(
    '[mmm] wrote: :filepath'
      .replace(/:filepath/, deploy_paths.narrowdir(opts, filename))
  );

  o.isnotpublishedfilename = (opts, filename) => console.log(
    '[...] unpublished: :filename'
      .replace(/:filename/g, filename));

  o.applyuniverse = (opts, filename) => console.log(
    '[...] universe: :filename'
      .replace(/:filename/g, deploy_paths.narrowdir(opts, filename)));

  return o;
})({});
