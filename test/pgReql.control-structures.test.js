import test from 'node:test'
import assert from 'node:assert/strict'
import pgReql from '../src/pgReql.js'

test('`do` should work', async () => {
  const { d } = pgReql()

  const result = await d
    .expr({ a: 1 })
    .do(doc => doc('a'))
    .run()

  assert.strictEqual(result, 1)
})

test('`r.do` should work', async () => {
  const { d } = pgReql()

  const result1 = await d
    .do(1, 2, a => a) // 'b' is second param
    .run()

  assert.strictEqual(result1, 1)

  const result2 = await d
    .do(1, 2, (a, b) => b)
    .run()

  assert.strictEqual(result2, 2)

  const result3 = await d.do(3).run()
  assert.strictEqual(result3 , 3)

  const result4 = await d
    .expr(4)
    .do()
    .run()
  assert.strictEqual(result4, 4)

  const result5 = await d.do(1, 2).run()
  assert.strictEqual(result5, 2)

  const result6 = await d
    .do(d.args([d.expr(3), d.expr(4)]))
    .run()

  assert.strictEqual(result6, 3)
})

test('`forEach` should work', async () => {
  const { d } = pgReql()
  const dbName = 'testdb'
  const tableName = 'testtable'
  let result

  result = await d.dbCreate(dbName).run()
  assert.strictEqual(result.dbs_created, 1)

  result = await d
    .db(dbName)
    .tableCreate(tableName)
    .run()

  assert.strictEqual(result.tables_created, 1)

  result = await d
    .expr([{ foo: 'bar' }, { foo: 'foo' }])
    .forEach(doc => d.db(dbName).table(tableName).insert(doc))
    .run()

  assert.strictEqual(result.inserted, 2)
})

test('`forEach` should throw if not given a function', async () => {
  const { d } = pgReql([{ db: 'cmdb' }])
  await assert.rejects(() => (
    d.expr([{ foo: 'bar' }, { foo: 'foo' }]).forEach().run()
  ), {
    message: '`forEach` takes 1 argument, 0 provided.'
  })
})
