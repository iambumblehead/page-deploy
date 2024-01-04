import test from 'node:test'
import assert from 'node:assert/strict'
import url from 'node:url'

import {
  pgscript_helpercreate
} from '../src/pgscript.js'

import {
  pgnode_specpathget as pgnode_specurlcreate
} from '../src/pgnode.js'

const uicheckbox = pgscript_helpercreate('uicheckbox')

test("specpathget should return the correct specpath, root", () => {
  const nodebox = uicheckbox('checkbox', { value: true })
  const parenturl = url.pathToFileURL('/app/src/spec/view/root/spec-baseLocale.json')
  const nodeurl = pgnode_specurlcreate({}, nodebox, parenturl)

  assert.strictEqual(
    String(nodeurl),
    String(url.pathToFileURL('/app/src/spec/view/checkbox/spec-baseLocale.json')))
})

test("specpathget should return the correct specpath, not root", () => {
  const nodebox = uicheckbox('checkbox', { value: true })
  const parenturl = url.pathToFileURL('/app/src/spec/view/list/spec-baseLocale.json')
  const nodeurl = pgnode_specurlcreate({}, nodebox, parenturl)

  assert.strictEqual(
    String(nodeurl),
    String(url.pathToFileURL('/app/src/spec/view/list-checkbox/spec-baseLocale.json')))
});

test("specpathget should use pg name, if no name is specified", () => {
  const nodebox = uicheckbox({ value: true })
  const parenturl = url.pathToFileURL('/app/src/spec/view/list/spec-baseLocale.json')
  const nodeurl = pgnode_specurlcreate({}, nodebox, parenturl)

  assert.strictEqual(
    String(nodeurl),
    String(url.pathToFileURL('/app/src/spec/view/list-uicheckbox/spec-baseLocale.json')))
});
