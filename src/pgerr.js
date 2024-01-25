const pgerrmddirnotfound = (opts, path) => (
  new Error(`[!!!] error: markdown directory not found, "${path}"`))

const pgerrmdfilenotfound = (opts, path) => (
  new Error(`[!!!] error: markdown file not found, "${path}"`))

const pgerrmdfileordirnotfound = (opts, path) => (
  new Error(`[!!!] error: markdown file or directory not found, "${path}"`))

const pgerrrootnochildsdefined = () => (
  new Error(`[!!!] error: no childs are defined on the root node`))

export {
  pgerrmddirnotfound,
  pgerrmdfilenotfound,
  pgerrmdfileordirnotfound,
  pgerrrootnochildsdefined
}
