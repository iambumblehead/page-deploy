import test from 'node:test'
import assert from 'node:assert/strict'

import {
  pgMdParse,

  metaTimeDate,
  metaTitle,
  metaAuthor,
  metaExcerpt,
  metaInlineItems,
  pgmdmetaextractinline,
  pgmdmetaextractfields
} from '../src/pgMd.js'

test('metaextractinline should parse metaTimeDate', () => {
  const md = [
    '[meta:type]: <> (blog)',
    '[meta:ispublished]: <> (true)',
    '',
    '',
    '★ dragonfly',
    '===========',
    '`✑ bumblehead`',
    '_⌚ Fri Nov 25 2016 12:06:00 GMT-0800 (Pacific Standard Time)_',
    '',
    'hello everyone!'
  ].join('\n')
  
  const res = pgmdmetaextractinline(
    md, metaTimeDate)

  assert.strictEqual(
    res[0], [
      '[meta:type]: <> (blog)',
      '[meta:ispublished]: <> (true)',
      '',
      '',
      '★ dragonfly',
      '===========',
      '`✑ bumblehead`',
      '',
      'hello everyone!'
    ].join('\n'))
  assert.strictEqual(
    res[1], 'timedate')
  assert.strictEqual(
    res[2], 'Fri Nov 25 2016 12:06:00 GMT-0800 (Pacific Standard Time)')
})

test('metaextractinline should parse metaTitle', () => {
  const md = [
    '[meta:type]: <> (blog)',
    '[meta:ispublished]: <> (true)',
    '',
    '',
    '★ dragonfly',
    '===========',
    '`✑ bumblehead`',
    '_⌚ Fri Nov 25 2016 12:06:00 GMT-0800 (Pacific Standard Time)_',
    '',
    'hello everyone!'
  ].join('\n')
  
  const res = pgmdmetaextractinline(
    md, metaTitle)

  assert.strictEqual(
    res[0], [
      '[meta:type]: <> (blog)',
      '[meta:ispublished]: <> (true)',
      '',
      '',
      '`✑ bumblehead`',
      '_⌚ Fri Nov 25 2016 12:06:00 GMT-0800 (Pacific Standard Time)_',
      '',
      'hello everyone!'
    ].join('\n'))
  assert.strictEqual(
    res[1], 'title')
  assert.strictEqual(
    res[2], 'dragonfly')
})

test('metaextractinline should parse metaAuthor', () => {
  const md = [
    '[meta:type]: <> (blog)',
    '[meta:ispublished]: <> (true)',
    '',
    '',
    '★ dragonfly',
    '===========',
    '`✑ bumblehead`',
    '_⌚ Fri Nov 25 2016 12:06:00 GMT-0800 (Pacific Standard Time)_',
    '',
    'hello everyone!'
  ].join('\n')
  
  const res = pgmdmetaextractinline(
    md, metaAuthor)

  assert.strictEqual(
    res[0], [
      '[meta:type]: <> (blog)',
      '[meta:ispublished]: <> (true)',
      '',
      '',
      '★ dragonfly',
      '===========',      
      '_⌚ Fri Nov 25 2016 12:06:00 GMT-0800 (Pacific Standard Time)_',
      '',
      'hello everyone!'
    ].join('\n'))
  assert.strictEqual(
    res[1], 'author')
  assert.strictEqual(
    res[2], 'bumblehead')
})

test('pgmdextractfields should parse all markdown fields', () => {
  const md = [
    '[meta:title]: <> (copy)',
    '[meta:timedate]: <> ":datetimestr"'
      .replace(/:datetimestr/, new Date(1480104360000)),
    '[meta:type]: <> (blog)',
    '[meta:ispublished]: <> (true)',
    '[meta:tagsArr]: <> (software,art, flow)',
    '[meta:isComments]: <> (false)',
    '[meta:ispublished]: <> (true)',
    '',
    '',
    '★ dragonfly',
    '===========',
    '`✑ bumblehead`',
    '_⌚ Fri Nov 25 2016 12:06:00 GMT-0800 (Pacific Standard Time)_',
    '',
    'hello everyone!'
  ].join('\n')

  const res = pgmdmetaextractfields(md)

  assert.deepStrictEqual(res[1], {
    title: 'copy',
    timedate: new Date(1480104360000).getTime(),
    type: 'blog',
    ispublished: true,
    tagsArr: ['software', 'art', 'flow'],
    isComments: false
  })
})

