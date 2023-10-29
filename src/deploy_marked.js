// Filename: marked-augmented.js  
// Timestamp: 2017.08.24-03:00:04 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

import {Marked} from "marked"
import {markedHighlight} from "marked-highlight"
import hljs from 'highlight.js'

import simpletime from 'simpletime'
import castas from 'castas'

const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight (code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext'
      return hljs.highlight(code, { language }).value
    }
  })
)



  
const parsedatestr = (datestr, fmt='yyyy.MM.dd-HH:mm:ss') => (
  simpletime.extractDateFormatted(datestr, fmt))

const parsedatestrtime = datestr => (
  parsedatestr(datestr).getTime())

// return [
//   str with symbol matching line removed,
//   text found after symbol (if symbol)
// ]
// 
// extractsymboltext('#★ text', '★') => ['', 'text']
// extractsymboltext('★ text\n======', '★') => ['', 'text']
//
//
const extractsymboltext = (str, symbol) => {
  const symbolre = new RegExp('(.*)?[#_*`]'+symbol+'(.*)', 'ugi')
  const symbolunderlinere = new RegExp(symbol+'(.*)\n==*', 'ugi')
  const endmdtagre = /([#_*`]|\n==*)$/
  const match = (String(str).match(symbolre) ||
                 String(str).match(symbolunderlinere))

  return (match && match[0])
    ? [ str.replace(match[0], ''),
      match[0].split(symbol)[1].trim().replace(endmdtagre, '') ]
    : [ str ]
}

const extractsymbols = (str, obj={}, text) => (
  [ [ '★', 'title' ],
    [ '✑', 'author' ],
    [ '☆', 'excerptnohtml' ],
    [ '⌚', 'timeDate', parsedatestrtime ]
  ].reduce(([ str, obj ], [ sym, propname, filter ]) => {
    [ str, text ] = extractsymboltext(str, sym)

    if (text) {
      if (filter) {
        text = filter(text)
      }

      obj[propname] = text
    }

    return [ str, obj ]
    
  }, [ str, obj ]))

const extractmetadata = (str, metadata={}) => {
  let metaValRe = /\[meta:(.*)\]: <> \((.*)\)/gi

  if (typeof str === 'string') {
    str.replace(metaValRe, (match, m1, m2) => {
      if (/date$/i.test(m1)) {
        metadata[m1] = parsedatestrtime(m2)
      } else if (/arr$/i.test(m1)) {
        metadata[m1] = m2.split(/,/)
      } else if (/^is/.test(m1) &&
                 /true|false/g.test(m2)) {
        metadata[m1] = castas.bool(m2)
      } else {
        metadata[m1] = m2
      }
    })
  }
  
  return [ str, metadata ]
}

export default Object.assign(marked.parse, {
  parsedatestr,
  parsedatestrtime,
  extractsymboltext,
  extractsymbols,
  extractmetadata
})
