// Filename: marked-augmented.js  
// Timestamp: 2017.08.24-03:00:04 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

const simpletime = require('simpletime').default,
      marked = require('marked'),
      castas = require('castas').default,
      hljs = require('highlight.js');

marked.setOptions({
  gfm : true,
  breaks : true,
  highlight : (code, lang) => {
    return lang
      ? hljs.highlight(lang, code).value
      : hljs.highlightAuto(code);
  }
});

module.exports = (o => {

  o = filestr =>
    marked(filestr);
  
  o.parsedatestr = (datestr, fmt='yyyy.MM.dd-HH:mm:ss') =>
    simpletime.extractDateFormatted(datestr, fmt);

  o.parsedatestrtime = datestr =>
    o.parsedatestr(datestr).getTime();

  // return [
  //   str with symbol matching line removed,
  //   text found after symbol (if symbol)
  // ]
  // 
  // extractsymboltext('#★ text', '★') => ['', 'text']
  // extractsymboltext('★ text\n======', '★') => ['', 'text']
  //
  //
  o.extractsymboltext = (str, symbol) => {
    const symbolre = new RegExp('(.*)?[#_*`]'+symbol+'(.*)', 'ugi'),
          symbolunderlinere = new RegExp(symbol+'(.*)\n==*', 'ugi'),
          endmdtagre = /([#_*`]|\n==*)$/,
          match = (String(str).match(symbolre) ||
                   String(str).match(symbolunderlinere));

    return (match && match[0])
      ? [ str.replace(match[0], ''),
        match[0].split(symbol)[1].trim().replace(endmdtagre, '') ]
      : [ str ];
  };

  o.extractsymbols = (str, obj={}, text) => 
    [ [ '★', 'title' ],
      [ '✑', 'author' ],
      [ '☆', 'excerptnohtml' ],
      [ '⌚', 'timeDate', o.parsedatestrtime ]
    ].reduce(([ str, obj ], [ sym, propname, filter ]) => {
      [ str, text ] = o.extractsymboltext(str, sym);

      if (text) {
        if (filter) {
          text = filter(text);
        }

        obj[propname] = text;
      }

      return [ str, obj ];
      
    }, [ str, obj ]);

  o.extractmetadata = (str, metadata={}) => {
    let metaValRe = /\[meta:(.*)\]: <> \((.*)\)/gi;

    if (typeof str === 'string') {
      str.replace(metaValRe, (match, m1, m2) => {
        if (/date$/i.test(m1)) {
          metadata[m1] = o.parsedatestrtime(m2);
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
    
    return [ str, metadata ];
  };

  return o;

})({});
