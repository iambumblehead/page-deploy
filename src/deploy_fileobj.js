// Filename: deploy_fileobj.js  
// Timestamp: 2017.09.03-05:14:41 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

const path = require('path'),
      objobjwalk = require('objobjwalk'),
      htmldecoder = require('html-decoder'),
      striphtmltags = require('strip-html-tags'),

      deploy_fileconvert = require('./deploy_fileconvert'),
      deploy_pattern = require('./deploy_pattern'),
      deploy_convert = require('./deploy_convert'),
      deploy_marked = require('./deploy_marked'),
      deploy_tokens = require('./deploy_tokens'),
      deploy_file = require('./deploy_file'),
      deploy_html = require('./deploy_html'),
      deploy_msg = require('./deploy_msg');

module.exports = (o => {

  const {
    LOCALREF,
    LOCALREFARR,
    LOCALREFPAGEARR
  } = deploy_tokens;  

  o.parse = (JSONStr, filename) => {
    try {
      return JSON.parse(JSONStr);        
    } catch (x) {
      console.log('[!!!] locale-deploy, parse error: ' + filename);
      throw new Error('[!!!] locale-deploy, parse error: ' + JSONStr);
    }
  };
  
  o.parseJSON = (opts, filestr, filename) =>
    o.parse(filestr, filename);

  o.parseMD = (opts, filestr, filename) => {
    let metadata = {},
        content,
        excerpt;
    
    [filestr, metadata] = deploy_marked.extractsymbols(filestr, metadata);
    [filestr, metadata] = deploy_marked.extractmetadata(filestr, metadata),

    content = deploy_marked(filestr),
    
    [content, excerpt] = deploy_html.extractexcerpt(content);
    
    metadata.content = content;

    if (excerpt) {
      metadata.excerpthtml = excerpt;
      metadata.excerptnohtml = htmldecoder.decode(striphtmltags(excerpt));
    }

    return metadata;
  };

  o.parsefile = (filename, filestr) => {
    let extname = path.extname(filename);

    if (extname === '.json') {
      return o.parseJSON(filename, filestr);
    } else if (extname === '.md') {
      return o.parseMD(filename, filestr);
    } else {
      throw new Error('[!!!] convert-locale, file type not supported: ' + filename);
    }
  };

  o.getfromfile = (opts, filename, fn) => {
    if (opts.patterncache[filename]) {
      return fn(null, opts.patterncache[filename]);
    }

    if (!deploy_pattern.isvalidpatternfilename(filename)) {
      return deploy_msg.err_invalidfilename(filename);
    }      

    deploy_file.read(filename, (err, res) => {
      if (err) deploy_msg.errorreadingfile(filename, err);
      if (err) return fn(new Error(err));

      o.getConverted(opts, filename, o.parsefile(filename, res), (err, fileobj) => {
        if (err) return fn(err);

        opts.patterncache[filename] = fileobj;
        
        fn(null, fileobj);
      });
    });        
  };

  o.getfromfilesimilar = (opts, filename, fn) =>
    deploy_pattern.getsimilarfilename(filename, opts, (err, simfilename) => {
      if (err) return fn(err);
      
      simfilename
        ? o.getfromfile(opts, simfilename, fn)
        : fn(new Error('[...] similar file not found, ' + filename));
    });

  o.getConverted = (opts, filename, fileobj, fn) => {
    if (opts.patterncache[filename])
      return fn(null, fileobj);

    require('./deploy_fileconvert').convert(opts, fileobj, filename, (err, fileobj) => {
      if (err) return fn(err);

      opts.patterncache[filename] = true;
      
      fn(null, fileobj);
    });
  };

  return o;
  
})({});
