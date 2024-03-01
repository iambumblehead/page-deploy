import test from 'node:test'
import assert from 'node:assert/strict'
import pgReql from '../src/pgReql.js'

test('`reduce` should work -- no base ', async () => {
  const { d } = pgReql()
  const result1 = await d
    .expr([1, 2, 3])
    .reduce((left, right) => left.add(right))
    .run()

  assert.strictEqual(result1, 6)
})

test('`reduce` should throw if no argument has been passed', async () => {
  const dbName = 'dbName'
  const tableName = 'tableName'
  const { d } = pgReql([
    { db: dbName }, [tableName, { id: 'id' }]
  ])

  await assert.rejects(async () => (
    d.db(dbName).table(tableName).reduce().run()
  ), {
    message: '`reduce` takes 1 argument, 0 provided.'
  })
})

test('`reduce` should throw if empty stream', async () => {
  const { d } = pgReql()
  await assert.rejects(async () => d.expr([]).reduce(l => l).run(), {
    message: 'Cannot reduce over an empty stream.'
  })
})

test('`reduce` should return lone atom if one element only', async () => {
  const { d } = pgReql()
  
  assert.strictEqual(await d.expr([5]).reduce(l => l.add(3)).run(), 5)
})

test('`reduce` should handle deeply nested math row query', async () => {
  const dbName = 'dbName'
  const tableName = 'tableName'
  const { d } = pgReql([
    { db: dbName },
    [tableName,
      { id: 1, count: 1 },
      { id: 2, count: 2 },
      { id: 3, count: 3 }]
  ])

  const result1 = await d
    .db(dbName)
    .table(tableName)
    .reduce((left, right) => d.branch(
      right('count').ge(left('count')), right, left))
    .run()

  assert.deepEqual(result1, { id: 3, count: 3 })
})

test('`fold` should work', async () => {
  const { d } = pgReql()
  const result = await d
    .expr([1, 2, 3])
    .fold(10, (left, right) => left.add(right))
    .run()

  assert.strictEqual(result, 16)
})

test('`fold` should throw if no argument has been passed', async () => {
  const dbName = 'dbName'
  const tableName = 'tableName'
  const { d } = pgReql([
    { db: dbName }, [tableName, { id: 'id' }]
  ])

  await assert.rejects(async () => (
    d.db(dbName).table(tableName).fold().run()
  ), {
    message: '`fold` takes 2 arguments, 0 provided.'
  })
})

test('`distinct` should work', async () => {
  const { d } = pgReql()
  const result = await d
    .expr([1, 2, 3, 1, 2, 1, 3, 2, 2, 1, 4])
    .distinct()
    .orderBy(row => row)
    .run()

  assert.deepEqual(result, [1, 2, 3, 4])
})

test('`r.distinct` should work', async () => {
  const { d } = pgReql()
  const result = await d
    .distinct([1, 2, 3, 1, 2, 1, 3, 2, 2, 1, 4])
    .orderBy(row => row)
    .run()

  assert.deepEqual(result, [1, 2, 3, 4])
})

test('`distinct` should work with an index', async () => {
  const { d } = pgReql([
    { db: 'jobrunner' },
    ['JobEvents', {
      jobId: 1,
      name: 'job1'
    },{
      jobId: 2,
      name: 'job2'
    },{
      jobId: 1,
      name: 'job1-log'
    }]
  ])

  await d.db('jobrunner').table('JobEvents').indexCreate('jobId').run()
    
  const result = await d
    .db('jobrunner')
    .table('JobEvents')
    .distinct({ index: 'jobId' })
    .count()
    .run()

  assert.strictEqual(result, 2)
})
