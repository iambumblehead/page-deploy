import test from 'node:test'
import assert from 'node:assert/strict'
import pgReql from '../src/pgReql.js'

test('ReqlUserError', async () => {
  const { d } = pgReql()

  await assert.rejects(async () => (
    d.branch(d.error('a'), 1, 2).run()
  ), {
    message: 'a'
  })
})
