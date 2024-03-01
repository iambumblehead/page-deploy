import test from 'node:test'
import assert from 'node:assert/strict'
import pgReql from '../src/pgReql.js'

test('`without` should work', async () => {
  const { d } = pgReql()
  const result1 = await d
    .expr({ a: 0, b: 1, c: 2 })
    .without('c')
    .run()

  assert.deepStrictEqual(result1, { a: 0, b: 1 })

  const result2 = await d
    .expr([{ a: 0, b: 1, c: 2 }, { a: 0, b: 10, c: 20 }])
    .without('a', 'c')
    .run()

  assert.deepStrictEqual(result2, [{ b: 1 }, { b: 10 }])
})

test('`without` should throw if no argument has been passed', async () => {
  const { d } = pgReql([['Rooms']])
    
  await assert.rejects(async () => (d
    .table('Rooms')
    .without()
    .run()
  ), {
    message: '`without` takes 1 argument, 0 provided.'
  })
})

test('`prepend` should work', async () => {
  const { d } = pgReql()

  const result = await d
    .expr([1, 2, 3])
    .prepend(4)
    .run()

  assert.deepStrictEqual(result, [4, 1, 2, 3])
})

test('`prepend` should throw if now argument has been passed', async () => {
  const { d } = pgReql()

  await assert.rejects(() => (d
    .expr([1, 2, 3])
    .prepend()
    .run()
  ), {
    message: '`prepend` takes 1 argument, 0 provided.'
  })
})

test('`difference` should work', async () => {
  const { d } = pgReql()

  const result = await d
    .expr([1, 2, 3])
    .difference([2])
    .run()

  assert.deepStrictEqual(result, [1, 3])
})

test('`difference` should throw if now argument has been passed', async () => {
  const { d } = pgReql()

  await assert.rejects(() => (d
    .expr([1, 2, 3])
    .difference()
    .run()
  ), {
    message: '`difference` takes 1 argument, 0 provided.'
  })
})

test('`difference` should work with table names', async () => {
  const { d } = pgReql([['Rooms']])

  const result = await d(['Rooms', 'Users'])
    .difference(d.db('default').tableList())
    .run()

  assert.deepStrictEqual(result, ['Users'])
})

test('`getField` should work', async () => {
  const { d } = pgReql()

  assert.strictEqual(await d.expr({ a: 0, b: 1 })('a').run(), 0)
  assert.strictEqual(await d.expr({ a: 0, b: 1 }).getField('a').run(), 0)
  assert.deepStrictEqual(
    await d.expr([{ a: 0, b: 1 }, { a: 1 }])('a').run(),
    [0, 1])
})

test('`(...)` should throw if no argument has been passed', async () => {
  const { d } = pgReql([['Rooms']])

  await assert.rejects(async () => d.table('Rooms')().run(), {
    message: '`(...)` takes 1 argument, 0 provided.'
  })
})

test('`getField` should throw if no argument has been passed', async () => {
  const { d } = pgReql([['Rooms']])

  await assert.rejects(() => d.table('Rooms').getField().run(), {
    message: '`(...)` takes 1 argument, 0 provided.'
  })
})

test('`merge` should work', async () => {
  const { d } = pgReql()
  let result

  result = await d
    .expr({ a: 0 })
    .merge({ b: 1 })
    .run()

  assert.deepStrictEqual(result, { a: 0, b: 1 })

  result = await d
    .expr([{ a: 0 }, { a: 1 }, { a: 2 }])
    .merge({ b: 1 })
    .run()

  assert.deepStrictEqual(
    result,
    [{ a: 0, b: 1 }, { a: 1, b: 1 }, { a: 2, b: 1 }])

  result = await d
    .expr({ a: 0, c: { l: 'tt' } })
    .merge({ b: { c: { d: { e: 'fff' } }, k: 'pp' } })
    .run()

  assert.deepStrictEqual(result, {
    a: 0,
    b: { c: { d: { e: 'fff' } }, k: 'pp' },
    c: { l: 'tt' }
  })

  result = await d
    .expr({ a: 1 })
    .merge({ date: d.now() })
    .run()

  assert.strictEqual(result.a, 1)
  assert.ok(result.date instanceof Date)

  result = await d
    .expr({ a: 1 })
    .merge(row => ({ nested: row }), { b: 2 })
    .run()
  assert.deepStrictEqual(result, { a: 1, nested: { a: 1 }, b: 2 })
})

test('`merge` should take an anonymous function', async () => {
  const { d } = pgReql()
    
  const result = await d
    .expr({ a: 0 })
    .merge(doc => ({ b: doc('a').add(1) }))
    .run()

  assert.deepStrictEqual(result, { a: 0, b: 1 })
})

test('`merge` should map an anonymous function against a list', async () => {
  const { d } = pgReql()
    
  const result = await d
    .expr([{ a: 0 }, { a: 1 }, { a: 2 }])
    .merge(doc => ({ b: doc('a').add(1) }))
    .run()

  assert.deepStrictEqual(
    result,
    [{ a: 0, b: 1 }, { a: 1, b: 2 }, { a: 2, b: 3 }])
})

test('`merge` should throw if no argument has been passed', async () => {
  const { d } = pgReql()
  await assert.rejects(() => (d
    .expr([])
    .merge()
    .run()
  ), {
    message: '`merge` takes at least 1 argument, 0 provided.'
  })
})

test('`object` should work', async () => {
  const { d } = pgReql()
  const result = await d.object('a', 1, d.expr('2'), 'foo').run()

  assert.deepStrictEqual(result, { a: 1, 2: 'foo' })
})
