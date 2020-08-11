const fs = require('fs'),
      path = require('path'),
      htmldecoder = require('html-decoder'),
      striphtmltags = require('strip-html-tags'),
      deploy_msg = require('./deploy_msg'),
      deploy_marked = require('./deploy_marked');

module.exports = (o => {
  o.extractexcerpt = content => {
    const match = String(content).match(/<p>(.*)…/gi),
          excerpt = match && match[0].slice(0, -1);

    if (excerpt) {
      content = content.replace(match[0], excerpt);
    }

    return [ content, `${excerpt}</p>` ];
  };
  
  o.parseJSON = (opts, filestr, filename) => {
    try {
      return JSON.parse(filestr);
    } catch (e) {
      deploy_msg.throw_parseerror(filename, e);
    }    
  };

  o.parseMD = (opts, filestr, filename) => {
    let metadata = {},
        content,
        excerpt;
    
    [ filestr, metadata ] = deploy_marked.extractsymbols(filestr, metadata);
    [ filestr, metadata ] = deploy_marked.extractmetadata(filestr, metadata);

    content = deploy_marked(filestr);
    
    [ content, excerpt ] = o.extractexcerpt(content);
    
    metadata.content = content;

    if (excerpt) {
      metadata.excerpthtml = excerpt;
      metadata.excerptnohtml = htmldecoder.decode(striphtmltags(excerpt));
    }

    return metadata;
  };

  o.parsefile = (opts, filestr, filename) => {
    let extname = path.extname(filename);

    if (extname === '.json') {
      return o.parseJSON(filename, filestr);
    } else if (extname === '.md') {
      return o.parseMD(filename, filestr);
    } else {
      deploy_msg.throw_parsefiletypeerror(opts, filename);
    }
  };

  return o;
})({});
