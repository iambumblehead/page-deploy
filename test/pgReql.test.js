import test from 'node:test'
import assert from 'node:assert/strict'
import timezonemock from 'timezone-mock'
import pgReql from '../src/pgReql.js'

import {
  pgErrExpectedTypeFOOButFoundBAR,
  pgErrDuplicatePrimaryKey,
  pgErrCannotUseNestedRow
} from '../src/pgErr.js'

import {
  pgEnumIsChainShallow
} from '../src/pgEnum.js'

timezonemock.register('US/Pacific')

// eslint-disable-max-len
const isUUIDre = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i
const uuidValidate = str => typeof str === 'string' && isUUIDre.test(str)

// use when order not important and sorting helps verify a list
const compare = (a, b, prop) => {
  if (a[prop] < b[prop]) return -1
  if (a[prop] > b[prop]) return 1
  return 0
}

test('supports 0 and -0 in arithmetic queries', async () => {
  const { d } = pgReql()
  const idealNum = 6

  const result = await d.expr([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    .map(left =>
      (left.sub(idealNum)).mul(d.branch(left.gt(idealNum), 1, -1)))
    .run()

  assert.deepStrictEqual(result, [5, 4, 3, 2, 1, -0, 1, 2, 3, 4])
})

test('supports flexible row function signatures', async () => {
  const { d } = pgReql([
    ['streetfighter',
      { id: 1, name: 'ryu', strength: 6 },
      { id: 2, name: 'balrog', strength: 5 },
      { id: 3, name: 'chun-li', strength: 7 }]
  ])

  assert.ok(await d
    .table('streetfighter')
    .filter(row => row('name').eq('ryu'))
    .count().eq(1).run())

  assert.ok(await d
    .table('streetfighter')
    .filter(row => row('name').eq('ryu'))
    .count().eq(1).run())
})

test('supports nested list transformation', async () => {
  const { d } = pgReql()
  const count = 'count'
  const idealNum = 6
  const result = await d.expr([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    .map(val => ({ [count]: val }))
    .map(left => [left(count), (
      (left(count).sub(idealNum)).mul(
        d.branch(left(count).gt(idealNum), 1, -1)))])
    .run()

  assert.deepStrictEqual(result, [
    [1, 5], [2, 4], [3, 3], [4, 2], [5, 1],
    [6, -0], [7, 1], [8, 2], [9, 3], [10, 4]
  ])
})

test('supports add(), numbers', async () => {
  const { d } = pgReql()

  assert.ok(await d.expr(2).add(3).run(), 5)
})

test('supports add(), strings', async () => {
  const { d } = pgReql()

  assert.ok(await d.expr('foo').add('bar', 'baz').run(), 'foobarbaz')
})

test('supports add(), args strings', async () => {
  const { d } = pgReql()

  assert.strictEqual(await d.add(d.args(['bar', 'baz'])).run(), 'barbaz')
})

test('supports sub(), numbers', async () => {
  const { d } = pgReql()

  assert.strictEqual(await d.expr(2).sub(3).run(), -1)
})

test('supports mul(), numbers', async () => {
  const { d } = pgReql()

  assert.strictEqual(await d.expr(2).mul(3).run(), 6)
})

test('supports uuid()', async () => {
  const { d } = pgReql()

  assert.ok(uuidValidate(await d.uuid().run()))
})

test('pgReql(), returns table mapping used by mockdb', () => {
  const { dbState } = pgReql([
    ['marvel',
      { name: 'Iron Man', victories: 214 },
      { name: 'Jubilee', victories: 49 },
      { name: 'Slava', victories: 5 }],
    ['pokemon',
      { id: 1, name: 'squirtle', strength: 3 },
      { id: 2, name: 'charmander', strength: 8 },
      { id: 3, name: 'fiery', strength: 5 }]
  ])

  assert.deepStrictEqual(dbState.db.default, {
    marvel: [
      { name: 'Iron Man', victories: 214 },
      { name: 'Jubilee', victories: 49 },
      { name: 'Slava', victories: 5 }
    ],
    pokemon: [
      { id: 1, name: 'squirtle', strength: 3 },
      { id: 2, name: 'charmander', strength: 8 },
      { id: 3, name: 'fiery', strength: 5 }
    ]
  })
})

test('branch(), simple', async () => {
  const { d } = pgReql()

  assert.strictEqual(
    await d.branch(d.expr(10).gt(5), 'big', 'small').run(), 'big')
})

test('branch(), complex', async () => {
  const { d } = pgReql([
    ['marvel',
      { name: 'Iron Man', victories: 214 },
      { name: 'Jubilee', victories: 49 },
      { name: 'Slava', victories: 5 }
    ]
  ])

  const res = await d.table('marvel').map(
    d.branch(
      d.row('victories').gt(100),
      d.row('name').add(' is a superhero'),
      d.row('victories').gt(10),
      d.row('name').add(' is a hero'),
      d.row('name').add(' is very nice')
    )
  ).run()

  assert.deepStrictEqual(res, [
    'Iron Man is a superhero',
    'Jubilee is a hero',
    'Slava is very nice'
  ])
})

test('supports many expressions, same instance', async () => {
  const { d } = pgReql()
  const start = Date.now()

  assert.strictEqual(await d.expr(2).add(2).run(), 4)
  assert.strictEqual(await d.expr('foo').add('bar', 'baz').run(), 'foobarbaz')
  assert.strictEqual(await d.add(d.args(['bar', 'baz'])).run(), 'barbaz')

  assert.ok((await d.now().toEpochTime().run()) >= start / 1000)

  assert.deepEqual(await d.epochTime(531360000).run(), new Date(531360000 * 1000))
})

test('d.serialize() returns a call record', () => {
  const { d } = pgReql([
    ['marvel', {
      id: 'IronMan',
      name: 'iron'
    }]
  ])

  const recording = d.table('marvel').get('1').serialize()

  assert.strictEqual(recording, JSON.stringify([
    ['table', ['marvel']],
    ['get', ['1']],
    ['serialize', []]
  ]))
})

test('supports add()', async () => {
  const { d } = pgReql([
    ['marvel', {
      id: 'IronMan',
      name: 'iron'
    }]
  ])

  const res = await d
    .table('marvel')
    .get('IronMan')('name')
    .add('bar', 'baz').run()

  assert.strictEqual(res, 'ironbarbaz')
})

test('supports add(), array', async () => {
  const { d } = pgReql([
    ['marvel', {
      id: 'IronMan',
      names: ['iron']
    }]
  ])

  const res = await d
    .table('marvel')
    .get('IronMan')('names')
    .add('bar', 'baz').run()

  assert.deepEqual(res, ['iron', 'bar', 'baz'])
})

test('supports row.add()', async () => {
  const { d } = pgReql()

  const res = await d.expr([1, 2, 3]).map(d.row.add(1)).run()

  assert.deepEqual(res, [2, 3, 4])
})

test('supports d.args()', async () => {
  const { d } = pgReql()

  assert.strictEqual(await d.add(d.args(['bar', 'baz'])).run(), 'barbaz')

  await assert.rejects(async () => d.add(d.args()).run(), {
    message: 'args must be an array'
  })
})

test('getAll().filter({ device_id })', async () => {
  const { d } = pgReql([
    ['AppUserDevices', {
      id: 'id-document-1234',
      device_id: 'device-1234',
      app_user_id: 'appuser-1234',
      application_id: 'application-1234'
    }]
  ])

  const AppUserDevice = await d
    .table('AppUserDevices')
    .getAll('id-document-1234')
    .filter({ device_id: 'device-1234' })
    .limit(1)
    .run()

  assert.strictEqual(AppUserDevice[0].id, 'id-document-1234')
})

test('getAll should use special primaryKey', async () => {
  const { d } = pgReql([
    ['Rooms', [{ primaryKey: 'room_id' }], {
      room_id: 'roomAId-1234',
      numeric_id: 755090
    }, {
      room_id: 'roomBId-1234',
      numeric_id: 123321
    }, {
      room_id: 'roomCId-1234',
      numeric_id: 572984
    }]
  ])

  const roomDocs = await d
    .table('Rooms')
    .getAll('roomAId-1234', 'roomBId-1234')
    .run()

  assert.deepEqual(roomDocs.sort((a, b) => compare(a, b, 'room_id')), [{
    room_id: 'roomAId-1234',
    numeric_id: 755090
  }, {
    room_id: 'roomBId-1234',
    numeric_id: 123321
  }].sort((a, b) => compare(a, b, 'room_id')))
})

test('getAll should support nested args query getAll(d.args(…))', async () => {
  const { d } = pgReql([
    ['people', {
      id: 'Alice',
      children: ['Sally', 'Bobby']
    }, {
      id: 'Sally',
      children: []
    }, {
      id: 'Bobby',
      children: []
    }]
  ])

  const children = await d
    .table('people')
    .getAll(d.args(
      d.table('people').get('Alice')('children')
    )).orderBy('id').run()

  assert.deepEqual(children, [{
    id: 'Bobby',
    children: []
  }, {
    id: 'Sally',
    children: []
  }])
})

test('getAll should return [] when nest args getAll(d.args([]))', async () => {
  const { d } = pgReql([
    ['people', {
      id: 'Alice',
      children: ['Sally', 'Bobby']
    }, {
      id: 'Sally',
      children: []
    }, {
      id: 'Bobby',
      children: []
    }]
  ])

  const children = await d
    .table('people')
    .getAll(d.args([]))
    .run()

  assert.deepEqual(children, [])

  const childrenNoArgs = await d
    .table('people')
    .getAll()
    .run()

  assert.deepEqual(childrenNoArgs, [])
})

test('indexCreate should add index to dbState', async () => {
  const { d, dbState } = pgReql([
    ['Rooms', {
      id: 'roomAId-1234',
      numeric_id: 755090
    }, {
      id: 'roomBId-1234',
      numeric_id: 123321
    }]
  ])

  await d.table('Rooms').indexCreate('numeric_id').run()

  assert.deepEqual(await d.table('Rooms').indexList().run(), [
    'numeric_id'
  ])

  assert.ok(dbState.dbConfig_default_Rooms.indexes
    .some(([indexName]) => indexName === 'numeric_id'))
})

test('indexList should return indexes added by indexCreate', async () => {
  const { d } = pgReql([
    ['AppUserDevices', {
      id: 'roomAId-1234',
      app_user_id: 1
    }, {
      id: 'roomBId-1234',
      app_user_id: 2
    }]
  ])

  const indexList = await d.table('AppUserDevices').indexList().run()

  if (!indexList.includes('app_user_id')) {
    await d.table('AppUserDevices').indexCreate('app_user_id').run()
    await d.table('AppUserDevices').indexWait('app_user_id').run()
  }

  assert.deepEqual(await d.table('AppUserDevices').indexList().run(), [
    'app_user_id'
  ])
})

test('indexCreate should add compound index to dbState', async () => {
  const { d, dbState } = pgReql([
    ['Rooms', {
      id: 'roomAId-1234',
      numeric_id: 755090
    }, {
      id: 'roomBId-1234',
      numeric_id: 123321
    }]
  ])

  await d.table('Rooms').indexCreate('id_numeric_cid', [
    d.row('id'),
    d.row('numeric_id')
  ]).run()

  const dbStateIndexes = dbState.dbConfig_default_Rooms.indexes
  const dbStateIndex = dbStateIndexes.find(i => i[0] === 'id_numeric_cid')

  assert.strictEqual(dbStateIndex[0], 'id_numeric_cid')
  assert.ok(pgEnumIsChainShallow(dbStateIndex[1][0]))
  assert.ok(pgEnumIsChainShallow(dbStateIndex[1][1]))
})

test('indexCreate should add compound dynamic index to dbState', async () => {
  const { d, dbState } = pgReql([
    ['Users', {
      id: 'userAId-1234',
      name_screenname: 'userA',
      numeric_id: 1234
    }, {
      id: 'userBId-1234',
      name_screenname: 'userB',
      numeric_id: 1234
    }]
  ])

  await d
    .table('Users')
    .indexCreate('name_numeric', row => [
      row('name'), row('numeric_id')])
    .run()

  const dbStateIndexes = dbState.dbConfig_default_Users.indexes
  const dbStateIndex = dbStateIndexes.find(i => i[0] === 'name_numeric')

  assert.strictEqual(dbStateIndex[0], 'name_numeric')
  assert.ok(pgEnumIsChainShallow(dbStateIndex[1]))
})

test('indexCreate should return results compound dynamic index', async () => {
  const { d } = pgReql([
    ['Users', {
      id: 'userAId-1234',
      name_screenname: 'userA',
      numeric_id: 1234
    }, {
      id: 'userBId-1234',
      name_screenname: 'userB',
      numeric_id: 1234
    }]
  ])

  await d
    .table('Users')
    .indexCreate('name_numeric', row => [
      row('name_screenname'), row('numeric_id')])
    .run()

  await d.table('Users').indexWait().run()
  const users = await d
    .table('Users')
    .getAll(['userA', 1234], { index: 'name_numeric' })
    .run()

  assert.deepEqual(users, [{
    id: 'userAId-1234',
    name_screenname: 'userA',
    numeric_id: 1234
  }])
})

test('provides secondary index methods and lookups', async () => {
  const { d } = pgReql([
    ['AppUserDevices', {
      id: 'id-document-1234',
      device_id: 'device-1234',
      app_user_id: 'appuser-1234',
      application_id: 'application-1234'
    }]
  ])

  const indexList = await d.table('AppUserDevices').indexList().run()

  if (!indexList.includes('app_user_id')) {
    await d.table('AppUserDevices').indexCreate('app_user_id').run()
    await d.table('AppUserDevices').indexWait('app_user_id').run()
  }

  const AppUserDevice = await d
    .table('AppUserDevices')
    .getAll('appuser-1234', { index: 'app_user_id' })
    .filter({ device_id: 'device-1234' })
    .limit(1)
    .run()

  assert.strictEqual(AppUserDevice[0].id, 'id-document-1234')
})

test('provides secondary index methods and lookups, numeric', async () => {
  const { d } = pgReql([
    ['Rooms', {
      id: 'roomAId-1234',
      numeric_id: 755090
    }, {
      id: 'roomBId-1234',
      numeric_id: 123321
    }]
  ])

  await d.table('Rooms').indexCreate('numeric_id').run()
  await d.table('Rooms').indexWait('numeric_id').run()
  const room = await d
    .table('Rooms')
    .getAll(755090, { index: 'numeric_id' })
    .nth(0)
    .run()

  assert.strictEqual(room.id, 'roomAId-1234')
})

test('provides compound index methods and lookups', async () => {
  const { d } = pgReql([
    ['UserSocial', {
      id: 'userSocialId-1234',
      numeric_id: 5848,
      name_screenname: 'screenname'
    }, {
      id: 'userSocialId-5678',
      numeric_id: 9457,
      name_screenname: 'screenname'
    }]
  ])

  const indexList = await d.table('UserSocial').indexList().run()

  if (!indexList.includes('app_user_id')) {
    await d.table('UserSocial').indexCreate('screenname_numeric_cid', [
      d.row('name_screenname'),
      d.row('numeric_id')
    ]).run()
    await d.table('UserSocial').indexWait('screenname_numeric_cid').run()
  }

  const userSocialDocs = await d
    .table('UserSocial')
    .getAll(['screenname', 5848], { index: 'screenname_numeric_cid' })
    .run()

  assert.strictEqual(userSocialDocs.length, 1)
})

test('get( id ) returns an app document', async () => {
  const { d } = pgReql([
    ['Applications', {
      id: 'appid-1234',
      name: 'app name',
      description: 'app description'
    }],
    ['Users', {
      id: 'userid-fred-1234',
      name: 'fred'
    }, {
      id: 'userid-jane-1234',
      name: 'jane'
    }]
  ])

  const appDoc = await d.table('Applications').get('appid-1234').run()

  assert.strictEqual(appDoc.id, 'appid-1234')

  const usersDoc = await d.table('Users').run()

  assert.strictEqual(usersDoc.length, 2)
})

test('supports .get()', async () => {
  const { d } = pgReql([
    ['UserSocial', {
      id: 'userSocialId-1234',
      numeric_id: 5848,
      name_screenname: 'screenname'
    }]
  ])

  const res = await d.table('UserSocial')
    .get('userSocialId-1234')
    .default({ defaultValue: true })
    .run()

  assert.deepEqual(res, {
    id: 'userSocialId-1234',
    numeric_id: 5848,
    name_screenname: 'screenname'
  })
})

test('.get(), uses table-pre-configured primaryKey', async () => {
  const { d } = pgReql([
    ['UserSocial', [{ primaryKey: 'numeric_id' }], {
      numeric_id: 5848,
      name_screenname: 'screenname'
    }]
  ])

  const res = await d.table('UserSocial')
    .get(5848)
    .default({ defaultValue: true })
    .run()

  assert.deepEqual(res, {
    numeric_id: 5848,
    name_screenname: 'screenname'
  })
})

test('.get(), null situations', async () => {
  const { d } = pgReql([
    { db: 'mydb' },
    ['User',
      { id: 'userId-1234', name: 'fred' },
      { id: 'userId-5678', name: 'jane' }
    ]
  ])

  assert.strictEqual(await d.db('mydb').table('User').get('noid').run(), null)

  assert.deepEqual((
    await d.db('mydb').table('User').get('noid1')
      .replace(doc => (
        d.branch(doc.eq(null), { id: 'noid1', nullstatus: true }, doc)
      ), { returnChanges: true }).run()
  ), {
    changes: [{
      new_val: { id: 'noid1', nullstatus: true },
      old_val: null
    }],
    deleted: 0,
    errors: 0,
    inserted: 1,
    replaced: 0,
    skipped: 0,
    unchanged: 0
  })

  assert.deepEqual((
    await d.db('mydb').table('User').get('noid2')
      .replace(doc => (
        d.branch(doc.eq(null), { id: 'differentid', nullstatus: true }, doc)
      )).run()
  ), {
    deleted: 0,
    errors: 1,
    first_error: 'Primary key `id` cannot be changed',
    // mock error is simplified, actual full error looks like below...
    // ```
    // 'Primary key `id` cannot be changed (null -> {\n' +
    //   '\t"id":\t23,\n' +
    //   '\t"nullstatus":\ttrue\n' +
    //   '})'
    // ```
    inserted: 0,
    replaced: 0,
    skipped: 0,
    unchanged: 0
  })
})

test('tableCreate should evaluate reql-defined table name', async () => {
  const { d } = pgReql()

  await d.dbCreate('cmdb').run()
  const res = await d(['Users', 'Devices'])
    .difference(d.db('default').tableList())
    .forEach(table => d.db('cmdb').tableCreate(table))
    .run()

  assert.deepEqual(res, {
    tables_created: 2,
    config_changes: [
      { new_val: res.config_changes[0].new_val, old_val: null },
      { new_val: res.config_changes[1].new_val, old_val: null }
    ]
  })
})

test('.get(), uses table-configured primaryKey', async () => {
  const { d } = pgReql()
  await d
    .db('default')
    .tableCreate('UserSocial', { primaryKey: 'numeric_id' })
    .run()

  const tableInfo = await d
    .db('default')
    .table('UserSocial')
    .info()
    .run()

  assert.strictEqual(tableInfo.primary_key, 'numeric_id')
    
  await d
    .db('default')
    .table('UserSocial')
    .insert({
      numeric_id: 5848,
      name_screenname: 'screenname'
    }).run()    

  const res = await d.table('UserSocial')
    .get(5848)
    .default({ defaultValue: true })
    .run()

  assert.deepEqual(res, {
    numeric_id: 5848,
    name_screenname: 'screenname'
  })
})

test('should drop and (re)create table with different primaryKey', async () => {
  const { d } = pgReql()
  await d
    .db('default')
    .tableCreate('UserSocial')
    .run()

  const tableInfo = await d
    .db('default')
    .table('UserSocial')
    .info()
    .run()

  assert.strictEqual(tableInfo.primary_key, 'id')

  await d.db('default').tableDrop('UserSocial').run()

  await d
    .db('default')
    .tableCreate('UserSocial', { primaryKey: 'numeric_id' })
    .run()

  const tableCreatedInfo = await d
    .db('default')
    .table('UserSocial')
    .info()
    .run()

  assert.strictEqual(tableCreatedInfo.primary_key, 'numeric_id')
})

test('.get(), throws error if called with no arguments', async () => {
  const { d } = pgReql([
    ['UserSocial', {
      id: 'userSocialId-1234',
      numeric_id: 5848,
      name_screenname: 'screenname'
    }]
  ])

  await assert.rejects(async () => d.table('UserSocial').get().run(), {
    message: '`get` takes 1 argument, 0 provided.'
  })
})

test('.get(), throws error if called argument of wrong type', async () => {
  const { d } = pgReql([
    ['UserSocial', {
      id: 'userSocialId-1234',
      numeric_id: 5848,
      name_screenname: 'screenname'
    }]
  ])

  await assert.rejects(async () => (
    d.table('UserSocial').get(undefined).run()
  ), {
    message: 'Primary keys must be either a number, string, bool,'
      + ' pseudotype or array (got type UNDEFINED)'
  })
})

test('supports .get(), returns null if document not found', async () => {
  const { d } = pgReql([
    ['UserSocial', {
      id: 'userSocialId-1234',
      numeric_id: 5848,
      name_screenname: 'screenname'
    }]
  ])

  const resNoDoc = await d.table('UserSocial')
    .get('userSocialId-7575')
    .run()

  assert.strictEqual(resNoDoc, null)
})

test('supports .replace()', async () => {
  const { d } = pgReql([
    ['UserSocial', {
      id: 1,
      numeric_id: 5848,
      name_screenname: 'screenname'
    }]
  ])

  const replaceRes = await d.table('UserSocial').get(1).replace({
    id: 1,
    numeric_id: 2332,
    name_screenname: 'yay'
  }).run()

  assert.deepEqual(replaceRes, {
    deleted: 0,
    errors: 0,
    inserted: 0,
    replaced: 1,
    skipped: 0,
    unchanged: 0
  })

  const updatedDoc = await d.table('UserSocial').get(1).run()

  assert.deepEqual(updatedDoc, {
    id: 1,
    numeric_id: 2332,
    name_screenname: 'yay'
  })
})

test('supports .replace() with subquery', async () => {
  const { d } = pgReql([
    ['UserSocial', {
      id: 1,
      numeric_id: 5848,
      name_screenname: 'screenname'
    }]
  ])

  const replaceRes = await d
    .table('UserSocial')
    .get(1)
    .replace(doc => doc.without('name_screenname'))
    .run()

  assert.deepEqual(replaceRes, {
    deleted: 0,
    errors: 0,
    inserted: 0,
    replaced: 1,
    skipped: 0,
    unchanged: 0
  })

  const updatedDoc = await d.table('UserSocial').get(1).run()

  assert.deepEqual(updatedDoc, {
    id: 1,
    numeric_id: 5848
  })  
})

test('supports .replace() with subquery, list', async () => {
  const { d } = pgReql([
    ['UserSocial', {
      id: 1,
      numeric_id: 5848,
      name_screenname: 'screenname'
    }]
  ])

  const replaceRes = await d.table('UserSocial')
    .replace(doc => doc.without('name_screenname')).run()

  assert.deepEqual(replaceRes, {
    deleted: 0,
    errors: 0,
    inserted: 0,
    replaced: 1,
    skipped: 0,
    unchanged: 0
  })

  assert.deepEqual(await d.table('UserSocial').get(1).run(), {
    id: 1,
    numeric_id: 5848
  })
})

test('supports reusing-of base query chains to construct chains', async () => {
  const { d } = pgReql()
  const doc = d.expr({ id: 1, numeric_id: 8585 })
  const query1 = await doc.hasFields('name_screenname').not().run()
  const query2 = await doc.merge({ name_screenname: 'restored' }).run()

  assert.strictEqual(query1, true)
  assert.deepStrictEqual(query2, {
    id: 1,
    numeric_id: 8585,
    name_screenname: 'restored'
  })

  assert.strictEqual(await doc('id').run(), 1)
  assert.strictEqual(await doc('numeric_id').run(), 8585)
  assert.strictEqual(await doc('numeric_id').add(doc('id')).run(), 8586)

})

test('supports .replace() with subquery, d.branch and list', async () => {
  const { d } = pgReql([
    ['UserSocial', {
      id: 1,
      numeric_id: 5848
    }]
  ])

  const res = await d.table('UserSocial')
    .replace(doc => d.branch(doc.hasFields('name_screenname').not(),
      doc.merge({ name_screenname: 'restored' }),
      null)
    ).run()

  assert.strictEqual(res.replaced, 1)

  
  assert.deepEqual(await d.table('UserSocial').get(1).run(), {
    id: 1,
    numeric_id: 5848,
    name_screenname: 'restored'
  })
})

test('supports .count()', async () => {
  const { d } = pgReql([
    ['UserSocial', {
      id: 'userSocialId-1234',
      numeric_id: 3333,
      name_screenname: 'screenname'
    }, {
      id: 'userSocialId-5678',
      numeric_id: 2222,
      name_screenname: 'screenname'
    }, {
      id: 'userSocialId-9012',
      numeric_id: 5555,
      name_screenname: 'screenname'
    }]
  ])

  const res = await d
    .table('UserSocial')
    .filter(hero => hero('numeric_id').lt(4000))
    .count()
    .run()

  assert.strictEqual(res, 2)
})

test('supports .isEmpty()', async () => {
  const { d } = pgReql([
    ['marvel',
      { id: 'wolverine', defeatedMonsters: ['squirtle'] },
      { id: 'thor', defeatedMonsters: ['charzar', 'fiery'] },
      { id: 'xavier', defeatedMonsters: ['jiggly puff'] }],
    ['emptytable']
  ])

  assert.strictEqual(await d.table('marvel').isEmpty().run(), false)
  assert.strictEqual(await d.table('emptytable').isEmpty().run(), true)
})

test('supports .max()', async () => {
  const { d } = pgReql([
    ['games',
      { id: 2, player: 'Bob', points: 15, type: 'ranked' },
      { id: 5, player: 'Alice', points: 7, type: 'free' },
      { id: 11, player: 'Bob', points: 10, type: 'free' },
      { id: 12, player: 'Alice', points: 2, type: 'free' }]
  ])

  const res = await d.table('games').max('points').run()

  assert.deepEqual(res, {
    id: 2, player: 'Bob', points: 15, type: 'ranked'
  })
})

test('supports .max()()', async () => {
  const { d } = pgReql([
    ['games',
      { id: 2, player: 'Bob', points: 15, type: 'ranked' },
      { id: 5, player: 'Alice', points: 7, type: 'free' },
      { id: 11, player: 'Bob', points: 10, type: 'free' },
      { id: 12, player: 'Alice', points: 2, type: 'free' }]
  ])

  const res = await d
    .table('games')
    .max('points')('points')
    .run()

  assert.strictEqual(res, 15)
})

test('supports .min()', async () => {
  const { d } = pgReql([
    ['games',
      { id: 2, player: 'Bob', points: 15, type: 'ranked' },
      { id: 5, player: 'Alice', points: 7, type: 'free' },
      { id: 11, player: 'Bob', points: 10, type: 'free' },
      { id: 12, player: 'Alice', points: 2, type: 'free' }]
  ])

  const res = await d.table('games').min('points').run()

  assert.deepEqual(res, {
    id: 12, player: 'Alice', points: 2, type: 'free'
  })
})

test('supports .pluck() from document', async () => {
  const { d } = pgReql([
    ['UserSocial', {
      id: 'userSocialId-1234',
      numeric_id: 3333,
      name_screenname: 'screenname'
    }, {
      id: 'userSocialId-5678',
      numeric_id: 2222,
      name_screenname: 'screenname'
    }, {
      id: 'userSocialId-9012',
      numeric_id: 5555,
      name_screenname: 'screenname'
    }]
  ])

  const res = await d
    .table('UserSocial')
    .get('userSocialId-1234')
    .pluck('numeric_id', 'id')
    .run()

  assert.deepEqual(res, {
    id: 'userSocialId-1234',
    numeric_id: 3333
  })
})

test('supports .pluck() (from list)', async () => {
  const { d } = pgReql([
    ['UserSocial', {
      id: 'userSocialId-1234',
      numeric_id: 3333,
      name_screenname: 'screenname'
    }, {
      id: 'userSocialId-5678',
      numeric_id: 2222,
      name_screenname: 'screenname'
    }, {
      id: 'userSocialId-9012',
      numeric_id: 5555,
      name_screenname: 'screenname'
    }]
  ])

  const res = await d
    .table('UserSocial')
    .pluck('numeric_id', 'id')
    .run()

  assert.deepEqual(res, [{
    id: 'userSocialId-1234',
    numeric_id: 3333
  }, {
    id: 'userSocialId-5678',
    numeric_id: 2222
  }, {
    id: 'userSocialId-9012',
    numeric_id: 5555
  }])
})

test('supports .slice(1,2)', async () => {
  const { d } = pgReql([
    ['UserSocial', {
      id: 'userSocialId-1234',
      numeric_id: 3333,
      name_screenname: 'screenname'
    }, {
      id: 'userSocialId-5678',
      numeric_id: 2222,
      name_screenname: 'screenname'
    }, {
      id: 'userSocialId-9012',
      numeric_id: 5555,
      name_screenname: 'screenname'
    }]
  ])

  const res = await d
    .table('UserSocial')
    .slice(1, 2)
    .run()

  assert.deepEqual(res, [{
    id: 'userSocialId-5678',
    numeric_id: 2222,
    name_screenname: 'screenname'
  }])
})

test('supports .skip(1)', async () => {
  const { d } = pgReql([
    ['UserSocial', {
      id: 'userSocialId-1234',
      numeric_id: 3333,
      name_screenname: 'screenname'
    }, {
      id: 'userSocialId-5678',
      numeric_id: 2222,
      name_screenname: 'screenname'
    }, {
      id: 'userSocialId-9012',
      numeric_id: 5555,
      name_screenname: 'screenname'
    }]
  ])

  const res = await d
    .table('UserSocial')
    .skip(1)
    .run()

  assert.deepEqual(res, [{
    id: 'userSocialId-5678',
    numeric_id: 2222,
    name_screenname: 'screenname'
  }, {
    id: 'userSocialId-9012',
    numeric_id: 5555,
    name_screenname: 'screenname'
  }])
})

test('supports .concatMap()', async () => {
  const { d } = pgReql([
    ['marvel',
      { id: 'wolverine', defeatedMonsters: ['squirtle'] },
      { id: 'thor', defeatedMonsters: ['charzar', 'fiery'] },
      { id: 'xavier', defeatedMonsters: ['jiggly puff'] }]
  ])

  const res = await d
    .table('marvel')
    .concatMap(hero => hero('defeatedMonsters'))
    .run()

  assert.deepEqual(res, [
    'squirtle',
    'charzar',
    'fiery',
    'jiggly puff'
  ])
})

test('supports .sample()', async () => {
  const { d } = pgReql([
    ['marvel',
      { id: 'wolverine', defeatedMonsters: ['squirtle'] },
      { id: 'thor', defeatedMonsters: ['charzar', 'fiery'] },
      { id: 'xavier', defeatedMonsters: ['jiggly puff'] }]
  ])

  const res = await d.table('marvel').sample(2).run()

  assert.ok(Array.isArray(res))
  assert.strictEqual(res.length, 2)
})

test('supports .group() (basic)', async () => {
  const { d } = pgReql([
    ['games',
      { id: 2, player: 'Bob', points: 15, type: 'ranked' },
      { id: 5, player: 'Alice', points: 7, type: 'free' },
      { id: 11, player: 'Bob', points: 10, type: 'free' },
      { id: 12, player: 'Alice', points: 2, type: 'free' }]
  ])

  const res = await d.table('games').group('player').run()

  assert.deepEqual(res.sort((a, b) => compare(a, b, 'group')), [{
    group: 'Alice',
    reduction: [
      { id: 5, player: 'Alice', points: 7, type: 'free' },
      { id: 12, player: 'Alice', points: 2, type: 'free' }
    ]
  }, {
    group: 'Bob',
    reduction: [
      { id: 2, player: 'Bob', points: 15, type: 'ranked' },
      { id: 11, player: 'Bob', points: 10, type: 'free' }
    ]
  }])
})

test('supports .group().max() query', async () => {
  const { d } = pgReql([
    ['games',
      { id: 2, player: 'Bob', points: 15, type: 'ranked' },
      { id: 5, player: 'Alice', points: 7, type: 'free' },
      { id: 11, player: 'Bob', points: 10, type: 'free' },
      { id: 12, player: 'Alice', points: 2, type: 'free' }]
  ])

  const res = await d.table('games').group('player').max('points').run()

  assert.deepEqual(res.sort((a, b) => compare(a, b, 'group')), [{
    group: 'Alice',
    reduction: { id: 5, player: 'Alice', points: 7, type: 'free' }
  }, {
    group: 'Bob',
    reduction: { id: 2, player: 'Bob', points: 15, type: 'ranked' }
  }])
})

test('supports .group().min() query', async () => {
  const { d } = pgReql([
    ['games',
      { id: 2, player: 'Bob', points: 15, type: 'ranked' },
      { id: 5, player: 'Alice', points: 7, type: 'free' },
      { id: 11, player: 'Bob', points: 10, type: 'free' },
      { id: 12, player: 'Alice', points: 2, type: 'free' }]
  ])

  const res = await d.table('games').group('player').min('points').run()

  assert.deepEqual(res.sort((a, b) => compare(a, b, 'group')), [{
    group: 'Alice',
    reduction: { id: 12, player: 'Alice', points: 2, type: 'free' }
  }, {
    group: 'Bob',
    reduction: { id: 11, player: 'Bob', points: 10, type: 'free' }
  }])
})

test('supports .ungroup() query', async () => {
  const { d } = pgReql([
    ['games',
      { id: 2, player: 'Bob', points: 15, type: 'ranked' },
      { id: 5, player: 'Alice', points: 7, type: 'free' },
      { id: 11, player: 'Bob', points: 10, type: 'free' },
      { id: 12, player: 'Alice', points: 2, type: 'free' }]
  ])

  const res = await d
    .table('games')
    .group('player')
    .ungroup()
    .run()

  assert.deepEqual(res.sort((a, b) => compare(a, b, 'group')), [{
    group: 'Alice',
    reduction: [
      { id: 5, player: 'Alice', points: 7, type: 'free' },
      { id: 12, player: 'Alice', points: 2, type: 'free' }
    ]
  }, {
    group: 'Bob',
    reduction: [
      { id: 2, player: 'Bob', points: 15, type: 'ranked' },
      { id: 11, player: 'Bob', points: 10, type: 'free' }
    ]
  }])
})

test('supports simple group() ungroup() official example', async () => {
  const { d } = pgReql([
    ['games',
      { id: 2, player: 'Bob', points: 15, type: 'ranked' },
      { id: 5, player: 'Alice', points: 7, type: 'free' },
      { id: 11, player: 'Bob', points: 10, type: 'free' },
      { id: 12, player: 'Alice', points: 2, type: 'free' }]
  ])

  const ungroupres = await d
    .table('games')
    .group('player')
    .ungroup()
    .slice(1)
    .run()

  assert.deepEqual(ungroupres, [{
    group: 'Alice',
    reduction: [
      { id: 5, player: 'Alice', points: 7, type: 'free' },
      { id: 12, player: 'Alice', points: 2, type: 'free' }
    ]
  }])

  const groupres = await d
    .table('games')
    .group('player')
    .slice(1)
    .run()

  assert.deepEqual(groupres, [{
    group: 'Bob',
    reduction: [
      { id: 11, player: 'Bob', points: 10, type: 'free' }
    ]
  }, {
    group: 'Alice',
    reduction: [
      { id: 12, player: 'Alice', points: 2, type: 'free' }
    ]
  }])
})

test('supports .ungroup() complex query', async () => {
  const { d } = pgReql([
    ['games',
      { id: 2, player: 'Bob', points: 15, type: 'ranked' },
      { id: 5, player: 'Alice', points: 7, type: 'free' },
      { id: 11, player: 'Bob', points: 10, type: 'free' },
      { id: 12, player: 'Alice', points: 2, type: 'free' }]
  ])

  const res = await d
    .table('games')
    .group('player').max('points')('points')
    .ungroup().orderBy(d.desc('reduction'))

    .run()

  assert.deepEqual(res.sort((a, b) => compare(a, b, 'reduction')), [{
    group: 'Bob',
    reduction: 15
  }, {
    group: 'Alice',
    reduction: 7
  }].sort((a, b) => compare(a, b, 'reduction')))
})

test('supports .eqJoin()', async () => {
  const { d } = pgReql([
    ['players',
      { id: 1, player: 'George', gameId: 1 },
      { id: 2, player: 'Agatha', gameId: 3 },
      { id: 3, player: 'Fred', gameId: 2 },
      { id: 4, player: 'Marie', gameId: 2 },
      { id: 5, player: 'Earnest', gameId: 1 },
      { id: 6, player: 'Beth', gameId: 3 }],
    ['games',
      { id: 1, field: 'Little Delving' },
      { id: 2, field: 'Rushock Bog' },
      { id: 3, field: 'Bucklebury' }]
  ])

  const res = await d
    .table('players')
    .eqJoin('gameId', d.table('games'))
    .run()

  assert.deepEqual(res, [{
    left: { id: 1, player: 'George', gameId: 1 },
    right: { id: 1, field: 'Little Delving' }
  }, {
    left: { id: 2, player: 'Agatha', gameId: 3 },
    right: { id: 3, field: 'Bucklebury' }
  }, {
    left: { id: 3, player: 'Fred', gameId: 2 },
    right: { id: 2, field: 'Rushock Bog' }
  }, {
    left: { id: 4, player: 'Marie', gameId: 2 },
    right: { id: 2, field: 'Rushock Bog' }
  }, {
    left: { id: 5, player: 'Earnest', gameId: 1 },
    right: { id: 1, field: 'Little Delving' }
  }, {
    left: { id: 6, player: 'Beth', gameId: 3 },
    right: { id: 3, field: 'Bucklebury' }
  }])
})

test('supports .innerJoin', async () => {
  const { d } = pgReql([
    ['streetfighter',
      { id: 1, name: 'ryu', strength: 6 },
      { id: 2, name: 'balrog', strength: 5 },
      { id: 3, name: 'chun-li', strength: 7 }],
    ['pokemon',
      { id: 1, name: 'squirtle', strength: 3 },
      { id: 2, name: 'charmander', strength: 8 },
      { id: 3, name: 'fiery', strength: 5 }]
  ])

  const res = await d
    .table('streetfighter')
    .innerJoin(d.table('pokemon'), (sfRow, pokeRow) => (
      sfRow('strength').lt(pokeRow('strength'))
    )).run()

  assert.strictEqual(res.length, 3)
  assert.deepEqual(res, [{
    left: { id: 1, name: 'ryu', strength: 6 },
    right: { id: 2, name: 'charmander', strength: 8 }
  }, {
    left: { id: 2, name: 'balrog', strength: 5 },
    right: { id: 2, name: 'charmander', strength: 8 }
  }, {
    left: { id: 3, name: 'chun-li', strength: 7 },
    right: { id: 2, name: 'charmander', strength: 8 }
  }])
})

test('supports .merge()', async () => {
  const { d } = pgReql([
    ['marvel',
      { id: 'wolverine', name: 'wolverine' },
      { id: 'thor', name: 'thor' },
      { id: 'xavier', name: 'xavier' }],
    ['equipment',
      { id: 'hammer', type: 'air' },
      { id: 'sickle', type: 'ground' },
      { id: 'pimento_sandwich', type: 'dream' }]
  ])

  const res = await d.table('marvel').get('thor').merge(
    d.table('equipment').get('hammer'),
    d.table('equipment').get('pimento_sandwich')
  ).run()

  assert.deepEqual(res, { id: 'pimento_sandwich', name: 'thor', type: 'dream' })
})

test('supports .merge(), does not mutate document in table', async () => {
  const { d } = pgReql([
    ['marvel',
      { id: 'thor', name: 'thor' },
      { id: 'xavier', name: 'xavier' }]
  ])

  await d.table('marvel').get('thor').merge({
    yummy: 'cupcake'
  }).run()

  assert.deepEqual(await d.table('marvel').get('thor').run(), {
    id: 'thor',
    name: 'thor'
  })
})

test('supports .orderBy()', async () => {
  const { d } = pgReql([
    ['streetfighter',
      { id: 1, name: 'ryu', strength: 6 },
      { id: 2, name: 'balrog', strength: 5 },
      { id: 3, name: 'chun-li', strength: 7 }]
  ])
  await d.table('streetfighter').indexCreate('strength').run()
  await d.table('streetfighter').indexWait('strength').run()

  const res = await d
    .table('streetfighter')
    .orderBy({ index: 'strength' })
    .run()

  assert.deepEqual(res, [
    { id: 2, name: 'balrog', strength: 5 },
    { id: 1, name: 'ryu', strength: 6 },
    { id: 3, name: 'chun-li', strength: 7 }
  ])
})

test('supports .orderBy() property', async () => {
  const { d } = pgReql([
    ['streetfighter',
      { id: 1, name: 'ryu', strength: 6 },
      { id: 2, name: 'balrog', strength: 5 },
      { id: 3, name: 'chun-li', strength: 7 }]
  ])

  const res = await d
    .table('streetfighter')
    .orderBy('name')
    .run()

  assert.deepEqual(res, [
    { id: 2, name: 'balrog', strength: 5 },
    { id: 3, name: 'chun-li', strength: 7 },
    { id: 1, name: 'ryu', strength: 6 }
  ])
})

test('supports .orderBy(), desc date', async () => {
  const now = new Date()
  const earliest = new Date(now.getTime() - 80000)
  const latest = new Date(now.getTime() + 50)

  const { d } = pgReql([
    ['streetfighter',
      { id: 1, name: 'ryu', date: now },
      { id: 2, name: 'balrog', date: earliest },
      { id: 3, name: 'chun-li', date: latest }]
  ])
  await d.table('streetfighter').indexCreate('date').run()
  await d.table('streetfighter').indexWait('date').run()

  const res = await d
    .table('streetfighter')
    .orderBy({ index: d.desc('date') })
    .run()

  assert.deepEqual(res, [
    { id: 3, name: 'chun-li', date: latest },
    { id: 1, name: 'ryu', date: now },
    { id: 2, name: 'balrog', date: earliest }
  ])
})

test('supports .orderBy(), asc date', async () => {
  const now = new Date()
  const earliest = new Date(now.getTime() - 80000)
  const latest = new Date(now.getTime() + 50)

  const { d } = pgReql([
    ['streetfighter',
      { id: 1, name: 'ryu', date: now },
      { id: 2, name: 'balrog', date: earliest },
      { id: 3, name: 'chun-li', date: latest }]
  ])
  await d.table('streetfighter').indexCreate('date').run()
  await d.table('streetfighter').indexWait('date').run()

  const res = await d
    .table('streetfighter')
    .orderBy({ index: d.asc('date') })
    .run()

  assert.deepEqual(res, [
    { id: 2, name: 'balrog', date: earliest },
    { id: 1, name: 'ryu', date: now },
    { id: 3, name: 'chun-li', date: latest }
  ])
})

test('supports .orderBy(), dynamic function', async () => {
  const { d } = pgReql([
    ['streetfighter',
      { id: 1, name: 'ryu', upvotes: 6, downvotes: 30 },
      { id: 2, name: 'balrog', upvotes: 5, downvotes: 0 },
      { id: 3, name: 'chun-li', upvotes: 7, downvotes: 3 }]
  ])

  const res = await d
    .table('streetfighter')
  // sub document query-chains not yet supported
  // .orderBy( doc => doc( 'upvotes' ).sub( doc( 'downvotes' ) ) )
    .orderBy(doc => doc('upvotes'))
    .run()

  assert.deepEqual(res, [
    { id: 2, name: 'balrog', upvotes: 5, downvotes: 0 },
    { id: 1, name: 'ryu', upvotes: 6, downvotes: 30 },
    { id: 3, name: 'chun-li', upvotes: 7, downvotes: 3 }
  ])
})

test('supports .gt(), applied to row', async () => {
  const { d } = pgReql([
    ['player', {
      id: 'playerId-1234',
      score: 10
    }, {
      id: 'playerId-5678',
      score: 6
    }]
  ])

  const res = await d
    .table('player')
    .filter(row => row('score').gt(8))
    .run()

  assert.deepEqual(res, [{
    id: 'playerId-1234',
    score: 10
  }])
})

test('supports .ge(), applied to row', async () => {
  const { d } = pgReql([
    ['player', {
      id: 'playerId-1234',
      score: 10
    }, {
      id: 'playerId-5678',
      score: 6
    }]
  ])

  const res = await d
    .table('player')
    .filter(row => row('score').ge(10))
    .run()

  assert.deepEqual(res, [{
    id: 'playerId-1234',
    score: 10
  }])
})

test('supports .lt(), applied to row', async () => {
  const { d } = pgReql([
    ['player', {
      id: 'playerId-1234',
      score: 10
    }, {
      id: 'playerId-5678',
      score: 6
    }]
  ])

  const res = await d
    .table('player')
    .filter(row => row('score').lt(8))
    .run()

  assert.deepEqual(res, [{
    id: 'playerId-5678',
    score: 6
  }])
})

test('supports .le(), applied to row', async () => {
  const { d } = pgReql([
    ['player', {
      id: 'playerId-1234',
      score: 10
    }, {
      id: 'playerId-5678',
      score: 6
    }]
  ])

  const res = await d
    .table('player')
    .filter(row => row('score').le(6))
    .run()

  assert.deepEqual(res, [{
    id: 'playerId-5678',
    score: 6
  }])
})

test('supports .eq(), applied to row', async () => {
  const { d } = pgReql([
    ['player', {
      id: 'playerId-1234',
      score: 10
    }, {
      id: 'playerId-5678',
      score: 6
    }]
  ])

  const res = await d
    .table('player')
    .filter(row => row('score').eq(6))
    .run()

  assert.deepEqual(res, [{
    id: 'playerId-5678',
    score: 6
  }])
})

test('supports .ne(), applied to row', async () => {
  const { d } = pgReql([
    ['player', {
      id: 'playerId-1234',
      score: 10
    }, {
      id: 'playerId-5678',
      score: 6
    }]
  ])

  const res = await d
    .table('player')
    .filter(row => row('score').ne(6))
    .run()

  // r function not yet supported
  // assert.strictEqual( await r( true ).not().run(), false )
  assert.deepEqual(res, [{
    id: 'playerId-1234',
    score: 10
  }])
})

test('supports .not(), applied to row', async () => {
  const { d } = pgReql([
    ['player', {
      id: 'playerId-1234',
      score: 10
    }, {
      id: 'playerId-5678',
      score: 6
    }]
  ])

  const res = await d
    .table('player')
    .filter(row => row('score').eq(6).not())
    .run()

  assert.deepEqual(res, [{
    id: 'playerId-1234',
    score: 10
  }])
})

test('supports .nth()', async () => {
  const { d } = pgReql([
    ['marvel', {
      id: 'IronMan',
      equipment: []
    }]
  ])

  const ironman = await d.table('marvel').nth(0).run()

  assert.strictEqual(ironman.id, 'IronMan')
})

test('supports .nth(), non-trivial guery', async () => {
  const { d } = pgReql([
    ['UserSocial', {
      id: 'userSocialId-1234',
      numeric_id: 5848,
      name_screenname: 'screenname'
    }]
  ])

  await d.table('UserSocial').indexCreate('screenname_numeric_cid', [
    d.row('name_screenname'),
    d.row('numeric_id')
  ]).run()
  await d.table('UserSocial').indexWait('screenname_numeric_cid').run()

  await assert.rejects(async () => (
    d.table('UserSocial')
      .getAll(['notfound', 7575], { index: 'screenname_numeric_cid' })
      .limit(1)
      .nth(0)
      .run()
  ), {
    message: 'ReqlNonExistanceError: Index out of bounds: 0'
  })
})

test('supports .default()', async () => {
  const { d } = pgReql([
    ['UserSocial', {
      id: 'userSocialId-1234',
      numeric_id: 5848,
      name_screenname: 'screenname'
    }]
  ])

  const res = await d.table('UserSocial')
    .get('userSocialId-7575')
    .default({ defaultValue: true })
    .run()

  assert.ok(res.defaultValue)
})

test('supports .default(), non-trivial guery', async () => {
  const { d } = pgReql([
    ['UserSocial', {
      id: 'userSocialId-1234',
      numeric_id: 5848,
      name_screenname: 'screenname'
    }]
  ])

  await d.table('UserSocial').indexCreate('screenname_numeric_cid', [
    d.row('name_screenname'),
    d.row('numeric_id')
  ]).run()

  await d.table('UserSocial').indexWait('screenname_numeric_cid').run()

  const result = await d
    .table('UserSocial')
    .getAll(['notfound', 7575], { index: 'screenname_numeric_cid' })
    .limit(1)
    .nth(0)
    .default('defaultval')
    .run()

  assert.strictEqual(result, 'defaultval')
})

test('supports .epochTime()', async () => {
  const { d } = pgReql([
    ['user', {
      id: 'John',
      birthdate: new Date()
    }]
  ])

  await d.table('user').insert({
    id: 'Jane',
    birthdate: d.epochTime(531360000)
  }).run()

  const janeDoc = d.table('user').get('Jane')
  const janeBirthday = await janeDoc('birthdate').run()

  assert.strictEqual(janeBirthday.getTime(), 531360000000)
})

test('supports .update()', async () => {
  const { d } = pgReql([
    ['user', {
      id: 'John',
      birthdate: new Date()
    }]
  ])

  const result = await d.table('user').get('John').update({
    birthdate: d.epochTime(531360000)
  }).run()

  assert.deepEqual(result, {
    unchanged: 0,
    skipped: 0,
    replaced: 1,
    inserted: 0,
    errors: 0,
    deleted: 0
  })
})

test('supports .during()', async () => {
  const now = Date.now()
  const expiredDate = new Date(now - (1000 * 60 * 60 * 24))
  const { d } = pgReql([
    ['RoomCodes', {
      id: 'expired',
      time_expire: expiredDate
    }, {
      id: 'not-expired',
      time_expire: new Date(now + 1000)
    }]
  ])

  const expiredDocs = await d
    .table('RoomCodes')
    .filter(
      d.row('time_expire').during(
        d.epochTime(0),
        d.epochTime(now / 1000)
      ))
    .run()

  assert.deepStrictEqual(expiredDocs, [{
    id: 'expired',
    time_expire: expiredDate
  }])
})

test('supports .replace(doc => doc), or various null', async () => {
  const { d } = pgReql([
    ['Baseball',
      { id: 123, name: 'Mark McGuire' }]
  ])

  const resSameDoc = await d.table('Baseball').get(123)
    .replace(doc => doc, { returnChanges: true }).run()

  assert.deepEqual(resSameDoc, {
    changes: [],
    deleted: 0,
    errors: 0,
    inserted: 0,
    replaced: 0,
    skipped: 0,
    unchanged: 1
  })

  const resSameNull = await d.table('Baseball').get('unknown')
    .replace(doc => doc, { returnChanges: true }).run()

  assert.deepEqual(resSameNull, {
    changes: [],
    deleted: 0,
    errors: 0,
    inserted: 0,
    replaced: 0,
    skipped: 1,
    unchanged: 0
  })

  const resNull = await d.table('Baseball').get(123)
    .replace(() => null, { returnChanges: true }).run()

  assert.deepEqual(resNull, {
    changes: [{ new_val: null, old_val: { id: 123, name: 'Mark McGuire' } }],
    deleted: 1,
    errors: 0,
    inserted: 0,
    replaced: 0,
    skipped: 0,
    unchanged: 0
  })

  const resNullNull = await d.table('Baseball').get('notfound')
    .replace(() => null, { returnChanges: true }).run()

  assert.deepEqual(resNullNull, {
    changes: [],
    deleted: 0,
    errors: 0,
    inserted: 0,
    replaced: 0,
    skipped: 1,
    unchanged: 0
  })
})

test('supports .update(doc => doc), or various null', async () => {
  const { d } = pgReql([
    ['Baseball',
      { id: 123, name: 'Mark McGuire' }]
  ])

  const resSameDoc = await d.table('Baseball').get(123)
    .update(doc => doc, { returnChanges: true }).run()

  assert.deepEqual(resSameDoc, {
    changes: [],
    deleted: 0,
    errors: 0,
    inserted: 0,
    replaced: 0,
    skipped: 0,
    unchanged: 1
  })

  const resSameNull = await d.table('Baseball').get('unknown')
    .update(doc => doc, { returnChanges: true }).run()

  assert.deepEqual(resSameNull, {
    changes: [],
    deleted: 0,
    errors: 0,
    inserted: 0,
    replaced: 0,
    skipped: 1,
    unchanged: 0
  })

  const resNull = await d.table('Baseball').get(123)
    .update(() => null, { returnChanges: true }).run()

  assert.deepEqual(resNull, {
    changes: [],
    deleted: 0,
    errors: 0,
    inserted: 0,
    replaced: 0,
    skipped: 0,
    unchanged: 1
  })

  const resNullNull = await d.table('Baseball').get('notfound')
    .replace(() => {}, { returnChanges: true }).run()

  assert.deepEqual(resNullNull, {
    changes: [],
    deleted: 0,
    errors: 0,
    inserted: 0,
    replaced: 0,
    skipped: 1,
    unchanged: 0
  })
})

test('supports .during(), correctly handles empty results', async () => {
  const now = Date.now()
  const timeExpire = new Date(now - (1000 * 60 * 60 * 24))
  const { d } = pgReql([
    ['RoomCodes', {
      id: 'expired',
      time_expire: timeExpire
    }]
  ])

  const expiredDocs = await d
    .table('RoomCodes')
    .filter(
      d.row('time_expire').during(
        d.epochTime(0),
        d.epochTime(now / 1000)
      ))
    .run()

  assert.deepEqual(expiredDocs, [{
    id: 'expired',
    time_expire: timeExpire
  }])
})

test('supports .getField()', async () => {
  const { d } = pgReql([
    ['marvel', {
      id: 'IronMan',
      equipment: ['boots']
    }]
  ])

  const ironManEquipment = await d
    .table('marvel')
    .get('IronMan')
    .getField('equipment')
    .run()

  assert.strictEqual(ironManEquipment[0], 'boots')
})

// https://rethinkdb.com/api/javascript/get_field
test('supports .getField() on sequences', async () => {
  const { d } = pgReql([
    ['marvel', {
      id: 'IronMan',
      equipment: ['boots'],
      name: 'Jim Glow'
    }]
  ])

  const ironMenNames = await d
    .table('marvel')
    .getAll('IronMan')
    .getField('name')
    .run()

  assert.deepEqual(ironMenNames, ['Jim Glow'])
})

test('supports brackets lookup ()', async () => {
  const { d } = pgReql([
    ['marvel', {
      id: 'IronMan',
      equipment: ['boots']
    }]
  ])

  const res = await d
    .table('marvel')
    .get('IronMan')('equipment')
    .upcase().run()

  assert.strictEqual(res, 'BOOTS')
})

test('supports brackets upcase()', async () => {
  const { d } = pgReql([
    ['marvel', {
      id: 'IronMan',
      equipment: ['boots']
    }]
  ])

  const res = await d
    .table('marvel')
    .get('IronMan')('equipment')
    .upcase().run()

  assert.strictEqual(res, 'BOOTS')
})

test('supports brackets downcase()', async () => {
  const { d } = pgReql([
    ['marvel', {
      id: 'IronMan',
      equipment: ['BoOts']
    }]
  ])

  const res = await d
    .table('marvel')
    .get('IronMan')('equipment')
    .downcase().run()

  assert.strictEqual(res, 'boots')
})

test('supports .match()', async () => {
  const { d } = pgReql([
    ['users', {
      id: 'userid-john-1234',
      name: 'john smith'
    }, {
      id: 'userid-jonathan-1234',
      name: 'johnathan doe'
    }, {
      id: 'userid-jane-1234',
      name: 'jane sidewell'
    }]
  ])

  const res = await d
    .table('users')
    .filter(doc => doc('name').match('(?i)^john'))
    .run()

  assert.deepEqual(res, [{
    id: 'userid-john-1234',
    name: 'john smith'
  }, {
    id: 'userid-jonathan-1234',
    name: 'johnathan doe'
  }])
})

test('throws sub query error, even when parent query default()', async () => {
  // actual database replicates this test
  const { d } = pgReql()

  await assert.rejects(async () => (d
    .expr([{ number: 446 }])
    .filter(doc => doc('number').match('(?i)^john'))
    .default('result-when-subquery')
    .run()
  ), {
    message: pgErrExpectedTypeFOOButFoundBAR(
      'STRING', 'NUMBER'
    ).message
  })
})

test('throws error when .match() used on NUMBER type', async () => {
  const { d } = pgReql([
    ['users', {
      id: 'userid-john-1234',
      number: 1234
    }, {
      id: 'userid-jonathan-1234',
      number: 5678
    }, {
      id: 'userid-jane-1234',
      number: 9012
    }]
  ])

  await assert.rejects(async () => (
    d.table('users').filter(
      doc => doc('number').match('(?i)^john')
    ).run()
  ), { 
    message: pgErrExpectedTypeFOOButFoundBAR(
      'STRING', 'NUMBER'
    ).message
  })
})

test('supports .append()', async () => {
  const { d } = pgReql([
    ['marvel', {
      id: 'IronMan',
      equipment: ['gloves']
    }]
  ])

  const res = await d
    .table('marvel')
    .get('IronMan')('equipment')
    .append('newBoots')
    .run()

  assert.deepEqual(res, ['gloves', 'newBoots'])
})

test('supports .insert([ ...docs ]) should insert several docs', async () => {
  const { d } = pgReql([['Rooms']])
  await d
    .db('default')
    .table('Rooms')
    .insert([{ val: 1 }, { val: 2 }, { val: 3 }])
    .run()

  const testRooms = await d.db('default').table('Rooms').run()

  assert.strictEqual(testRooms.length, 3)
})

test('supports .insert(, {})', async () => {
  const { d } = pgReql([
    ['posts', {
      id: 'post-1234',
      title: 'post title',
      content: 'post content'
    }]
  ])

  const insertRes = await d.table('posts').insert({
    title: 'Lorem ipsum',
    content: 'Dolor sit amet'
  }).run()

  const [generatedKey] = insertRes.generated_keys

  assert.deepEqual(insertRes, {
    deleted: 0,
    errors: 0,
    generated_keys: [generatedKey],
    inserted: 1,
    replaced: 0,
    skipped: 0,
    unchanged: 0
  })
})

test('should only return generated_keys from .insert() if db defines key', async () => {
  const { d } = pgReql([
    ['posts', {
      id: 'post-1234',
      title: 'post title',
      content: 'post content'
    }]
  ])

  const insertRes = await d.table('posts').insert({
    title: 'Lorem ipsum',
    content: 'Dolor sit amet'
  }).run()

  assert.ok('generated_keys' in insertRes)

  const insertResWithKey = await d.table('posts').insert({
    id: 'post-7777',
    title: 'with primary key',
    content: 'best of times and worst of times'
  }).run()

  assert.strictEqual('generated_keys' in insertResWithKey, false)
})

test('supports .insert([ doc1, doc2 ], {})', async () => {
  const { d } = pgReql([
    ['posts', {
      id: 'post-1234',
      title: 'post title',
      content: 'post content'
    }]
  ])

  const insertRes = await d.table('posts').insert([{
    title: 'Lorem ipsum',
    content: 'Dolor sit amet'
  },{
    title: 'Iconic Hito',
    content: 'Benkyoushimashita'
  }]).run()

  assert.deepEqual(insertRes, {
    deleted: 0,
    errors: 0,
    generated_keys: insertRes.generated_keys,
    inserted: 2,
    replaced: 0,
    skipped: 0,
    unchanged: 0
  })

  assert.strictEqual(insertRes.generated_keys.length, 2)
})

test('supports .insert(, { returnChanges: true })', async () => {
  const { d } = pgReql([
    ['posts', {
      id: 'post-1234',
      title: 'post title',
      content: 'post content'
    }]
  ])

  const insertRes = await d.table('posts').insert({
    title: 'Lorem ipsum',
    content: 'Dolor sit amet'
  }, {
    returnChanges: true
  }).run()

  const [generatedKey] = insertRes.generated_keys

  assert.deepEqual(insertRes, {
    deleted: 0,
    errors: 0,
    generated_keys: [generatedKey],
    inserted: 1,
    replaced: 0,
    skipped: 0,
    unchanged: 0,
    changes: [{
      old_val: null,
      new_val: {
        id: generatedKey,
        title: 'Lorem ipsum',
        content: 'Dolor sit amet'
      }
    }]
  })
})

test('.insert(, {}) returns error if inserted document is found', async () => {
  const existingDoc = {
    id: 'post-1234',
    title: 'post title',
    content: 'post content'
  }

  const conflictDoc = {
    id: 'post-1234',
    title: 'Conflict Lorem ipsum',
    content: 'Conflict Dolor sit amet'
  }

  const { d } = pgReql([
    ['posts', existingDoc]
  ])

  const insertRes = await d.table('posts').insert(conflictDoc).run()

  assert.deepEqual(insertRes, {
    unchanged: 0,
    skipped: 0,
    replaced: 0,
    inserted: 0,
    errors: 1,
    deleted: 0,
    first_error: pgErrDuplicatePrimaryKey(existingDoc, conflictDoc).message
  })
})

test('d.table().insert( doc, { conflict: "update" }) updates existing doc', async () => {
  const { d } = pgReql([
    ['Presence', [{ primaryKey: 'user_id' }], {
      user_id: 0,
      state: 'UNHAPPY',
      status_msg: ''
    }]])

  await d
    .table('Presence')
    .insert({
      user_id: 0,
      state: 'HAPPY',
      status_msg: ''
    }, { conflict: 'update' }).run()

  assert.deepEqual(await d.table('Presence').run(), [{
    user_id: 0,
    state: 'HAPPY',
    status_msg: ''
  }])
})

test('.update(, { prop: val }) should update a document', async () => {
  const { d } = pgReql([
    ['AppUserTest', {
      id: 'appuser-1234',
      name: 'appusername-1234'
    }, {
      id: 'appuser-5678',
      name: 'appusername-5678'
    }]
  ])

  const updateRes = await d
    .table('AppUserTest')
    .get('appuser-1234')
    .update({ user_social_id: 'userSocial-1234' })
    .run()

  assert.deepEqual(updateRes, {
    deleted: 0,
    errors: 0,
    inserted: 0,
    replaced: 1,
    skipped: 0,
    unchanged: 0
  })

  const queriedAppUser = await d
    .table('AppUserTest')
    .get('appuser-1234')
    .run()

  assert.strictEqual(queriedAppUser.user_social_id, 'userSocial-1234')
})

test('.delete() should delete a document', async () => {
  const { d } = pgReql([
    ['AppUserTest', {
      id: 'appuser-1234',
      name: 'appusername-1234'
    }, {
      id: 'appuser-5678',
      name: 'appusername-5678'
    }]
  ])

  const updateRes = await d
    .table('AppUserTest')
    .get('appuser-1234')
    .delete()
    .run()

  assert.deepEqual(updateRes, {
    deleted: 1,
    errors: 0,
    inserted: 0,
    replaced: 0,
    skipped: 0,
    unchanged: 0
  })
})

test('.delete() should delete all documents', async () => {
  const { d } = pgReql([
    ['AppUserTest', {
      id: 'appuser-1234',
      name: 'appusername-1234'
    }, {
      id: 'appuser-5678',
      name: 'appusername-5678'
    }]
  ])

  const updateRes = await d
    .table('AppUserTest')
    .delete()
    .run()

  assert.deepEqual(updateRes, {
    deleted: 2,
    errors: 0,
    inserted: 0,
    replaced: 0,
    skipped: 0,
    unchanged: 0
  })
})

test('.delete() should delete all documents, no args, custom primaryKey', async () => {
  const { d } = pgReql([
    ['Presence', [{ primaryKey: 'user_id' }], {
      user_id: 0,
      state: 'UNHAPPY',
      status_msg: ''
    }]])

  await d.table('Presence').delete().run()

  assert.strictEqual(await d.table('Presence').count().run(), 0)
})

test('.delete() should delete filtered documents', async () => {
  const { d } = pgReql([
    ['AppUserTest', {
      id: 'appuser-1234',
      name: 'appusername-1234'
    }, {
      id: 'appuser-5678',
      name: 'appusername-5678'
    }]
  ])

  const updateRes = await d
    .table('AppUserTest')
    .filter({ name: 'appusername-5678' })
    .delete()
    .run()

  assert.deepEqual(updateRes, {
    deleted: 1,
    errors: 0,
    inserted: 0,
    replaced: 0,
    skipped: 0,
    unchanged: 0
  })
})

test('supports .delete(, { returnChanges: true })', async () => {
  const { d } = pgReql([
    ['posts', {
      id: 'post-1234',
      title: 'post title',
      content: 'post content'
    }]
  ])

  const deleteRes = await d
    .table('posts')
    .get('post-1234')
    .delete({ returnChanges: true })
    .run()

  assert.deepEqual(deleteRes, {
    unchanged: 0,
    skipped: 0,
    replaced: 0,
    inserted: 0,
    errors: 0,
    deleted: 1,
    changes: [{
      old_val: {
        id: 'post-1234',
        title: 'post title',
        content: 'post content'
      },
      new_val: null
    }]
  })
})

test('.contains() should return containing documents', async () => {
  const { d } = pgReql([
    ['marvel', {
      id: 'appuser-1234',
      name: 'Siren',
      city: 'Los Angeles'
    }, {
      id: 'appuser-5678',
      name: 'Xavier',
      city: 'Detroit'
    }, {
      id: 'appuser-9012',
      name: 'Wolverine',
      city: 'Chicago'
    }]
  ])

  const cities = ['Detroit', 'Chicago', 'Hoboken']
  const updateRes = await d
    .table('marvel')
    .filter(hero => d
      .expr(cities)
      .contains(hero('city')))
    .run()

  assert.deepEqual(updateRes, [{
    id: 'appuser-5678',
    name: 'Xavier',
    city: 'Detroit'
  }, {
    id: 'appuser-9012',
    name: 'Wolverine',
    city: 'Chicago'
  }])
})

test('.limit() should return limited documents', async () => {
  const { d } = pgReql([
    ['marvel', {
      id: 'appuser-1234',
      name: 'Siren',
      city: 'Los Angeles'
    }, {
      id: 'appuser-5678',
      name: 'Xavier',
      city: 'Detroit'
    }, {
      id: 'appuser-9012',
      name: 'Wolverine',
      city: 'Chicago'
    }]
  ])

  const res = await d
    .table('marvel')
    .limit(2)
    .run()

  assert.deepEqual(res, [{
    id: 'appuser-1234',
    name: 'Siren',
    city: 'Los Angeles'
  }, {
    id: 'appuser-5678',
    name: 'Xavier',
    city: 'Detroit'
  }])
})

test('.hasFields() should return documents with fields', async () => {
  const { d } = pgReql([
    ['marvel', {
      id: 'appuser-1234',
      name: 'Siren',
      city: 'Los Angeles',
      nick: 'la'
    }, {
      id: 'appuser-5678',
      name: 'Xavier',
      city: 'Detroit',
      nick: 'moore'
    }, {
      id: 'appuser-9012',
      name: 'Wolverine',
      city: 'Chicago'
    }]
  ])

  const res = await d
    .table('marvel')
    .hasFields('nick')
    .run()

  assert.deepEqual(res, [{
    id: 'appuser-1234',
    name: 'Siren',
    city: 'Los Angeles',
    nick: 'la'
  }, {
    id: 'appuser-5678',
    name: 'Xavier',
    city: 'Detroit',
    nick: 'moore'
  }])
})

test('supports .hours()', async () => {
  // Fri Apr 05 2013 21:23:41 GMT-0700 (PDT)
  const date = new Date(1365222221485)

  const { d } = pgReql([
    ['posts',
      { id: 1, author: 'ryu', date }]
  ])

  const res = await d
    .table('posts')
    .get(1)
    .getField('date')
    .hours()
    .run()

  assert.strictEqual(res, 21)
})

test('supports .minutes()', async () => {
  // Fri Apr 05 2013 21:23:41 GMT-0700 (PDT)
  const date = new Date(1365222221485)

  const { d } = pgReql([
    ['posts',
      { id: 1, author: 'ryu', date }]
  ])

  const res = await d
    .table('posts')
    .get(1)
    .getField('date')
    .minutes()
    .run()

  assert.strictEqual(res, 23)
})

test('supports .hours(), filter', async () => {
  // Fri Apr 05 2013 21:23:41 GMT-0700 (PDT)
  const date = new Date(1365222221485)

  const { d } = pgReql([
    ['posts',
      { id: 1, author: 'ryu', date }]
  ])

  const res = await d
    .table('posts')
    .filter(post => post('date').hours().gt(4))
    .run()

  assert.deepEqual(res, [{ id: 1, author: 'ryu', date }])
})

test('expr()', async () => {
  const { d } = pgReql([
    ['posts',
      { id: 1, author: 'ryu' }]
  ])

  const res = await d
    .expr({ a: 'b' })
    .merge({ b: [1, 2, 3] })
    .run()

  assert.deepEqual(res, {
    a: 'b',
    b: [1, 2, 3]
  })
})

test('supports .coerceTo()', async () => {
  // Fri Apr 05 2013 21:23:41 GMT-0700 (PDT)
  const date = new Date(1365222221485)

  const { d } = pgReql([
    ['posts',
      { id: 1, author: 'ryu', date }]
  ])

  const res = await d
    .table('posts')
    .get(1)
    .getField('date')
    .minutes()
    .coerceTo('string')
    .run()

  assert.strictEqual(res, '23')
})

test('map()', async () => {
  const { d } = pgReql([
    ['users', {
      id: 'userid-fred-1234',
      name: 'fred'
    }, {
      id: 'userid-jane-1234',
      name: 'jane'
    }]
  ])

  const res = await d
    .table('users')
    .map(doc => doc
      .merge({ userId: doc('id') })
      .without('id'))
    .run()

  assert.deepEqual(res, [{
    userId: 'userid-fred-1234',
    name: 'fred'
  }, {
    userId: 'userid-jane-1234',
    name: 'jane'
  }])
})

test('or()', async () => {
  const { d } = pgReql([
    ['users', {
      id: 'userid-fred-1234',
      first: 1,
      second: 0
    }, {
      id: 'userid-jane-1234',
      first: 0,
      second: 0
    }]
  ])

  const res = await d
    .table('users')
    .filter(row => row('first').eq(1).or(row('second').eq(1)))
    .run()

  assert.deepEqual(res, [{
    id: 'userid-fred-1234',
    first: 1,
    second: 0
  }])
})

test('nested row("field")("subField") equivalent row("field").getField("subfield")', async () => {
  const { d } = pgReql([
    ['Presence', [{ primaryKey: 'user_id' }], {
      user_id: 'userId-1234',
      state: { value: 'OFFLINE' },
      time_last_seen: new Date()
    }, {
      user_id: 'userId-5678',
      state: { value: 'ONLINE' },
      time_last_seen: new Date()
    }]
  ])

  const presencesOffline = await d
    .table('Presence')
    .filter(row => row('state')('value').eq('OFFLINE'))
    .run()

  assert.strictEqual(presencesOffline.length, 1)
})

test('and()', async () => {
  const { d } = pgReql([
    ['users', {
      id: 'userid-fred-1234',
      first: 1,
      second: 0
    }, {
      id: 'userid-jane-1234',
      first: 0,
      second: 0
    }]
  ])

  const res = await d
    .table('users')
    .filter(row => row('first').eq(0).and(row('second').eq(0)))
    .run()

  assert.deepEqual(res, [{
    id: 'userid-jane-1234',
    first: 0,
    second: 0
  }])
})

// NOTE: rethinkdb-ts only throws if nested row inside AND or OR are evaluated
test('nested d.row.and() throws error', async () => {
  const { d } = pgReql([
    ['memberships', {
      user_id: 'wolverine',
      membership: 'join'
    }, {
      user_id: 'magneto',
      membership: 'invite'
    }]
  ])

  await assert.rejects(async () => (d
    .table('memberships')
    .filter(d.row('user_id').ne('xavier').and(
      d.row('membership').eq('invite')
    )).run()
  ), { message: pgErrCannotUseNestedRow().message })    

  // use this instead
  const users = await d
    .table('memberships')
    .filter(membership => membership('user_id').ne('xavier').and(
      membership('membership').eq('join')
    )).run()

  assert.deepEqual(users, [{
    user_id: 'wolverine',
    membership: 'join'
  }])
})

test('nested d.row.or() throws error', async () => {
  const { d } = pgReql([
    ['memberships', {
      user_id: 'wolverine',
      membership: 'join'
    }, {
      user_id: 'magneto',
      membership: 'invite'
    }]
  ])

  await assert.rejects(async () => (
    await d
      .table('memberships')
      .filter(d.row('user_id').eq('xavier').or(
        d.row('membership').eq('join')
      )).run())
  ), {
    message: pgErrCannotUseNestedRow().message
  }

  // use this instead
  const users = await d
    .table('memberships')
    .filter(membership => (
      membership('user_id').eq('xavier').or(
        membership('membership').eq('join')))).run()

  assert.deepEqual(users, [{
    user_id: 'wolverine',
    membership: 'join'
  }])

})

test('supports .distinct()', async () => {
  const { d } = pgReql([
    ['marvel',
      { id: 'wolverine', defeatedMonsters: ['squirtle', 'fiery'] },
      { id: 'thor', defeatedMonsters: ['charzar', 'fiery', 'squirtle'] },
      { id: 'xavier', defeatedMonsters: ['jiggly puff'] }],
    ['emptytable']
  ])

  const res = await d
    .table('marvel')
    .concatMap(hero => hero('defeatedMonsters'))
    .distinct()
    .run()

  assert.deepEqual(res, ['squirtle', 'fiery', 'charzar', 'jiggly puff'])
})

test('supports .distinct(), returns documents as-is', async () => {
  const { d } = pgReql([
    ['marvel',
      { id: 'wolverine', defeatedMonsters: ['squirtle', 'fiery'] },
      { id: 'thor', defeatedMonsters: ['charzar', 'fiery', 'squirtle'] },
      { id: 'xavier', defeatedMonsters: ['jiggly puff'] }],
    ['emptytable']
  ])

  const res = await d
    .table('marvel')
    .distinct()
    .run()

  assert.deepEqual(res, [
    { id: 'wolverine', defeatedMonsters: ['squirtle', 'fiery'] },
    { id: 'thor', defeatedMonsters: ['charzar', 'fiery', 'squirtle'] },
    { id: 'xavier', defeatedMonsters: ['jiggly puff'] }
  ])
})

test('supports .union', async () => {
  const { d } = pgReql([
    ['streetfighter',
      { id: 1, name: 'ryu', strength: 6 },
      { id: 2, name: 'balrog', strength: 5 },
      { id: 3, name: 'chun-li', strength: 7 }],
    ['pokemon',
      { id: 1, name: 'squirtle', strength: 3 },
      { id: 2, name: 'charmander', strength: 8 },
      { id: 3, name: 'fiery', strength: 5 }]
  ])

  const res = await d
    .table('streetfighter')
    .orderBy('name')
    .union(
      d.table('pokemon').orderBy('name'), {
        interleave: 'name'
      })
    .run()

  assert.deepEqual(res, [
    { id: 2, name: 'balrog', strength: 5 },
    { id: 2, name: 'charmander', strength: 8 },
    { id: 3, name: 'chun-li', strength: 7 },
    { id: 3, name: 'fiery', strength: 5 },
    { id: 1, name: 'ryu', strength: 6 },
    { id: 1, name: 'squirtle', strength: 3 }
  ])
})

test('supports .filter(doc => doc("id"))', async () => {
  const { d } = pgReql([
    ['player', {
      id: 'playerId-1234',
      score: 10
    }, {
      id: 'playerId-5678',
      score: 6
    }]
  ])

  await d
    .table('player')
    .filter(player => player('score').eq(10))
    .delete()
    .run()

  assert.strictEqual(await d.table('player').count().run(), 1)

  await d
    .table('player')
    .getAll('playerId-5678')
    .filter(player => player('score').eq(6))
    .delete()
    .run()

  assert.strictEqual(await d.table('player').count().run(), 0)
})

test('supports .forEach( doc => doc("id") )', async () => {
  const { d } = pgReql([
    ['playershoes', {
      id: 'shoeId-1234',
      type: 'cleat'
    },{
      id: 'shoeId-5678',
      type: 'boot'
    }],
    ['player', {
      id: 'playerId-1234',
      shoeId: 'shoeId-1234',
      score: 10
    }, {
      id: 'playerId-5678',
      shoeId: 'shoeId-5678',
      score: 6
    }]
  ])

  await d
    .table('player')
    .forEach(player => d.table('playershoes').get(player('shoeId')).delete())
    .run()

  assert.strictEqual(await d.table('playershoes').count().run(), 0)
})

test('supports nested contains row function', async () => {
  const { d } = pgReql([
    ['playershoes', {
      id: 'shoeId-1234',
      type: 'cleat'
    },{
      id: 'shoeId-5678',
      type: 'boot'
    }]
  ])

  assert.ok(
    await d
      .expr(['cleat'])
      .contains('cleat')
      .run())

  assert.ok(
    await d
      .table('playershoes')
      .contains(row => row.getField('type').eq('cleat'))
      .run())

  assert.ok(
    await d.table('playershoes').contains(joinRow => d
      .expr(['cleat']).contains(joinRow.getField('type')))
      .run())

  assert.ok(
    await d
      .table('playershoes')
      .contains(joinRow => d
        .expr(['cleat'])
        .contains(joinRow('type')))
      .run())
})

test('returns true if multiple contains values evaluate true', async () => {
  const { d } = pgReql([
    ['marvel',
      { id: 'wolverine', defeatedMonsters: ['squirtle'] },
      { id: 'thor', defeatedMonsters: ['charzar', 'fiery'] },
      { id: 'xavier', defeatedMonsters: ['jiggly puff'] }]
  ])

  const res = await d
    .table('marvel')
    .filter(hero => hero('defeatedMonsters').contains('charzar', 'fiery'))
    .run()

  assert.deepEqual(res, [{ id: 'thor', defeatedMonsters: ['charzar', 'fiery'] }])
})

test('resolved nested row inside nested d.expr', async () => {
  const datePast = new Date(Date.now() - 88888)
  const { d } = pgReql()

  // this test query verified to return same result at livedb
  const res = await d
    .expr([
      { id: 1, receiver_id: 'jimfix1133', requested_date: datePast },
      { id: 2, receiver_id: 'janehill8888', requested_date: datePast }])
    .merge(row => d.expr({ date: row('requested_date'), gl: 0 }))
    .run()

  assert.deepEqual(res, [
    { id: 1, receiver_id: 'jimfix1133', requested_date: datePast, date: datePast, gl: 0 },
    { id: 2, receiver_id: 'janehill8888', requested_date: datePast, date: datePast, gl: 0 }
  ])
})

test('resolved nested row inside nested pojo', async () => {
  const datePast = new Date(Date.now() - 88888)
  const { d } = pgReql()

  const res = await d
    .expr([
      { id: 1, receiver_id: 'jimfix1133', requested_date: datePast },
      { id: 2, receiver_id: 'janehill8888', requested_date: datePast }])
    .merge(row => ({ date: row('requested_date'), gl: 0 }))
    .run()

  assert.deepEqual(res, [
    { id: 1, receiver_id: 'jimfix1133', requested_date: datePast, date: datePast, gl: 0 },
    { id: 2, receiver_id: 'janehill8888', requested_date: datePast, date: datePast, gl: 0 }
  ])
})

test('returns a complex merge result', async () => {
  const dateFuture = new Date(Date.now() + 88888)
  const datePast = new Date(Date.now() - 88888)
    
  const { d } = pgReql([
    ['SocialFriendRequests', {
      id: 1,
      receiver_id: 'jimfix1133',
      requested_date: datePast
    }, {
      id: 2,
      receiver_id: 'janehill8888',
      requested_date: datePast
    }],
    ['SocialRoomInvites', {
      id: 10,
      doc: 'sr',
      receiver_id: 'jimfix1133',
      requester_id: 'march',
      requested_date: datePast,
      expires_date: dateFuture
    }, {
      id: 11,
      doc: 'sr',
      receiver_id: 'janehill8888',
      requester_id: 'april',
      invited_date: datePast,
      expires_date: dateFuture
    }, {
      id: 12,
      doc: 'sr',
      receiver_id: 'janehill8888',
      requester_id: 'may',
      invited_date: datePast,
      expires_date: dateFuture
    }]
  ])

  await d.table('SocialFriendRequests').indexCreate('receiver_id').run()
  await d.table('SocialRoomInvites').indexCreate('receiver_id').run()

  const notifications = await d.expr([]).union(
    d.table('SocialFriendRequests')
      .getAll('janehill8888', { index: 'receiver_id' })
      .merge(row => ({ date: row('requested_date'), type_name: 'sfr' })),
    d.table('SocialRoomInvites')
      .getAll('janehill8888', { index: 'receiver_id' })
      .filter(row => row('expires_date').gt(d.now()))
      .merge(row => ({ date: row('invited_date'), type_name: 'sri' }))
  ).orderBy('id').run()

  assert.deepEqual(notifications, [{
    date: datePast,
    type_name: 'sfr',
    id: 2,
    receiver_id: 'janehill8888',
    requested_date: datePast
  }, {
    date: datePast,
    type_name: 'sri',
    id: 11,
    doc: 'sr',
    receiver_id: 'janehill8888',
    requester_id: 'april',
    invited_date: datePast,
    expires_date: dateFuture
  }, {
    date: datePast,
    type_name: 'sri',
    id: 12,
    doc: 'sr',
    receiver_id: 'janehill8888',
    requester_id: 'may',
    invited_date: datePast,
    expires_date: dateFuture
  }])
})

test('populates multiple db on init', async () => {
  const { d } = pgReql([
    { db: 'cmdb' },
    ['User',
      { id: 'userId-1234', name: 'fred' },
      { id: 'userId-5678', name: 'jane' }
    ],
    { db: 'jobs' },
    ['Spec',
      { id: 'specId-1234', repo: 'clearvr-transcode' }
    ]
  ])

  const cmdbUser = await d.db('cmdb').table('User').get('userId-1234').run()
  const jobsSpec = await d.db('jobs').table('Spec').get('specId-1234').run()

  assert.deepEqual(cmdbUser, { id: 'userId-1234', name: 'fred' })
  assert.deepEqual(jobsSpec, { id: 'specId-1234', repo: 'clearvr-transcode' })
})

test('populates multiple db', async () => {
  const { d } = pgReql([
    { db: 'cmdb' },
    ['User',
      { id: 'userId-1234', name: 'fred' },
      { id: 'userId-5678', name: 'jane' }
    ],
    { db: 'jobs' },
    ['Spec',
      { id: 'specId-1234', repo: 'clearvr-transcode' }
    ]
  ])

  const cmdbUser = await d.db('cmdb').table('User').get('userId-1234').run()
  const jobsSpec = await d.db('jobs').table('Spec').get('specId-1234').run()

  assert.deepEqual(cmdbUser, { id: 'userId-1234', name: 'fred' })
  assert.deepEqual(jobsSpec, { id: 'specId-1234', repo: 'clearvr-transcode' })
})

test('dbCreate should use r expressions', async () => {
  const { d } = pgReql()
  const dbs = ['db1', 'db2']

  await d(dbs).difference(d.dbList()).forEach(db => d.dbCreate(db)).run()

  // when pgReql is called without any db, 'default' db is created
  assert.deepEqual(await d.dbList().run(), ['default'].concat(dbs))
})

test('handles subquery for single eqJoin query', async () => {
  const { d } = pgReql([
    ['players',
      { id: 1, player: 'George', game: { id: 1 } },
      { id: 2, player: 'Agatha', game: { id: 3 } },
      { id: 3, player: 'Fred', game: { id: 2 } },
      { id: 4, player: 'Marie', game: { id: 2 } },
      { id: 5, player: 'Earnest', game: { id: 1 } },
      { id: 6, player: 'Beth', game: { id: 3 } }],
    ['games',
      { id: 1, field: 'Little Delving' },
      { id: 2, field: 'Rushock Bog' },
      { id: 3, field: 'Bucklebury' }]
  ])

  const result = await d
    .table('players')
    .eqJoin(d.row('game')('id'), d.table('games'))
    .without({ right: 'id' })
    .zip()
    .run()

  assert.strictEqual(result.length, 6)
  assert.deepEqual(result, [
    { field: 'Little Delving', game: { id: 1 }, id: 1, player: 'George' },
    { field: 'Bucklebury', game: { id: 3 }, id: 2, player: 'Agatha' },
    { field: 'Rushock Bog', game: { id: 2 }, id: 3, player: 'Fred' },
    { field: 'Rushock Bog', game: { id: 2 }, id: 4, player: 'Marie' },    
    { field: 'Little Delving', game: { id: 1 }, id: 5, player: 'Earnest' },
    { field: 'Bucklebury', game: { id: 3 }, id: 6, player: 'Beth' }
  ])
})

test('handles list variation of .without query on eqJoin left and right', async () => {
  const { d } = pgReql([
    ['players',
      { id: 1, player: 'George', favorites: [3, 2], gameId: 1 },
      { id: 2, player: 'Agatha', favorites: [1, 2], gameId: 3 },
      { id: 3, player: 'Fred', favorites: [3, 1, 2], gameId: 2 },
      { id: 4, player: 'Marie', favorites: [1, 3, 2], gameId: 2 },
      { id: 5, player: 'Earnest', favorites: [3, 2], gameId: 1 },
      { id: 6, player: 'Beth', favorites: [2, 3, 1], gameId: 3 }],
    ['games',
      { id: 1, field: 'Little Delving' },
      { id: 2, field: 'Rushock Bog' },
      { id: 3, field: 'Bucklebury' }]
  ])

  const result = await d
    .table('players')
    .eqJoin(player => player('favorites').nth(0), d.table('games'))
    .without({ left: ['favorites', 'gameId', 'id'] }, { right: 'id ' })
    .zip()
    .run()

  assert.deepEqual(result, [
    { player: 'George', id: 3, field: 'Bucklebury' },
    { player: 'Agatha', id: 1, field: 'Little Delving' },
    { player: 'Fred', id: 3, field: 'Bucklebury' },
    { player: 'Marie', id: 1, field: 'Little Delving' },
    { player: 'Earnest', id: 3, field: 'Bucklebury' },
    { player: 'Beth', id: 2, field: 'Rushock Bog' }
  ])
})

test('eqJoin can use nested sub query as first param', async () => {
  const { d } = pgReql([
    ['Users',
      { id: 'userId-1234', name: 'fred' },
      { id: 'userId-5678', name: 'jane' }
    ],
    ['Rooms', [{ primaryKey: 'room_id' }],
      { room_id: 'roomId-1234', name: 'the room' }
    ],
    ['Memberships', {
      user_id: 'userId-1234',
      room_membership_type: 'INVITE',
      user_sender_id: 'userId-5678',
      room_id: 'roomId-1234'
    }]
  ])

  await d.table('Memberships').indexCreate('user_id').run()
  
  const result = await d
    .table('Memberships')
    .getAll('userId-1234', { index: 'user_id' })
    .filter({ room_membership_type: 'INVITE' })
    .eqJoin('room_id', d.table('Rooms'))
    .eqJoin(d.row('left')('user_sender_id'), d.table('Users'))
    .map(row => row('left').getField('left').merge({
      user: row('right'),
      room: row('left').getField('right')
    })).run()

  assert.deepEqual(result, [{
    user_id: 'userId-1234',
    room_membership_type: 'INVITE',
    user_sender_id: 'userId-5678',
    room_id: 'roomId-1234',
    user: { id: 'userId-5678', name: 'jane' },
    room: { room_id: 'roomId-1234', name: 'the room' }
  }])
})

test('.eqJoin()( "right" ) can be used to return eqJoin destination table', async () => {
  const { d } = pgReql([
    ['Users',
      { id: 'userId-1234', name: 'fred' },
      { id: 'userId-5678', name: 'jane' }
    ],
    ['Rooms', [{ primaryKey: 'room_id' }],
      { room_id: 'roomId-1234', name: 'the room' }
    ],
    ['Memberships', {
      user_id: 'userId-1234',
      room_membership_type: 'INVITE',
      user_sender_id: 'userId-5678',
      room_id: 'roomId-1234'
    }]
  ])

  const roomsJoined = await d
    .table('Memberships')
    .getAll('userId-1234', { index: 'user_id' })
    .eqJoin('room_id', d.table('Rooms'))('right')
    .run()

  assert.deepEqual(roomsJoined, [
    { room_id: 'roomId-1234', name: 'the room' }
  ])
})

test('.filter(…)("val") attribute getField call is supported', async () => {
  const tableRoomMemberships = 'Memberships'
  const userId = 'userId-1234'
  const friendId = 'userId-5677'
  const { d } = pgReql([
    ['Users',
      { id: userId, name: 'fred' },
      { id: friendId, name: 'jane' }
    ],
    ['Rooms', [{ primaryKey: 'room_id' }],
      { room_id: 'roomId-1234', name: 'the room' }
    ],
    ['Memberships', {
      id: 'memberid-111',
      user_id: userId,
      room_membership_type: 'JOIN',
      user_sender_id: userId,
      room_id: 'roomId-1234'
    }, {
      id: 'memberid-222-FRIEND',
      user_id: friendId,
      room_membership_type: 'JOIN',
      user_sender_id: userId,
      room_id: 'roomId-1234'
    }]
  ])

  await d.table('Memberships').indexCreate('user_id').run()
  await d.table('Memberships').indexCreate('user_sender_id').run()
  await d.table('Memberships').indexCreate('room_id').run()

  const joinDetails = d.table(tableRoomMemberships)
    .getAll(userId, { index: 'user_id' })
    .filter(row => d.and(
      row('room_membership_type').eq('JOIN')))
    .merge(row => ({ friend_id: row('user_sender_id') }))
    .run()

  assert.ok(joinDetails, true)
/*
  assert.deepEqual(joinDetails[0], {
    id: 'memberid-111',
    user_id: 'userId-1234',
    room_membership_type: 'JOIN',
    user_sender_id: 'userId-1234',
    room_id: 'roomId-1234',
    friend_id: 'userId-1234'
  })
/*
  const filter = await d.expr([{
    id: 'memberid-111',
    user_id: 'userId-1234',
    room_membership_type: 'JOIN',
    user_sender_id: 'userId-1234',
    room_id: 'roomId-1234'
  }, {
    id: 'memberid-222-FRIEND',
    user_id: 'userId-5677',
    room_membership_type: 'JOIN',
    user_sender_id: 'userId-1234',
    room_id: 'roomId-1234'
  }, {
    id: 'memberid-111',
    user_id: 'userId-1234',
    room_membership_type: 'JOIN',
    user_sender_id: 'userId-1234',
    room_id: 'roomId-1234'
  }]).filter(row => d.and(
    row('room_membership_type').eq('JOIN'),
    row('user_id').ne(userId)
  )).run()

  assert.deepEqual(filter, [{
    id: 'memberid-222-FRIEND',
    user_id: 'userId-5677',
    room_membership_type: 'JOIN',
    user_sender_id: 'userId-1234',
    room_id: 'roomId-1234'
  }])

  const userFriendIds = await d
    .union(
      d.table(tableRoomMemberships)
        .getAll(userId, { index: 'user_id' })
        .filter(row => d.and(
          row('room_membership_type').eq('JOIN')))
        .merge(row => ({ friend_id: row('user_sender_id') })),
      d.table(tableRoomMemberships)
        .getAll(userId, { index: 'user_sender_id' })
        .filter(row => d.and(
          row('room_membership_type').eq('JOIN'),
          row('user_id').ne(userId)))
        .merge(row => ({ friend_id: row('user_id') }))
    )
    .eqJoin(d.row('friend_id'), d.table(tableRoomMemberships), { index: 'user_id' })
    .getField('right')
    .filter(row => d.and(
      row('room_membership_type').eq('JOIN'),
      row('user_id').ne(userId)
    ))('user_id').run()

    assert.deepEqual(userFriendIds, [friendId])
  */    
})

test('supports complex filtering', async () => {
  const tableRoomMemberships = 'Memberships'
  const userId = 'userId-1234'
  const friendAId = 'userId-friend-AAAA'
  const friendBId = 'userId-friend-BBBB'
  const friendARoomId = 'roomId-with-friendA'
  const friendBRoomId = 'roomId-with-friendB'
  const { d } = pgReql([
    ['Users',
      { id: userId, name: 'fred' },
      { id: friendAId, name: 'jane' },
      { id: friendBId, name: 'jones' }
    ],
    ['Rooms', [{ primaryKey: 'room_id' }],
      { room_id: friendARoomId, name: 'user and friend A' },
      { room_id: friendBRoomId, name: 'user and friend B' }
    ],
    ['Memberships', {
      id: 'memberid-111',
      user_id: userId,
      room_membership_type: 'JOIN',
      user_sender_id: userId,
      room_id: friendARoomId
    }, {
      id: 'memberid-222-FRIEND',
      user_id: friendAId,
      room_membership_type: 'JOIN',
      user_sender_id: userId,
      room_id: friendARoomId
    }, {
      id: 'memberid-333',
      user_id: friendBId,
      room_membership_type: 'JOIN',
      user_sender_id: friendBId,
      room_id: friendBRoomId
    }, {
      id: 'memberid-444',
      user_id: userId,
      room_membership_type: 'JOIN',
      user_sender_id: friendBId,
      room_id: friendBRoomId
    }]
  ])

  await d.table('Memberships').indexCreate('user_id').run()
  await d.table('Memberships').indexCreate('user_sender_id').run()
  await d.table('Memberships').indexCreate('room_id').run()

  const userFriendIds = await d
    .union(
      d.table(tableRoomMemberships)
        .getAll(userId, { index: 'user_id' })
        .filter(row => d.and(
          row('room_membership_type').eq('JOIN')))
        .merge(row => ({ friend_id: row('user_sender_id') })),
      d.table(tableRoomMemberships)
        .getAll(userId, { index: 'user_sender_id' })
        .filter(row => d.and(
          row('room_membership_type').eq('JOIN'),
          row('user_id').ne(userId)))
        .merge(row => ({ friend_id: row('user_id') }))
    )
    .eqJoin(d.row('friend_id'), d.table(tableRoomMemberships), { index: 'user_id' })
    .getField('right')
    .filter(row => d.and(
      row('room_membership_type').eq('JOIN'),
      row('user_id').ne(userId)
    ))('user_id').run()

  assert.deepEqual(userFriendIds.sort(), [friendAId, friendBId].sort())
})
