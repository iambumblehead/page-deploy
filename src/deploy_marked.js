// Filename: marked-augmented.js  
// Timestamp: 2017.08.06-19:04:57 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

var simpletime = require('simpletime'),
    marked = require('marked'),
    castas = require('castas'),
    hljs = require('highlight.js');

module.exports = (o => {

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

  marked.parsedatestr = (datestr, fmt='yyyy.MM.dd-hh:mm:ss') =>
    simpletime.extractDateFormatted(datestr, fmt);

  marked.parsedatestrtime = datestr =>
    marked.parsedatestr(datestr).getTime();

  // return [
  //   str with symbol matching line removed,
  //   text found after symbol (if symbol)
  // ]
  // 
  // extractsymboltext('#★ text', '★') => ['', 'text']
  // extractsymboltext('★ text\n======', '★') => ['', 'text']
  //
  //
  marked.extractsymboltext = (str, symbol) => {
    const symbolre = new RegExp('(.*)?[#_*`]'+symbol+'(.*)', 'ugi'),
          symbolunderlinere = new RegExp(symbol+'(.*)\n==*', 'ugi'),
          endmdtagre = /([#_*`]|\n==*)$/,
          match = (String(str).match(symbolre) ||
                   String(str).match(symbolunderlinere));

    return (match && match[0])
      ? [str.replace(match[0], ''),
         match[0].split(symbol)[1].trim().replace(endmdtagre, '')]
      : [str];
  };

  marked.extractsymbols = (str, obj={}, text) => 
    [['★', 'title'],
     ['✑', 'author'],
     ['⌚', 'timeDate', marked.parsedatestrtime]
    ].reduce(([str, obj], [sym, propname, filter]) => {
      [str, text] = marked.extractsymboltext(str, sym);

      if (text) {
        if (filter) {
          text = filter(text);
        }

        obj[propname] = text;
      }

      return [str, obj];
      
    }, [str, obj]);

  marked.extractmetadata = (str, metadata={}) => {
    let metaValRe = /\[meta:(.*)\]: <> \((.*)\)/gi;

    if (typeof str === 'string') {
      str.replace(metaValRe, (match, m1, m2) => {
        if (/date$/i.test(m1)) {
          metadata[m1] = marked.parsedatestrtime(m2);
        } else if (/arr$/i.test(m1)) {
          metadata[m1] = m2.split(/,/);        
        } else if (/^is/.test(m1) &&
                   /true|false/g.test(m2)) {
          metadata[m1] = castas.bool(m2);
        } else {
          metadata[m1] = m2;        
        }
      });
    }
    
    return [str, metadata];
  };

  return marked;

})({});
