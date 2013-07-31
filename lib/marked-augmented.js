var marked = require('marked'),
    hljs = require('highlight.js');

marked.setOptions({
  gfm : true,
  breaks : true,
  highlight: function(code, lang) {
    if (lang === 'javascript') {
      return hljs.highlight(lang, code).value;
    } else if (lang === 'lisp') {
      return hljs.highlight(lang, code).value;
    } else if (lang === 'python') {
      return hljs.highlight(lang, code).value;
    } else if (lang === 'bash') {
      return hljs.highlight(lang, code).value;
    }
    return code;
  }
});

marked.getFromStrMetaObj = function (str) {
  var metaDataObj = {}, 
      metaValRe = /\[meta:(.*)\]: <> \((.*)\)/gi;
  
  if (typeof str === 'string') {
    str.replace(metaValRe, function (match, m1, m2) {
      metaDataObj[m1] = m2;
    });
  }
  return metaDataObj;
};

module.exports = marked;