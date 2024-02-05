const pgErrmddirnotfound = (opts, path) => new Error(
  `[!!!] error: markdown directory not found, "${path}"`)

const pgErrmdfilenotfound = (opts, path) => new Error(
  `[!!!] error: markdown file not found, "${path}"`)

const pgErrmdfileordirnotfound = (opts, path) => new Error(
  `[!!!] error: markdown file or directory not found, "${path}"`)

const pgErrrootnochildsdefined = () => new Error(
  `[!!!] error: no childs are defined on the root node`)

const pgErrStringify = obj => JSON.stringify(obj, null, '\t')

const pgErrArgsNumber = (queryId, takes = 0, given = 1, atLeast) => new Error(
  '`:queryId` takes :takesArgs :argument, :givenArgs provided.'
    .replace(/:queryId/, queryId)
    .replace(/:argument/, takes === 1 ? 'argument' : 'arguments')
    .replace(/:takesArgs/, atLeast ? `at least ${takes}` : takes)
    .replace(/:givenArgs/, given))

const pgErrUnrecognizedOption = key => new Error(
  'Unrecognized optional argument `:key`.'
    .replace(/:key/, key))

const pgErrSecondArgumentOfQueryMustBeObject = queryType => new Error(
  'Second argument of `:queryType` must be an object.'
    .replace(/:queryType/, queryType))

const pgErrCannotUseNestedRow = () => new Error(
  'Cannot user r.row in nested queries. Use functions instead')

const pgErrNoMoreRowsInCursor = () => new Error(
  'No more rows in the cursor.')

const pgErrNoAttributeInObject = propertyName => new Error(
  'No attribute `:propertyName` in object'
    .replace(/:propertyName/, propertyName))

const pgErrExpectedTypeFOOButFoundBAR = (foo, bar) => new Error(
  `Expected type ${foo} but found ${bar}`)

const pgErrCannotCallFOOonBARTYPEvalue = (foo, bar) => new Error(
  `Cannot call ${foo} on ${bar} value.`)

export {
  pgErrmddirnotfound,
  pgErrmdfilenotfound,
  pgErrmdfileordirnotfound,
  pgErrrootnochildsdefined,
  pgErrStringify,
  pgErrArgsNumber,
  pgErrUnrecognizedOption,
  pgErrSecondArgumentOfQueryMustBeObject,
  pgErrCannotUseNestedRow,
  pgErrCannotCallFOOonBARTYPEvalue,
  pgErrNoMoreRowsInCursor,
  pgErrNoAttributeInObject,
  pgErrExpectedTypeFOOButFoundBAR
}
