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

marked.parseISO8601 = function (dateStrInRange) {
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

marked.isTrue = function (opt) {
  return opt === true || opt === 'true';
};
//https://github.com/iambumblehead/page-deploy.git

marked.getFromStrMetaObj = function (str) {
  var metaDataObj = {}, 
      metaValRe = /\[meta:(.*)\]: <> \((.*)\)/gi;
  
  if (typeof str === 'string') {
    str.replace(metaValRe, function (match, m1, m2) {
      if (m1.match(/Date$/)) {
        metaDataObj[m1] = marked.parseISO8601(m2).getTime();                
      } else if (m1.match(/Arr$/)) {
        metaDataObj[m1] = m2.split(/,/);        
      } else if (m1.match(/Bool$/)) {
        metaDataObj[m1] = marked.isTrue(m2);                
      } else {
        metaDataObj[m1] = m2;        
      }
    });
  }
  return metaDataObj;
};

module.exports = marked;