import pgOpts from './pgOpts.js'
import pgChain from './pgChain.js'

import {
  pgDbStateCreate,
  pgDbStateDbCreate,
  pgDbStateTableSet,
  pgDbStateTableCreate
} from './pgDbState.js'

const buildChain = (opts, dbState = {}) => {
  const d = pgChain(Object.assign(dbState, opts))

  // make, for example, r.add callable through r.row.add
  return {
    d: Object.assign((...args) => d.expr(... args), d),
    dbState
  }
}

const buildDb = (tables, config) => {
  const dbConfig = config || pgDbStateCreate(
    (tables[0] && tables[0].db) ? tables[0] : {})
  const dbConfigTables = (tables[0] && tables[0].db)
    ? tables.slice(1)
    : tables

  return dbConfigTables.reduce((dbState, tablelist, i, arr) => {
    const tableConfig = Array.isArray(tablelist[1]) && tablelist[1]

    if (!Array.isArray(tablelist)) {
      dbState = pgDbStateDbCreate(dbState, tablelist.db)
      dbState = buildDb(arr.slice(i + 1), dbState)
      arr.splice(1)
      return dbState
    }

    dbState = pgDbStateTableCreate(
      dbState, dbState.dbSelected, tablelist[0],
      tableConfig[0])
    console.log('tablelist[0]', tablelist[0])
    dbState = pgDbStateTableSet(
      dbState, dbState.dbSelected, tablelist[0],
      tablelist.slice(tableConfig ? 2 : 1))

    return dbState
  }, dbConfig)
}

// returns [opts, tableslist]
const pgReqlArgs = (arg0, arg1) => (
  Array.isArray(arg0) ? [{}, arg0] : [arg0, arg1 || []])

export default (opts, configList) => {
  const args = pgReqlArgs(opts, configList)

  return buildChain(pgOpts(args[0]), buildDb(args[1]))
}
