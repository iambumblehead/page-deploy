import test from 'node:test'
import assert from 'node:assert/strict'
import pgReql from '../src/pgReql.js'

const msfrom = {
  weeks: n => Math.round(n * 6048e5)
}

test('expressions is older than date, true', async () => {
  const { d } = pgReql()
  const minAgeMs = msfrom.weeks(2)
  const givenAgeMs = Date.now() - msfrom.weeks(2.8)
    
  const res = await d
    .epochTime(new Date(givenAgeMs))
    .lt(d.epochTime(Date.now() - minAgeMs)).run()

  assert.ok(res)
})

test('expressions is older than date, false', async () => {
  const { d } = pgReql()
  const minAgeMs = msfrom.weeks(3)
  const givenAgeMs = Date.now() - msfrom.weeks(2.8)
    
  const res = await d
    .epochTime(new Date(givenAgeMs))
    .lt(d.epochTime(Date.now() - minAgeMs)).run()

  assert.ok(!res)
})

test('date filter, documents older than', async () => {
  const { d } = pgReql([
    ['users', {
      id: 'userId-expired-1234',
      time_last_seen: new Date(Date.now() - msfrom.weeks(3.2))
    }, {
      id: 'userId-fresh-1234',
      time_last_seen: new Date(Date.now() - msfrom.weeks(2.8))
    }]
  ])

  // epoch time is seconds: https://rethinkdb.com/api/javascript/to_epoch_time/
  // javascript time is milliseconds
  //
  // convert javascript times to rethink times div 1000
  const minAgeMs = msfrom.weeks(3)
  const usersRowFunction = await d
    .table('users')
    .filter(row => row('time_last_seen').lt(
      d.epochTime((Date.now() - minAgeMs) / 1000)))
    .run()

  const usersRowEmbed = await d
    .table('users')
    .filter(d.row('time_last_seen').lt(
      d.epochTime((Date.now() - minAgeMs) / 1000)))
    .run()    

  assert.strictEqual(usersRowFunction.length, 1)
  assert.strictEqual(usersRowEmbed.length, 1)
})
