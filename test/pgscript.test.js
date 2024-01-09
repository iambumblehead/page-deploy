import test from 'node:test'
import assert from 'node:assert/strict'
import {
  pgscript_helpercreate
} from '../src/pgscript.js'

const {
  gnpgdata,
  gnpgdatals,
  uispread,
  uicheckbox
} = [
  'gnpgdata',
  'gnpgdatals',
  'uispread',
  'uicheckbox'
].reduce((ac, n) => (
  Object.assign(ac, { [n]: pgscript_helpercreate(n) })
), {})

test("helper should return valid node", () => {
  const nodepre = gnpgdata('error', {
    subj: {
      isopen: true,
      errmsg: 'errmsg',
      errtype: 'errtype'
      // errmsg: ['ns.base.errmsg', 'an error has ocurred'],
      // errtype: ['ns.base.errtype', 1]
    }
  })()

  assert.deepStrictEqual(
    nodepre.nodechilds, null)
  assert.deepStrictEqual(
    nodepre.nodespec, {
      name: 'error',
      node: 'gnpgdata',
      subj: {
        isopen: true,
        errmsg: 'errmsg',
        errtype: 'errtype'
        // errmsg: ['ns.base.errmsg', 'an error has ocurred'],
        // errtype: ['ns.base.errtype', 1]
      }
    })
})

test("helper should auto-nest subj namespace as default", () => {
  const nodepre = gnpgdata('error', {
    isopen: true,
    errmsg: 'errmsg',
    errtype: 'errtype'
  })()

  assert.deepStrictEqual(
    nodepre.nodespec, {
      name: 'error',
      node: 'gnpgdata',
      subj: {
        isopen: true,
        errmsg: 'errmsg',
        errtype: 'errtype'
      }
    })
})
