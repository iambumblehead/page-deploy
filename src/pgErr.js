const pgErrDirNotFound = (opts, path) => new Error(
  `[!!!] error: markdown directory not found, "${path}"`)

const pgErrFileNotFound = (opts, path) => new Error(
  `[!!!] error: markdown file not found, "${path}"`)

const pgErrFileOrDirNotFound = (opts, path) => new Error(
  `[!!!] error: markdown file or directory not found, "${path}"`)

const pgErrDocIncompatibleFile = url => new Error(
  `[!!!] error: incompatible doc file, "${url.href}"`)

const pgErrMdDirNotFound = (opts, path) => new Error(
  `[!!!] error: markdown directory not found, "${path}"`)

const pgErrMdFileNotFound = (opts, path) => new Error(
  `[!!!] error: markdown file not found, "${path}"`)

const pgErrMdFileOrDirNotFound = (opts, path) => new Error(
  `[!!!] error: markdown file or directory not found, "${path}"`)

const pgErrRootNoChildsDefined = () => new Error(
  `[!!!] error: no childs are defined on the root node`)

const pgErrStringify = obj => JSON.stringify(obj, null, '\t')

const pgErrInvalidTableName = tableName => new Error(
  'Table name `:tableName` invalid (Use A-Z, a-z, 0-9, _ and - only)'
    .replace(/:tableName/, tableName))

const pgErrInvalidDbName = dbName => new Error(
  'Database name `:dbName` invalid (Use A-Z, a-z, 0-9, _ and - only)'
    .replace(/:dbName/, dbName))

const pgErrTableExists = (dbName, tableName) => new Error(
  'Table `:tableName` already exists.'
    .replace(/:tableName/, [dbName, tableName].join('.')))

const pgErrTableDoesNotExist = (dbName, tableName) => new Error(
  'Table `:tableName` does not exist.'
    .replace(/:tableName/, [dbName, tableName].join('.')))

const pgErrDuplicatePrimaryKey = (existingDoc, conflictDoc) => new Error (
  'Duplicate primary key `id`:\n :existingDoc\n:conflictDoc'
    .replace(/:existingDoc/, pgErrStringify(existingDoc))
    .replace(/:conflictDoc/, pgErrStringify(conflictDoc)))

const pgErrPrimaryKeyWrongType = primaryKey => new Error(
  ('Primary keys must be either a'
   + ' number, string, bool, pseudotype or array (got type :type)')
    .replace(/:type/, String(typeof primaryKey).toUpperCase()))

const pgErrPrimaryKeyCannotBeChanged = primaryKeyVal => new Error(
  'Primary key `:primaryKeyVal` cannot be changed'
    .replace(/:primaryKeyVal/, primaryKeyVal))

const pgErrArgsNumber = (queryId, takes = 0, given = 1, atLeast) => new Error(
  '`:queryId` takes :takesArgs :argument, :givenArgs provided.'
    .replace(/:queryId/, queryId)
    .replace(/:argument/, takes === 1 ? 'argument' : 'arguments')
    .replace(/:takesArgs/, atLeast ? `at least ${takes}` : takes)
    .replace(/:givenArgs/, given))

const pgErrIndexOutOfBounds = idx => new Error(
  `ReqlNonExistanceError: Index out of bounds: ${idx}`)

const pgErrUnRecognizedOption = key => new Error(
  'Unrecognized optional argument `:key`.'
    .replace(/:key/, key))

const pgErrSecondArgumentOfQueryMustBeObject = queryType => new Error(
  'Second argument of `:queryType` must be an object.'
    .replace(/:queryType/, queryType))

const pgErrCannotUseNestedRow = () => new Error(
  'Cannot use d.row in nested queries. Use functions instead')

const pgErrNoMoreRowsInCursor = () => new Error(
  'No more rows in the cursor.')

const pgErrNoAttributeInObject = propertyName => new Error(
  'No attribute `:propertyName` in object'
    .replace(/:propertyName/, propertyName))

const pgErrExpectedTypeFOOButFoundBAR = (foo, bar) => new Error(
  `Expected type ${foo} but found ${bar}`)

const pgErrCannotCallFOOonBARTYPEvalue = (foo, bar) => new Error(
  `Cannot call ${foo} on ${bar} value.`)

const pgErrNotATIMEpsuedotype = () => new Error(
  'Not a TIME pseudotype: `null`')

const pgErrUnrecognizedOption = key => new Error(
  'Unrecognized optional argument `:key`.'
    .replace(/:key/, key))

const pgErrCannotReduceOverEmptyStream = () => new Error(
  `Cannot reduce over an empty stream.`)

export {
  pgErrDirNotFound,
  pgErrFileNotFound,
  pgErrFileOrDirNotFound,
  pgErrDocIncompatibleFile,
  pgErrMdDirNotFound,
  pgErrMdFileNotFound,
  pgErrMdFileOrDirNotFound,
  pgErrRootNoChildsDefined,
  pgErrStringify,
  pgErrArgsNumber,
  pgErrUnRecognizedOption,
  pgErrSecondArgumentOfQueryMustBeObject,
  pgErrCannotUseNestedRow,
  pgErrCannotCallFOOonBARTYPEvalue,
  pgErrNoMoreRowsInCursor,
  pgErrNoAttributeInObject,
  pgErrExpectedTypeFOOButFoundBAR,
  pgErrIndexOutOfBounds,
  pgErrInvalidTableName,
  pgErrInvalidDbName,
  pgErrTableExists,
  pgErrTableDoesNotExist,
  pgErrDuplicatePrimaryKey,
  pgErrPrimaryKeyWrongType,
  pgErrPrimaryKeyCannotBeChanged,
  pgErrCannotReduceOverEmptyStream,
  pgErrNotATIMEpsuedotype,
  pgErrUnrecognizedOption
}
