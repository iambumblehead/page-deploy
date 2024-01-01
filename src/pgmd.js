import {Marked} from 'marked'
import {markedHighlight} from 'marked-highlight'
import hljs from 'highlight.js'
import htmldecoder from 'html-decoder'
import striphtmltags from 'strip-html-tags'

// import simpletime from 'simpletime'
import castas from 'castas'

const pgmdmarked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight (code, lang) {
      return hljs.highlight(code, {
        language: hljs.getLanguage(lang) ? lang : 'plaintext'
      }).value
    }
  })
)

const pgmdparsedatestr = datestr => (
  new Date(datestr))
  // simpletime.extractDateFormatted(datestr, fmt))

const pgmdparsedatestrtime = datestr => (
  pgmdparsedatestr(datestr).getTime())

// return [
//   str with symbol matching line removed,
//   text found after symbol (if symbol)
// ]
// 
// extractsymboltext('#★ text', '★') => ['', 'text']
// extractsymboltext('★ text\n======', '★') => ['', 'text']
//
//
const pgmdextractsymboltext = (str, symbol) => {
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

const pgmdextractsymbols = (str, obj={}, text) => (
  [ [ '★', 'title' ],
    [ '✑', 'author' ],
    [ '☆', 'excerptnohtml' ],
    [ '⌚', 'timeDate', pgmdparsedatestrtime ]
  ].reduce(([ str, obj ], [ sym, propname, filter ]) => {
    [ str, text ] = pgmdextractsymboltext(str, sym)

    if (text) {
      if (filter) {
        text = filter(text)
      }

      obj[propname] = text
    }

    return [ str, obj ]
    
  }, [ str, obj ]))

const pgmdextractmetadata = (str, metadata={}) => {
  let metaValRe = /\[meta:(.*)\]: <> \((.*)\)/gi

  if (typeof str === 'string') {
    str.replace(metaValRe, (match, m1, m2) => {
      if (/date$/i.test(m1)) {
        metadata[m1] = pgmdparsedatestrtime(m2)
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

const pgmdextractexcerpt = content => {
  const match = String(content).match(/<p>(.*)…/gi)
  const excerpt = match && match[0].slice(0, -1)

  if (excerpt) {
    content = content.replace(match[0], excerpt)
  }

  return [ content, excerpt && `${excerpt}</p>` ]
}

const pgmdparse = (filename, filestr) => {
  let metadata = {},
      content,
      excerpt

  ;[ filestr, metadata ] = pgmdextractsymbols(filestr, metadata)
  ;[ filestr, metadata ] = pgmdextractmetadata(filestr, metadata)

  content = pgmdmarked.parse(filestr)

  ;[ content, excerpt ] = pgmdextractexcerpt(content)

  metadata.content = content

  if (excerpt) {
    metadata.excerpthtml = excerpt
    metadata.excerptnohtml = htmldecoder.decode(striphtmltags(excerpt))
  }

  return metadata
}

export {
  pgmdparse as default,
  pgmdmarked,
  pgmdparsedatestr,
  pgmdparsedatestrtime,
  pgmdextractsymboltext,
  pgmdextractsymbols,
  pgmdextractmetadata,
  pgmdextractexcerpt,
  pgmdparse
}
