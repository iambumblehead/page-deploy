const pglog = (opts, msg) => {
  if (opts.verbose > 0) {
    console.log(msg)
  }
}

const pglog_writeurl = (opts, url) => pglog(
  opts, '[mmm] write: ' + url.pathname
    .replace(process.cwd(), '.')
    .replace(process.env.HOME, '~'))

export {
  pglog as default,
  pglog_writeurl
}
