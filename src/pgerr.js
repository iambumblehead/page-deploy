const pgerrmddirnotfound = (opts, path) => (
  new Error(`[!!!] error: markdown directory not found, "${path}"`))

const pgerrmdfilenotfound = (opts, path) => (
  new Error(`[!!!] error: markdown file not found, "${path}"`))

const pgerrmdfileordirnotfound = (opts, path) => (
  new Error(`[!!!] error: markdown file or directory not found, "${path}"`))

export {
  pgerrmddirnotfound,
  pgerrmdfilenotfound,
  pgerrmdfileordirnotfound
}
