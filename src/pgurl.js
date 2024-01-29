import url from 'node:url'
import path from 'node:path'

const pgurl_outputcreate = (opts, relpath) => {
  const outUrl = new url.URL(opts.outputDir, opts.metaurl)
  const keyUrl = new url.URL(relpath, outUrl)

  return keyUrl
}

const pgurl_manifestcreate = opts => (
  pgurl_outputcreate(opts, 'manifest.json'))

export {
  pgurl_manifestcreate
}
