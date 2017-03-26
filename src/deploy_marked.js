// Filename: marked-augmented.js  
// Timestamp: 2017.03.25-22:11:19 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

var marked = require('marked'),
    castas = require('castas'),
    hljs = require('highlight.js');

const deploy_marked = module.exports = (o => {

  marked.setOptions({
    gfm : true,
    breaks : true,
    highlight: (code, lang) => {
      if (lang === 'javascript') {
        code = hljs.highlight(lang, code).value;
      } else if (lang === 'json') {
        code = hljs.highlight(lang, code).value;
      } else if (lang === 'lisp') {        
        code = hljs.highlight(lang, code).value;
      } else if (lang === 'python') {
        code = hljs.highlight(lang, code).value;
      } else if (lang === 'bash') {
        code = hljs.highlight(lang, code).value;
      }
      
      return code;
    }
  });

  marked.parseISO8601 = (dateStrInRange) => {
    var isoExp = /^\s*(\d{4})\.(\d\d)\.(\d\d)-(\d\d):(\d\d):(\d\d)\s*$/,
        date = new Date(NaN), month,
        parts = isoExp.exec(dateStrInRange);

    if (parts) {
      month = +parts[2];
      date.setFullYear(parts[1], month - 1, parts[3], parts[4], parts[5], parts[6]);
      if(month != date.getMonth() + 1) {
        date.setTime(NaN);
      }
    }
    
    return date;
  };

  marked.getFromStrMetaObj = (str) => {
    let metaDataObj = {}, 
        metaValRe = /\[meta:(.*)\]: <> \((.*)\)/gi;
    
    if (typeof str === 'string') {
      str.replace(metaValRe, (match, m1, m2) => {
        if (m1.match(/date$/i)) {
          metaDataObj[m1] = marked.parseISO8601(m2).getTime();
        } else if (m1.match(/arr$/i)) {
          metaDataObj[m1] = m2.split(/,/);        
        } else if (m1.match(/^is[A-Z]/)) {
          metaDataObj[m1] = castas.bool(m2);
        } else {
          metaDataObj[m1] = m2;        
        }
      });
    }
    return metaDataObj;
  };

  return marked;

})({});
