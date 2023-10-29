import url from 'node:url'
import util from 'node:util'
import test from 'node:test'
import assert from 'node:assert/strict'
import esmock from 'esmock'
import timezone_mock from 'timezone-mock'

timezone_mock.register('US/Pacific')

test("getsimilarfilename should return similar file", async () => {
  const deploy_pattern = await esmock('../src/deploy_pattern.js', {
    '../src/deploy_file.js': {
      readdir: (dir, fn) => fn(null, [ 'spec-ES.md' ])
    }
  })

  let path = await util.promisify(
    deploy_pattern.getsimilarfilename)('/input/spec-ES.json', {})

  assert.deepEqual([ 'spec-ES.md' ], path)
})

test("getsimilarfilename should not return the same file", async () => {
  const deploy_pattern = await esmock('../src/deploy_pattern.js', {
    '../src/deploy_file.js': {
      readdir: (dir, fn) => fn(null, [ 'spec-ES.json' ])
    }
  })

  let path = await util.promisify(
    deploy_pattern.getsimilarfilename)('/input/spec-ES.json', {})

  assert.deepEqual([], path)
})

// eslint-disable-next-line max-len
test("updatelangdefs should update definitions of lang properties", async () => {
  const deploy_pattern = await esmock('../src/deploy_pattern.js')

  let updatedobj = await util.promisify(deploy_pattern.updatelangdefs)({
    node: "nodetype",
    name: "nodename",
    child: [ {
      node: "childnodetype",
      name: "childnodename",
      subj: [ {
        label: "label",
        labelanchor: "pd.langkey.labelanchor"
      } ]
    }, {
      node: "childnode2type",
      name: "childnode2name",
      subj: [ "pd.langobj" ]
    }, {
      type: "local-ref",
      path: "../page-about-points-readable-json"
    } ]
  }, {
    labelanchor: 'labelanchor'
  })

  assert.strictEqual(updatedobj.child[0].subj[0].labelanchor, 'labelanchor')
  assert.strictEqual(updatedobj.child[1].subj[0].labelanchor, 'labelanchor')
})

test("updatelangkeys should update keys of lang properties", async () => {
  const deploy_pattern = await esmock('../src/deploy_pattern.js')

  let updatedobj = await util.promisify(deploy_pattern.updatelangkeys)({
    label: { langkey: 'langkeya' },
    obj: { langobj: true }
  }, {
    langkeya: 'langkey-value'
  })

  assert.deepEqual(updatedobj, {
    label: 'langkey-value',
    obj: { langkeya: 'langkey-value' }
  })
})

test("getdatetitlestampoutputpath should return outputdir", async () => {
  const deploy_pattern = await esmock('../src/deploy_pattern.js')

  assert.strictEqual(
    deploy_pattern.getdatetitlestampoutputpath('/path/to/base-lang.json', {
      title: 'articletitle',
      timeDate: 1222580700000
    }, {}),
    '/path/2008.09.27-articletitle/base-lang.json'
  )
})

test("getdatetitlestamp should return outputdir", async () => {
  const deploy_pattern = await esmock('../src/deploy_pattern.js')

  assert.strictEqual(
    deploy_pattern.getdatetitlestamp(1222580700000, 'articletitle'),
    '2008.09.27-articletitle'
  )
})

test("getuniversefilepath should return universe filepath", async () => {
  const deploy_pattern = await esmock('../src/deploy_pattern.js')

  assert.strictEqual(
    deploy_pattern.getuniversefilepath('/path/to/spec-ES.md'),
    '/path/universal/spec-ES.json'
  )
})

test("getasoutputpath should return datetitle outputdir", async () => {
  const deploy_pattern = await esmock('../src/deploy_pattern.js')

  assert.strictEqual(
    deploy_pattern.getasoutputpath({
      outputDir: '/path/to/outputDir',
      inputDir: '/path/to/inputDir',
      datetitlesubdirs: [ '/data/' ]
    }, '/path/to/inputDir/data/spec-ES.md', {
      title: 'articletitle',
      timeDate: 1222580700000
    }),
    '/path/to/outputDir/2008.09.27-articletitle/ES.json'
  )

  const __dirname = url
    .fileURLToPath(new URL('.', import.meta.url))

  assert.strictEqual(
    deploy_pattern.getasoutputpath({
      outputDir: __dirname,
      inputDir: __dirname,
      datetitlesubdirs: [ '/data/' ]
    }, `${__dirname}data/spec-ES.md`, {
      title: 'articletitle',
      timeDate: 1222580700000
    }),
    `${__dirname}2008.09.27-articletitle/ES.json`
  )
})