test('pgMdParse should parse a markdown file, metafields only', () => {
  const md = [
    '[meta:timedate]: <> ":datetimestr"'
      .replace(/:datetimestr/, new Date(1480104360000)),
    '[meta:title]: <> (copy)',
    '',
    '© [bumblehead][0]',
    '',
    '[0]: mailto:chris@bumblehead.com'
  ].join('\n')
  
  assert.deepStrictEqual(pgMdParse('test.md', md), {
    content: '<p>© <a href="mailto:chris@bumblehead.com">bumblehead</a></p>\n',
    timedate: new Date(1480104360000).getTime(),
    title: 'copy'
  })
})


test('pgMdParse should parse a markdown file, metafields and inline', () => {
  const md = [
    '[meta:type]: <> (blog)',
    '[meta:tagsArr]: <> (software,art)',
    '[meta:isComments]: <> (false)',
    '[meta:ispublished]: <> (true)',
    '',
    '',
    '★ dragonfly',
    '===========',
    '`✑ bumblehead`',
    '_⌚ Fri Nov 25 2016 12:06:00 GMT-0800 (Pacific Standard Time)_',
    '',
    '![sceenfetch dragonfly][21]',
    '',
    '**I installed DragonFly BSD on a Dell ultraportable, the XPS13 9343.**',
    ' OpenBSD supports [most of the XPS hardware][10] since the last year or',
    ' so and maybe I should have used that instead.…',
    '',
    'Before I started, I did some research and quick-installed FreeBSD,',
    ' OpenBSD and DragonFly BSD on the XPS13. On all three, I installed',
    ' Gnome3 desktop. OpenBSD was the easiest one to install and everything',
    ' there seemed to work right away (minus the touchpad issue described',
    ' later). Among the BSDs, OpenBSD is often the best choice for recent',
    ' hardware support.',
    '',
    '[10]: https://marc.info/?l=openbsd-misc&w=2&r=1&s=dell+xps+13',
    '[21]: support/screenfetch.png'
  ].join('\n')

  assert.deepStrictEqual(pgMdParse('test.md', md), {
    type: 'blog',
    tagsArr: [ 'software', 'art' ],
    isComments: false,
    ispublished: true,
    timedate: new Date(1480104360000).getTime(),
    title: 'dragonfly',
    author: 'bumblehead',
    content: [
      '<p><img src="support/screenfetch.png" alt="sceenfetch dragonfly"></p>',
      '<p><strong>'
        + 'I installed DragonFly BSD on a Dell ultraportable, the XPS13 9343.'
        + '</strong>',
      ' OpenBSD supports '
        + '<a href="https://marc.info/?l=openbsd-misc&w=2&r=1&s=dell+xps+13">'
        + 'most of the XPS hardware</a> since the last year or',
      ' so and maybe I should have used that instead.</p>',
      '<p>Before I started, I did some research and quick-installed FreeBSD,',
      ' OpenBSD and DragonFly BSD on the XPS13. On all three, I installed',
      ' Gnome3 desktop. OpenBSD was the easiest one to install and everything',
      ' there seemed to work right away (minus the touchpad issue described',
      ' later). Among the BSDs, OpenBSD is often the best choice for recent',
      ' hardware support.</p>'
    ].join('\n')+ '\n',

    excerpthtml: [
      '<strong>'
        + 'I installed DragonFly BSD on a Dell ultraportable, the XPS13 9343.'
        + '</strong>',
      ' OpenBSD supports '
        + '<a href="https://marc.info/?l=openbsd-misc&w=2&r=1&s=dell+xps+13">'
        + 'most of the XPS hardware</a> since the last year or',
      ' so and maybe I should have used that instead.'
    ].join('\n'),
    excerptnohtml: [
      'I installed DragonFly BSD on a Dell ultraportable, the XPS13 9343.',
      ' OpenBSD supports most of the XPS hardware since the last year or',
      ' so and maybe I should have used that instead.'
    ].join('\n')
  })
})
