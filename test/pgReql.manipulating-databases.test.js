import test from 'node:test'
import assert from 'node:assert/strict'
import pgReql from '../src/pgReql.js'

test('`expr` should work', async () => {
  const { d } = pgReql()
    
  const result = await d.expr(1).run()
  assert.strictEqual(result, 1)
})

test('`dbList` should return a cursor', async () => {
  const { d } = pgReql()
  const result = await d.dbList().run()

  assert.ok(Array.isArray(result))
})

test('`dbCreate` should create a database', async () => {
  const { d } = pgReql()
  const dbName = 'dbName'

  const result = await d.dbCreate(dbName).run()
  assert.strictEqual(result.dbs_created, 1)
})

test('`dbCreate` should throw if no argument is given', async () => {
  const { d } = pgReql()    

  await assert.rejects(async () => (
    d.dbCreate().run()
  ), {
    message: '`d.dbCreate` takes 1 argument, 0 provided.'
  })
})

// test( '`dbCreate` is not defined after a term', async () => {
//     const { d } = pgReql();    
//     await t.throws( () => (
//         d.expr( 1 ).dbCreate().run()
//     ), {
//         messageendsWith: '.db is not a function'
//     });
// });

test('`db` should throw is the name contains special char', async () => {
  const { d } = pgReql()    

  await assert.rejects(async () => (
    d.db('*_*').run()
  ), {
    message: 'Database name `*_*` invalid (Use A-Z, a-z, 0-9, _ and - only)'
  })
})

test('`dbList` should show the database we created ("default" db always created)', async () => {
  const { d } = pgReql()
  const dbName = 'dbName' // export to the global scope

  const result1 = await d.dbCreate(dbName).run()
  assert.strictEqual(result1.dbs_created, 1)

  const result2 = await d.dbList().run()

  assert.deepStrictEqual(result2, ['default', dbName])
})

test('`dbDrop` should drop a table', async () => {
  const { d } = pgReql()
  const dbName = 'dbName'

  let result = await d.dbCreate(dbName).run()
  assert.strictEqual(result.dbs_created, 1)

  result = await d.dbDrop(dbName).run()
  assert.strictEqual(result.dbs_dropped, 1)
})

test('`dbDrop` should throw if given too many arguments', async () => {
  const { d } = pgReql()    

  await assert.rejects(async () => (
    d.dbDrop('foo', 'bar', 'ette').run()
  ), {
    message: '`d.dbDrop` takes 1 argument, 3 provided.'
  })
})

test('`dbDrop` should throw if no argument is given', async () => {
  const { d } = pgReql()

  await assert.rejects(async () => (
    d.dbDrop().run()
  ), {
    message: '`d.dbDrop` takes 1 argument, 0 provided.'
  })
})

// test( '`dbDrop` is not defined after a term', async () => {
//     const { d } = pgReql();    
//     await assert.rejects(async () => (
//         d.expr( 1 ).dbCreate().run()
//     ), {
//         messageendsWith: '.dbDrop is not a function'
//     });
// })

//  test( '`dbList` is not defined after a term', async () => {
//     const { d } = pgReql();    
//     await assert.rejects(async () => (
//         d.expr( 'foo' ).dbList.dbCreate().run()
//     ), {
//         messageendsWith: '.dbList is not a function'
//     });
//
//  });

test('`dbList` should contain dropped databases', async () => {
  const { d } = pgReql()
  const dbName = 'dbName' // export to the global scope

  const result1 = await d.dbCreate(dbName).run()
  assert.strictEqual(result1.dbs_created, 1)

  const result2 = await d.dbDrop(dbName).run()
  assert.strictEqual(result2.dbs_dropped, 1)

  const result3 = await d.dbList().run()
  assert.deepStrictEqual(result3, ['default'])
})
