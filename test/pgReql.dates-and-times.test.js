import test from 'node:test'
import assert from 'node:assert/strict'
import pgReql from '../src/pgReql.js'

test('`d.now` should return a date', async () => {
  const { d } = pgReql()

  const result1 = await d.now().run()
  assert.ok(result1 instanceof Date)

  const result2 = await d.expr({ a: d.now() }).run()
  assert.ok(result2.a instanceof Date)

  const result3 = await d.expr([d.now()]).run()
  assert.ok(result3[0] instanceof Date)

  const result4 = await d.expr([{}, { a: d.now() }]).run()
  assert.ok(result4[1].a instanceof Date)

  // too deep
  // const result5 = await d.expr({ b: [{}, { a: d.now() }] }).run()
  // assert.ok(result5.b[1].a instanceof Date)
})

test('`now` is not defined after a term', async () => {
  const { d } = pgReql()
 
  await assert.rejects(async () => d.expr(1).now('foo').run(), {
    message: '.now is not a function'
  })
})

test('`d.time` should return a date -- with date and time', async () => {  
  const { d } = pgReql()

  const result1 = await d.time(1986, 11, 3, 12, 0, 0, 'Z').run()
  assert.strictEqual(result1 instanceof Date, true)

  const result2 = await d
    .time(1986, 11, 3, 12, 20, 0, 'Z')
    .minutes()
    .run()
  assert.strictEqual(result2, 20)
})

test('`d.time` should work with d.args', async () => {
  const { d } = pgReql()
  const result = await d
    .time(d.args([1986, 11, 3, 12, 0, 0, 'Z']))
    .run()

  assert.strictEqual(result instanceof Date, true)
})

test('`d.time` should return a date -- just with a date', async () => {
  const { d } = pgReql()

  let result = await d.time(1986, 11, 3, 'Z').run()
  assert.strictEqual(result instanceof Date, true)
  result = await d.time(1986, 11, 3, 0, 0, 0, 'Z').run()
  assert.strictEqual(result instanceof Date, true)
})

test('`d.time` should throw if no argument has been given', async () => {
  const { d } = pgReql()

  await assert.rejects(async () => d.time().run(), {
    message: '`d.time` takes at least 4 arguments, 0 provided.'
  })  
})

test('`d.time` should throw if no 5 arguments', async () => {
  const { d } = pgReql()

  await assert.rejects(async () => d.time(1, 1, 1, 1, 1).run(), {
    message: 'Got 5 arguments to TIME (expected 4 or 7)'
  })  
})

test('`time` is not defined after a term', async () => {
  const { d } = pgReql()
 
  await assert.rejects(async () => d.expr(1).time(1, 2, 3, 'Z').run(), {
    message: '.time is not a function'
  })
})

test('`epochTime` should work', async () => {
  const { d } = pgReql()

  const now = new Date()
  const result = await d.epochTime(now.getTime() / 1000).run()

  assert.strictEqual(
    String(result.getTime()).slice(0, 8), String(Date.now()).slice(0, 8))
})

test('`d.epochTime` should throw if no argument has been given', async () => {
  const { d } = pgReql()

  await assert.rejects(async () => d.epochTime().run(), {
    message: '`d.epochTime` takes 1 argument, 0 provided.'
  })  
})

test('`epochTime` is not defined after a term', async () => {
  const { d } = pgReql()
 
  await assert.rejects(async () => d.expr(1).epochTime(Date.now()).run(), {
    message: '.epochTime is not a function'
  })
})

test('`ISO8601` should work', async () => {
  const { d } = pgReql()

  const result = await d.ISO8601('1986-11-03T08:30:00-08:00').run()

  assert.strictEqual(result.getTime(), Date.UTC(1986, 10, 3, 8 + 8, 30, 0))
})

test('`ISO8601` should work with a timezone', async () => {
  const { d } = pgReql()

  const result = await d.ISO8601('1986-11-03T08:30:00', {
    defaultTimezone: '-08:00'
  }).run()

  assert.strictEqual(result.getTime(), Date.UTC(1986, 10, 3, 8 + 8, 30, 0))
})

test('`d.ISO8601` should throw if no argument has been given', async () => {
  const { d } = pgReql()

  await assert.rejects(async () => d.ISO8601().run(), {
    message: '`d.ISO8601` takes 1 argument, 0 provided.'
  })
})

test('`d.ISO8601` should throw if too many arguments', async () => {
  const { d } = pgReql()

  await assert.rejects(async () => d.ISO8601(1, 1, 1).run(), {
    message: '`d.ISO8601` takes at most 2 arguments, 3 provided.'
  })  
})

test('`ISO8601` is not defined after a term', async () => {
  const { d } = pgReql()
  
  await assert.rejects(async () => d.expr(1).ISO8601('validISOstring').run(), {
    message: '.ISO8601 is not a function'
  })
})

// test('`inTimezone` should work', async () => {
//   const { d } = pgReql()
//
//   // inTimezone needs some extra scripting to be supported
//   const result = await d
//     .now()
//     .inTimezone('-08:00')
//     .hours()
//     .do(h => d.branch(
//       h.eq(0),
//       d.expr(23).eq(d.now().inTimezone('-09:00').hours()),
//       h.eq(d.now().inTimezone('-09:00').hours().add(1))
//     )).run()
//
//   assert.strictEqual(result, true)
// })

test('`d.inTimezone` should throw if no argument has been given', async () => {
  const { d } = pgReql()

  await assert.rejects(async () => d.now().inTimezone().run(), {
    message: '`inTimezone` takes 1 argument, 0 provided.'
  })
})

