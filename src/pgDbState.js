import { randomUUID } from 'crypto'

import {
  pgDocsRefLoadAll
} from './pgDoc.js'

const pgDbStateTableCreateIndexTuple = (name, fields = [], config = {}) => (
  [name, fields, config])

const pgDbStateDbGet = (dbState, dbName) => (
  dbState.db[dbName])

const pgDbStateDbTableConfigKeyGet = (dbName, tableName) => (
  `dbConfig_${dbName}_${tableName}`)

const pgDbStateDbConfigKeyGet = dbName => (
  `dbConfig_${dbName}`)

const pgDbStateDbCreate = (state, dbName) => {
  state.dbSelected = dbName
  state[pgDbStateDbConfigKeyGet(dbName)] = {
    name: dbName,
    id: randomUUID()
  }

  state.db[dbName] = {}

  return state
}

const pgDbStateDbDrop = (state, dbName) => {
  delete state[pgDbStateDbConfigKeyGet(dbName)]
  delete state.db[dbName]

  if (state.dbSelected === dbName)
    [state.dbSelected] = Object.keys(state.db)

  return state
}

const pgDbStateCreate = opts => {
  const dbConfigList = Array.isArray(opts.dbs) ? opts.dbs : [{
    db: opts.db || 'default'
  }]

  return dbConfigList.reduce((state, s) => {
    state = pgDbStateDbCreate(state, s.db)

    return state
  }, {
    dbConnections: Array.isArray(opts.connections)
      ? opts.connections : [],
    db: {}
  })
}

const pgDbStateTableConfigGet = (dbState, dbName, tableName) => {
  const tableKey = pgDbStateDbTableConfigKeyGet(dbName, tableName)

  return dbState[tableKey]
}

const pgDbStateDbConfigGet = (dbState, dbName) => (
  dbState[pgDbStateDbConfigKeyGet(dbName) ])

const pgDbStateTableSet = (dbState, dbName, tableName, table) => {
  dbState.db[dbName][tableName] = table

  return dbState
}

const pgDbStateTableRm = (dbState, dbName, tableName) => {
  delete dbState.db[dbName][tableName]

  return dbState
}

const pgDbStateTableGet = (dbState, dbName, tableName) => (
  dbState.db[dbName][tableName])

const pgDbStateTableGetResolved = async (dbState, dbName, tableName) => {
  const db = dbState.db[dbName]
  const tableRef = db[tableName]

  return (Array.isArray(tableRef) && typeof tableRef[0] === 'string')
    ? db[tableName] = await pgDocsRefLoadAll(dbState, tableRef)
    : tableRef
}

const pgDbStateTableConfigSet = (dbState, dbName, tableName, tableConfig) => {
  const tableKey = pgDbStateDbTableConfigKeyGet(dbName, tableName)

  dbState[tableKey] = tableConfig

  return dbState
}

const pgDbStateTableConfigRm = (dbState, dbName, tableName) => {
  const tableKey = pgDbStateDbTableConfigKeyGet(dbName, tableName)

  delete dbState[tableKey]

  return dbState
}

const pgDbStateTableCreate = (dbState, dbName, tableName, config) => {
  dbState = pgDbStateTableConfigSet(dbState, dbName, tableName, {
    db: dbState.dbSelected,
    id: randomUUID(),
    durability: 'hard',
    indexes: [],
    name: tableName,
    primary_key: (config && config.primaryKey) || 'id',
    shards: [{
      primary_replica: 'replicaName',
      replicas: ['replicaName']
    }],
    write_acks: 'majority',
    write_hook: null
  })

  dbState = pgDbStateTableSet(dbState, dbName, tableName, [])

  return dbState
}

const pgDbStateTableDrop = (dbState, dbName, tableName) => {
  dbState = pgDbStateTableConfigRm(dbState, dbName, tableName)
  dbState = pgDbStateTableRm(dbState, dbName, tableName)

  return dbState
}

const pgDbStateTableGetIndexNames = (dbState, dbName, tableName) => {
  const tableConfig = pgDbStateTableConfigGet(dbState, dbName, tableName)
    
  return tableConfig ? tableConfig.indexes.map(i => i[0]) : []
}

const pgDbStateTableGetPrimaryKey = (dbState, dbName, tableName) => {
  const tableConfig = pgDbStateTableConfigGet(dbState, dbName, tableName)

  return (tableConfig && tableConfig.primary_key) || 'id'
}

const pgDbStateTableIndexExists = (db, dbName, tableName, indexName) => {
  const indexNames = pgDbStateTableGetIndexNames(db, dbName, tableName)

  return indexNames.includes(indexName)
}

const pgDbStateTableGetOrCreate = (dbState, dbName, tableName) => {
  const table = pgDbStateTableGet(dbState, dbName, tableName)
    
  if (!table)
    dbState = pgDbStateTableCreate(dbState, dbName, tableName)

  return pgDbStateTableGet(dbState, dbName, tableName)
}

// eslint-disable-next-line max-len
const pgDbStateTableIndexAdd = (cst, dbName, tableName, indexName, fields, config) => {
  pgDbStateTableGetOrCreate(cst, dbName, tableName)

  const tableConfig = pgDbStateTableConfigGet(cst, dbName, tableName)

  tableConfig.indexes.push(
    pgDbStateTableCreateIndexTuple(indexName, fields, config))

  return tableConfig
}

// by default, a tuple for primaryKey 'id' is returned,
// this should be changed. ech table config should provide a primary key
// using 'id' as the defautl for each one.
const pgDbStateTableGetIndexTuple = (dbState, dbName, tableName, indexName) => {
  const tableConfig = pgDbStateTableConfigGet(dbState, dbName, tableName)
  const indexTuple = (tableConfig && tableConfig.indexes)
        && tableConfig.indexes.find(i => i[0] === indexName)

  if (!indexTuple && indexName !== 'id'
      && indexName !== tableConfig.primary_key) {
    console.warn(`table index not found. ${tableName}, ${indexName}`)
  }

  return indexTuple || pgDbStateTableCreateIndexTuple(indexName)
}

const pgDbStateAggregate = (oldState, aggState) => (
  Object.keys(aggState).reduce((state, key) => {
    if (typeof aggState[key] === 'number') {
      if (typeof state[key] === 'undefined')
        state[key] = 0
            
      state[key] += aggState[key]
    } else if (Array.isArray(aggState[key])) {
      if (!Array.isArray(state[key]))
        state[key] = []

      state[key].push(...aggState[key])
    }

    return state
  }, oldState))

export {
  pgDbStateCreate,
  pgDbStateAggregate,
  pgDbStateDbGet,
  pgDbStateDbConfigGet,
  pgDbStateDbCreate,
  pgDbStateDbDrop,
  pgDbStateTableCreate,
  pgDbStateTableDrop,
  pgDbStateTableGet,
  pgDbStateTableGetResolved,
  pgDbStateTableSet,
  pgDbStateTableGetOrCreate,
  pgDbStateTableGetIndexNames,
  pgDbStateTableGetPrimaryKey,
  pgDbStateTableIndexAdd,
  pgDbStateTableIndexExists,
  pgDbStateTableGetIndexTuple,
  pgDbStateTableConfigGet
}
