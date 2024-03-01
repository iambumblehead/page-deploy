import test from 'node:test'
import assert from 'node:assert/strict'
import pgReql from '../src/pgReql.js'

test('`orderBy` should work on array -- string', async () => {
  const { d } = pgReql()
  const result = await d
    .expr([{ a: 23 }, { a: 10 }, { a: 0 }, { a: 100 }])
    .orderBy('a')
    .run()

  assert.deepStrictEqual(result, [{ a: 0 }, { a: 10 }, { a: 23 }, { a: 100 }])
})

test('`orderBy` should work on array -- row => row', async () => {
  const { d } = pgReql()
  const result = await d
    .expr([{ a: 23 }, { a: 10 }, { a: 0 }, { a: 100 }])
    .orderBy(row => row('a'))
    .run()

  assert.deepStrictEqual(result, [{ a: 0 }, { a: 10 }, { a: 23 }, { a: 100 }])
})

test('`orderBy` should work on a table -- pk', async () => {
  const { d } = pgReql([
    ['marvel',
      { id: 'Iron Man', victories: 214 },
      { id: 'Jubilee', victories: 49 },
      { id: 'Slava', victories: 5 }]
  ])

  const result = await d
    .db('default')
    .table('marvel')
    .orderBy({ index: 'id' })
    .run()

  for (let i = 0; i < result.length - 1; i++) {
    assert.ok(result[i].id < result[i + 1].id)
  }
})

test('`orderBy` should work on a table -- secondary', async () => {
  const { d } = pgReql([
    ['marvel',
      { name: 'Iron Man', victories: 214 },
      { name: 'Jubilee', victories: 49 },
      { name: 'Slava', victories: 5 }]
  ])

  await d.table('marvel').indexCreate('name').run()
  await d.table('marvel').indexWait('name').run()

  const result = await d
    .db('default')
    .table('marvel')
    .orderBy({ index: 'name' })
    .run()

  for (let i = 0; i < result.length - 1; i++) {
    assert.ok(result[i].name < result[i + 1].name)
  }
})

test('`orderBy` should work on a two fields', async () => {
  const { d } = pgReql()
  const numDocs = 98

  await d.tableCreate('numbers').run()
  await d.table('numbers').insert(
    Array(numDocs).fill(0).map(() => ({ a: Math.random() }))
  ).run()

  const res = await d.table('numbers').orderBy('id', 'a').run()
  assert.ok(Array.isArray(res))
  assert.ok(res[0].id < res[1].id)
})

test('`orderBy` should throw if no argument has been passed', async () => {
  const { d } = pgReql([
    ['marvel',
      { name: 'Iron Man', victories: 214 },
      { name: 'Jubilee', victories: 49 },
      { name: 'Slava', victories: 5 }]
  ])

  await assert.rejects(() => (
    d.table('marvel').orderBy().run()
  ), {
    message: '`orderBy` takes at least 1 argument, 0 provided.'
  })
})

test('`orderBy` should not wrap on d.asc', async () => {
  const { d } = pgReql()
  const result = await d
    .expr([{ a: 23 }, { a: 10 }, { a: 0 }, { a: 100 }])
    .orderBy(d.asc(row => row('a')))
    .run()

  assert.deepStrictEqual(result, [{ a: 0 }, { a: 10 }, { a: 23 }, { a: 100 }])
})

test('`orderBy` should not wrap on d.desc', async () => {
  const { d } = pgReql()
  const result = await d
    .expr([{ a: 23 }, { a: 10 }, { a: 0 }, { a: 100 }])
    .orderBy(d.desc(row => row('a')))
    .run()

  assert.deepStrictEqual(result, [{ a: 100 }, { a: 23 }, { a: 10 }, { a: 0 }])
})

test('d.desc should work', async () => {
  const { d } = pgReql()
  const result = await d
    .expr([{ a: 23 }, { a: 10 }, { a: 0 }, { a: 100 }])
    .orderBy(d.desc('a'))
    .run()
  assert.deepStrictEqual(result, [{ a: 100 }, { a: 23 }, { a: 10 }, { a: 0 }])
})

test('d.asc should work', async () => {
  const { d } = pgReql()
  const result = await d
    .expr([{ a: 23 }, { a: 10 }, { a: 0 }, { a: 100 }])
    .orderBy(d.asc('a'))
    .run()

  assert.deepStrictEqual(result, [{ a: 0 }, { a: 10 }, { a: 23 }, { a: 100 }])
})

test('`desc` is not defined after a term', async () => {
  const { d } = pgReql()

  await assert.rejects(async () => (
    d.expr(1).desc('foo').run()
  ), {
    message: '.desc is not a function'
  })
})

test('`asc` is not defined after a term', async () => {
  const { d } = pgReql()

  await assert.rejects(async () => (
    d.expr(1).asc('foo').run()
  ), {
    message: '.asc is not a function'
  })
})
