import test from 'node:test'
import assert from 'node:assert/strict'
import pgReql from '../src/pgReql.js'

const insertTestRooms = async r => r
  .db('default')
  .table('Rooms')
  .insert([{ val: 1 }, { val: 2 }, { val: 3 }])
  .run()

test('`eqJoin` should return -- pk -- array-stream - function', async () => {
  const { d } = pgReql([['Rooms']])

  const roomInsert = await insertTestRooms(d)
  const pks = roomInsert.generated_keys

  const result = await d
    .expr(pks)
    .eqJoin(
      elem => elem, d.db('default').table('Rooms'))
    .run()

  assert.strictEqual(result.length, 3)
  assert.ok(result[0].left)
  assert.ok(result[0].right)
  assert.ok(result[1].left)
  assert.ok(result[1].right)
  assert.ok(result[2].left)
  assert.ok(result[2].right)
})

test('`eqJoin` should return -- pk -- array-stream - row => row', async () => {
  const { d } = pgReql([['Rooms']])

  const roomInsert = await insertTestRooms(d)
  const pks = roomInsert.generated_keys

  const result = await d
    .expr(pks)
    .eqJoin(row => row, d.db('default').table('Rooms'))
    .run()

  assert.strictEqual(result.length, 3)
  assert.ok(result[0].left)
  assert.ok(result[0].right)
  assert.ok(result[1].left)
  assert.ok(result[1].right)
  assert.ok(result[2].left)
  assert.ok(result[2].right)
})

test('`eqJoin` should return pk, sec idx, arr-stream, row => row', async () => {
  const { d } = pgReql([['Rooms']])

  await insertTestRooms(d)

  // verified with live test...
  const result = await d
    .expr([1, 2, 3])
    .eqJoin(row => row, d.db('default').table('Rooms'), { index: 'val' })
    .run()

  assert.strictEqual(result.length, 3)
  assert.ok(result[0].left)
  assert.ok(result[0].right)
  assert.ok(result[1].left)
  assert.ok(result[1].right)
  assert.ok(result[2].left)
  assert.ok(result[2].right)
})

test('`eqJoin` should throw if no argument', async () => {
  const { d } = pgReql([['Rooms']])

  await assert.rejects(() => (d
    .expr([1, 2, 3])
    .eqJoin()
    .run()
  ), {
    message: '`eqJoin` takes at least 2 arguments, 0 provided.'
  })
})

test('`eqJoin` should throw with a non valid key', async () => {
  const { d } = pgReql([['Rooms']])

  await assert.rejects(() => (d
    .expr([1, 2, 3])
    .eqJoin(row => row, d.db('default').table('Rooms'), {
      nonValidKey: 'val'
    })
    .run()
  ), {
    message: 'Unrecognized optional argument `nonValidKey`.'
  })
})

test('`zip` should throw with a non valid key', async () => {
  const { d } = pgReql([['Rooms']])

  const roomInsert = await insertTestRooms(d)
  const pks = roomInsert.generated_keys

  const result = await d
    .expr(pks)
    .eqJoin(doc => doc, d.db('default').table('Rooms'))
    .zip()
    .run()

  assert.strictEqual(result.length, 3)
  assert.strictEqual(result[0].left, undefined)
})
