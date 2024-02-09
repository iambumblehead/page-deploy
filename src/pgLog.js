const pgLog = (opts, msg) => {
  if (opts.verbose > 0) {
    console.log(msg)
  }
}

const pgLogWriteUrl = (opts, url) => pgLog(
  opts, '[mmm] write: ' + url.pathname
    .replace(process.cwd(), '.')
    .replace(process.env.HOME, '~'))

export {
  pgLog as default,
  pgLogWriteUrl
}
