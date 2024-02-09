import url from 'node:url'

const pgUrlOutputCreate = (opts, relpath) => {
  const outUrl = new url.URL(opts.outputDir, opts.metaurl)
  const keyUrl = new url.URL(relpath, outUrl)

  return keyUrl
}

const pgUrlManifestCreate = opts => (
  pgUrlOutputCreate(opts, 'manifest.json'))

export {
  pgUrlManifestCreate
}
