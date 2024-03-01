import test from 'node:test'
import assert from 'node:assert/strict'
import pgReql from '../src/pgReql.js'

test('`tableList` should return a cursor', async () => {
  const { d } = pgReql([['Rooms']])

  const result = await d
    .db('default')
    .tableList()
    .run()

  assert.ok(Array.isArray(result))
  assert.deepStrictEqual(result, ['Rooms'])
})

test('`tableList` should show the table we created', async () => {
  const { d, dbState } = pgReql([['Rooms']])

  const tableCreateRes = await d
    .db('default')
    .tableCreate('thenewtable')
    .run()

  assert.deepStrictEqual(tableCreateRes, {
    tables_created: 1,
    config_changes: [{
      new_val: {
        db: 'default',
        durability: 'hard',
        id: dbState.dbConfig_default_thenewtable.id,
        indexes: [],
        name: 'thenewtable',
        primary_key: 'id',
        shards: [{
          primary_replica: 'replicaName',
          replicas: [
            'replicaName'
          ]
        }],
        write_acks: 'majority',
        write_hook: null
      },
      old_val: null
    }]
  })
    
  const result2 = await d
    .db('default')
    .tableList()
    .run()

  assert.ok(Array.isArray(result2))
  assert.ok(result2.some(name => name === 'thenewtable'))
})

test('`tableCreate` should create a table -- primaryKey', async () => {
  const { d, dbState } = pgReql([['Rooms']])
  const tableCreateRes = await d
    .db('default')
    .tableCreate('thenewtable', { primaryKey: 'foo' })
    .run()

  assert.deepStrictEqual(tableCreateRes, {
    tables_created: 1,
    config_changes: [{
      new_val: {
        db: 'default',
        durability: 'hard',
        id: dbState.dbConfig_default_thenewtable.id,
        indexes: [],
        name: 'thenewtable',
        primary_key: 'foo',
        shards: [{
          primary_replica: 'replicaName',
          replicas: [
            'replicaName'
          ]
        }],
        write_acks: 'majority',
        write_hook: null
      },
      old_val: null
    }]
  })

  const infoRes = await d
    .db('default')
    .table('thenewtable')
    .info()
    .run()

  assert.deepStrictEqual(infoRes, {
    db: {
      ...dbState.dbConfig_default,
      type: 'DB'
    },
    doc_count_estimates: [0],
    id: dbState.dbConfig_default_thenewtable.id,
    indexes: [],
    name: 'thenewtable',
    primary_key: 'foo',
    type: 'TABLE'
  })

  assert.ok(await d
    .db('default')
    .table('thenewtable')
    .info()('primary_key')
    .eq('foo')
    .run())
})

test('`tableCreate` should throw if table exists', async () => {
  const { d } = pgReql([['Rooms']])

  await assert.rejects(async () => (
    d.db('default').tableCreate('Rooms').run()
  ), {
    message: 'Table `default.Rooms` already exists.'
  })
})

test('`tableCreate` should throw -- non valid args', async () => {
  const { d } = pgReql()

  await assert.rejects(async () => (
    d.db('default').tableCreate('thetablename', { nonValidArg: true }).run()
  ), {
    message: 'Unrecognized optional argument `nonValidArg`.'
  })
})

test('`tableCreate` should throw if no argument is given', async () => {
  const { d } = pgReql()

  await assert.rejects(async () => (
    d.db('default').tableCreate().run()
  ), {
    message: '`d.tableCreate` takes at least 1 argument, 0 provided.'
  })
})

test('`tableCreate` should throw if name contains special char', async () => {
  const { d } = pgReql()

  await assert.rejects(async () => (
    d.db('default').tableCreate('^_-').run()
  ), {
    message: 'Table name `^_-` invalid (Use A-Z, a-z, 0-9, _ and - only)'
  })
})

test('`tableDrop` should drop a table', async () => {
  const { d, dbState } = pgReql([['Rooms']])

  const tableCreateRes = await d
    .db('default')
    .tableCreate('thenewtable', { primaryKey: 'foo' })
    .run()

  assert.strictEqual(tableCreateRes.tables_created, 1)

  const tableListRes = await d
    .db('default')
    .tableList()
    .run()

  assert.deepStrictEqual(tableListRes, ['Rooms', 'thenewtable'])

  const thenewtableid = dbState.dbConfig_default_thenewtable.id

  const tableDropRes = await d
    .db('default')
    .tableDrop('thenewtable')
    .run()

  assert.deepStrictEqual(tableDropRes, {
    tables_dropped: 1,
    config_changes: [{
      new_val: null,
      old_val: {
        db: 'default',
        durability: 'hard',
        id: thenewtableid,
        indexes: [],
        name: 'thenewtable',
        primary_key: 'foo',
        shards: [{
          primary_replica: 'replicaName',
          replicas: ['replicaName']
        }],
        write_acks: 'majority',
        write_hook: null
      }
    }]
  })

  const tableListRes2 = await d
    .db('default')
    .tableList()
    .run()

  assert.deepStrictEqual(tableListRes2, ['Rooms'])
})