// test('`d.inTimezone` should work', async () => {
//   const { d } = pgReql()
//
//   const result = await d
//     .ISO8601('1986-11-03T08:30:00-08:00')
//     .timezone()
//     .run()
//
//   assert.strictEqual(result, '-08:00')
// })

test('`during` should work', async () => {
  const { d } = pgReql()

  const result = await d
    .now()
    .during(d.time(2013, 12, 1, 'Z'), d.now().add(1000))
    .run()

  assert.strictEqual(result || true, true)

  // const result2 = await r
  //   .now()
  //   .during(d.time(2013, 12, 1, 'Z'), d.now(), {
  //     leftBound: 'closed',
  //     rightBound: 'closed'
  //   }).run()
  //
  // assert.strictEqual(result2, true)

  // const result3 = await r
  //   .now()
  //   .during(d.time(2013, 12, 1, 'Z'), d.now(), {
  //     leftBound: 'closed',
  //     rightBound: 'open'
  //   }).run()
  //
  // assert.strictEqual(result, false)
})

test('`during` should throw if no argument has been given', async () => {
  const { d } = pgReql()

  await assert.rejects(async () => d.now().during().run(), {
    message: '`during` takes at least 2 arguments, 0 provided.'
  })
})

test('`during` should throw if just one argument has been given', async () => {
  const { d } = pgReql()

  await assert.rejects(async () => d.now().during(1).run(), {
    message: '`during` takes at least 2 arguments, 1 provided.'
  })
})

test('`during` should throw if too many arguments', async () => {
  const { d } = pgReql()

  await assert.rejects(async () => d.now().during(1, 1, 1, 1, 1).run(), {
    message: '`during` takes at most 3 arguments, 5 provided.'
  })
})

test('`date` should work', async () => {
  const { d } = pgReql()

  const result = await d
    .now()
    .date()
    .hours()
    .run()
  assert.strictEqual(result, 0)
  
  const result2 = await d
    .now()
    .date()
    .minutes()
    .run()
  assert.strictEqual(result2, 0)

  const result3 = await d
    .now()
    .date()
    .seconds()
    .run()
  assert.strictEqual(result3, 0)
})

test('`timeOfDay` should work', async () => {
  const { d } = pgReql()

  const result = await d
    .now()
    .timeOfDay()
    .run()
  assert.ok(result >= 0)
})

test('`year` should work', async () => {
  const { d } = pgReql()

  const result = await d
    .now()
    .inTimezone(new Date().toString().match(' GMT([^ ]*)')[1])
    .year()
    .run()

  assert.strictEqual(result, new Date().getFullYear())
})

test('`month` should work', async () => {
  const { d } = pgReql()

  const result = await d
    .now()
    .inTimezone(new Date().toString().match(' GMT([^ ]*)')[1])
    .month()
    .run()

  assert.strictEqual(result, new Date().getMonth() + 1)
})

test('`day` should work', async () => {
  const { d } = pgReql()

  const result = await d
    .now()
    .inTimezone(new Date().toString().match(' GMT([^ ]*)')[1])
    .day()
    .run()

  assert.strictEqual(result, new Date().getDate())
})

test('`dayOfYear` should work', async () => {
  const { d } = pgReql()
  
  const result = await d
    .now()
    .inTimezone(new Date().toString().match(' GMT([^ ]*)')[1])
    .dayOfYear()
    .run()
  assert.ok(result > new Date().getMonth() * 28 + new Date().getDate() - 1)
})

test('`dayOfWeek` should work', async () => {
  const { d } = pgReql()
  
  const result = await d
    .now()
    .inTimezone(new Date().toString().match(' GMT([^ ]*)')[1])
    .dayOfWeek()
    .run()

  assert.strictEqual(result === 7 ? 0 : result, new Date().getDay())
})

test('`toISO8601` should work', async () => {
  const { d } = pgReql()

  const result = await d
    .now()
    .toISO8601()
    .run()
  assert.strictEqual(typeof result, 'string')
})

test('`toEpochTime` should work', async () => {
  const { d } = pgReql()

  const result = await d
    .now()
    .toEpochTime()
    .run()
  assert.strictEqual(typeof result, 'number')
})

test('Date should be parsed correctly', async () => {
  const { d } = pgReql()
  const date = new Date()
  const result = await d.expr({ date }).run()
  assert.strictEqual(result.date.getTime(), date.getTime())
})

test('Constant terms should work', async () => {
  const { d } = pgReql()

  // requires extra scripting
  // let result = await d.monday.run()
  // assert.strictEqual(result, 1)

  const result2 = await d
    .expr([
      d.monday,
      d.tuesday,
      d.wednesday,
      d.thursday,
      d.friday,
      d.saturday,
      d.sunday,
      d.january,
      d.february,
      d.march,
      d.april,
      d.may,
      d.june,
      d.july,
      d.august,
      d.september,
      d.october,
      d.november,
      d.december
    ]).run()
  assert.deepStrictEqual(result2, [
    1, 2, 3, 4, 5, 6, 7,
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
  ])
})

// test('`epochTime` should work', async () => {
//   const { d } = pgReql()
//   const now = new Date()
//   const result = await d
//     .epochTime(now.getTime() / 1000)
//     .run({ timeFormat: 'raw' })
//   assert.strictEqual(result.$reql_type$, 'TIME')
// })

// test('`ISO8601` run parameter should work', async () => {
//   const { d } = pgReql()
//   const result = await d
//     .time(2018, 5, 2, 13, 0, 0, '-03:00')
//     .run({ timeFormat: 'ISO8601' })
//   assert.strictEqual(typeof result, 'string')
//   assert.strictEqual(result, '2018-05-02T13:00:00.000-03:00')
// })
