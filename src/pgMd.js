import {Marked} from 'marked'
import {markedHighlight} from 'marked-highlight'
import hljs from 'highlight.js'
import htmldecoder from 'html-decoder'
import striphtmltags from 'strip-html-tags'

// (tries to) pick up first match inside <p> tag that includes '…',
// with no inner opening or closing <p> tags,
const htmlParagraphExcerptRe = /(?<=<p>)(?:(?!<p>)[^…])+…/u

const metaFieldRe = /\[meta:(.*)\]: <> [\(|"](.*)[\)|"]/g
const metaFieldNameIsDateRe = /[dD]ate$/
const metaFieldNameIsArrRe = /[aA]rr|[lL]ist$/
const metaFieldNameIsBoolRe = /^is/
const metaFieldValIsBoolRe = /^([Tt]rue|[Ff]alse)$/
const metaFieldValIsBoolTrueRe = /^[Tt]rue$/
const metaFieldValIsArrRe = /, ?/

// any following underline '====' or '----' is captured, removed
const metaTitle = ['title', [
  '★', /(^|\n)[#_*`]?★ ([^_*`\n]*)[_*`]?(\n[=-]*)?/iu]]
const metaTimeDate = ['timedate', [
  '⌚', /(^|\n)[#_*`]?⌚ ([^_*`\n]*)[_*`]?/iu]]
const metaAuthor = ['author', [
  '✑', /(^|\n)[#_*`]?✑ ([^_*`]*)[_*`]?/iu]]
const metaExcerpt = ['excerptnohtml', [
  '☆', /(^|\n)[#_*`]?☆ ([^_*`]*)[_*`]?/iu]]
const metaInlineItems = [
  metaTimeDate,
  metaTitle,
  metaAuthor,
  metaExcerpt
]

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

const pgmdmetaextractinline = (mdstr, metaTuple) => {
  const metaname = metaTuple[0]
  const metasymbol = metaTuple[1][0]
  const metare = metaTuple[1][1]
  const mdstrmatch = mdstr.match(metare)

  if (!mdstrmatch)
    return [mdstr]

  const matchouter = mdstrmatch[0]
  const matchinner = mdstrmatch[2]
  const position = mdstrmatch.index
  const mdstrfiltered = mdstr.slice(0, position)
        + mdstr.slice(position + matchouter.length)
  
  return [mdstrfiltered, metaname, matchinner]
}

const pgmdmetafieldvaluecase = (fieldname, fieldvalue) => {
  if (metaFieldNameIsDateRe.test(fieldname)) {
    fieldvalue = new Date(fieldvalue).getTime()
  } else if (metaFieldNameIsArrRe.test(fieldname)) {
    fieldvalue = fieldvalue.split(metaFieldValIsArrRe)
  } else if (metaFieldNameIsBoolRe.test(fieldname) &&
             metaFieldValIsBoolRe.test(fieldvalue)) {
    fieldvalue = metaFieldValIsBoolTrueRe.test(fieldvalue)
  }

  return fieldvalue
}

const pgmdmetaextractfields = (str, metadata={}) => {
  if (typeof str !== 'string')
    return [ str, metadata ]

  str.replace(metaFieldRe, (match, m1, m2) => {
    metadata[m1] = pgmdmetafieldvaluecase(m1, m2)
  })
  
  return [ str, metadata ]
}

const pgmdextractexcerpt = content => {
  const match = String(content).match(htmlParagraphExcerptRe)
  const excerpt = match && match[0].slice(0, -1)

  if (excerpt) {
    content = content.slice(0, match.index + match[0].length - 1) +
      content.slice(match.index + match[0].length)
  }

  return [ content, excerpt ]
}

const pgMdParseFields = filestr => {
  const [content, metadata] = pgmdmetaextractfields(filestr, {})

  // returns [content, metadata]
  return metaInlineItems.reduce((acc, item) => {
    const res = pgmdmetaextractinline(acc[0], item)
    if (res[1]) {
      acc[1][res[1]] = pgmdmetafieldvaluecase(res[1], res[2])
      acc[0] = res[0]
    }

    return acc
  }, [content, metadata])
}

const pgMdParseContents = (filestr, metadata = {}) => {
  const [content, excerpt] = pgmdextractexcerpt(pgmdmarked.parse(filestr))

  metadata.content = content
  if (excerpt) {
    metadata.excerpthtml = excerpt
    metadata.excerptnohtml = htmldecoder.decode(striphtmltags(excerpt))
  }
  
  return metadata  
}

const pgMdParse = (filename, filestr) => {
  const parsedFields = pgMdParseFields(filestr)
  const parsedFieldsContent = parsedFields[0]
  const parsedFieldsMetadata = parsedFields[1]

  return pgMdParseContents(parsedFieldsContent, parsedFieldsMetadata)
}

export {
  pgMdParse as default,
  pgMdParseFields,

  metaTimeDate,
  metaTitle,
  metaAuthor,
  metaExcerpt,
  metaInlineItems,
  
  pgmdmarked,
  pgmdextractexcerpt,
  pgMdParse,
  pgmdmetaextractinline,
  pgmdmetaextractfields
}