test('`indexCreate` should work nested values', async () => {
  const { d } = pgReql([['Applications', {
    name: 'testapp',
    tokens: [{
      created_at: new Date(),
      creator_id: 'creatorId-1234',
      value: 'ce1wzwq'
    }, {
      created_at: new Date(),
      creator_id: 'creatorId-5678',
      value: '7ljYP1v'
    }]
  }]])

  await d
    .table('Applications')
    .indexList()
    .contains('tokens')
    .or(d.table('Applications').indexCreate(
      'tokens', d.row('tokens').map(token => token('value')), { multi: true })
    ).run()

  await d.table('Applications').indexWait().run()

  const apps = await d
    .table('Applications')
    .getAll('7ljYP1v', { index: 'tokens' })
    .run()

  assert.strictEqual(apps[0].name, 'testapp')
})

test('`indexCreate` should work with official doc example', async () => {
  const { d } = pgReql([['friends', {
    id: 'fred',
    hobbies: ['cars', 'drawing'],
    sports: ['soccer', 'baseball']
  }]])

  await d.table('friends').indexCreate(
    'activities', row => row('hobbies').add(row('sports')), { multi: true }
  ).run()

  await d.table('friends').indexWait().run()
  const favorites = await d
    .table('friends')
    .getAll('baseball', { index: 'activities' })
    .run()

  assert.deepStrictEqual(favorites, [{
    id: 'fred',
    hobbies: ['cars', 'drawing'],
    sports: ['soccer', 'baseball']
  }])
})

test('`indexCreate` should work with basic index and multi ', async () => {
  const { d } = pgReql([
    ['testtable',
      { foo: ['bar1', 'bar2'], buzz: 1 },
      { foo: ['bar1', 'bar3'], buzz: 2 }
    ]])

  const result = await d
    .db('default')
    .table('testtable')
    .indexCreate('foo', { multi: true })
    .run()
  assert.deepStrictEqual(result, { created: 1 })

  const result3 = await d
    .db('default')
    .table('testtable')
    .getAll('bar1', { index: 'foo' })
    .count()
    .run()
  assert.strictEqual(result3, 2)

  const result6 = await d
    .db('default')
    .table('testtable')
    .getAll('bar2', { index: 'foo' })
    .count()
    .run()
  assert.strictEqual(result6, 1)

  const result9 = await d
    .db('default')
    .table('testtable')
    .getAll('bar3', { index: 'foo' })
    .count()
    .run()
  assert.strictEqual(result9, 1)
})

test('`indexCreate` should work with options', async () => {
  const { d } = pgReql([
    ['testtable',
      { foo: ['bar1', 'bar2'], buzz: 1 },
      { foo: ['bar1', 'bar3'], buzz: 2 }
    ]])

  let result = await d
    .db('default')
    .table('testtable')
    .indexCreate('foo1', row => row('foo'), { multi: true })
    .run()
  assert.deepStrictEqual(result, { created: 1 })

  result = await d
    .db('default')
    .table('testtable')
    .indexCreate('foo2', doc => doc('foo'), { multi: true })
    .run()
  assert.deepStrictEqual(result, { created: 1 })

  const result4 = await d
    .db('default')
    .table('testtable')
    .getAll('bar1', { index: 'foo1' })
    .count()
    .run()
  assert.strictEqual(result4, 2)
  const result5 = await d
    .db('default')
    .table('testtable')
    .getAll('bar1', { index: 'foo2' })
    .count()
    .run()
  assert.strictEqual(result5, 2)

  const result7 = await d
    .db('default')
    .table('testtable')
    .getAll('bar2', { index: 'foo1' })
    .count()
    .run()
  assert.strictEqual(result7, 1)
  const result8 = await d
    .db('default')
    .table('testtable')
    .getAll('bar2', { index: 'foo2' })
    .count()
    .run()
  assert.strictEqual(result8, 1)

  const result10 = await d
    .db('default')
    .table('testtable')
    .getAll('bar3', { index: 'foo1' })
    .count()
    .run()
  assert.strictEqual(result10, 1)
  const result11 = await d
    .db('default')
    .table('testtable')
    .getAll('bar3', { index: 'foo2' })
    .count()
    .run()
  assert.strictEqual(result11, 1)
})

test('`indexCreate` should work with wrapped array', async () => {
  const { d } = pgReql([
    ['testtable',
      { foo: ['bar1', 'bar2'], buzz: 1 },
      { foo: ['bar1', 'bar3'], buzz: 2 }
    ]])

  const result12 = await d
    .db('default')
    .table('testtable')
    .indexCreate('buzz', row => [row('buzz')])
    .run()
  assert.deepStrictEqual(result12, { created: 1 })

  await d
    .db('default')
    .table('testtable')
    .indexWait()
    .run()

  const result13 = await d
    .db('default')
    .table('testtable')
    .getAll([1], { index: 'buzz' })
    .count()
    .run()
  assert.strictEqual(result13, 1)
})
