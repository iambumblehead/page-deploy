import url from 'node:url'
import util from 'node:util'
import test from 'node:test'
import assert from 'node:assert/strict'
import deploy_imgprocess from '../src/deploy_imgprocess.js'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

test("getisofilenamearr should return iso filenames", async () => {
  const str = 'mock/support/img/saint-christopher.png#pd.fit:1000'
  const filename = `${__dirname}mock/langLocale.spec`
  const article = {}
  const res = await util.promisify(deploy_imgprocess.processembeddedimgref)({
    metaurl: import.meta.url,
    inputDir: __dirname,
    outputDir: __dirname,
    datetitlesubdirs: [
      'subdirs'
    ]
  }, filename, str, article)

  assert.ok(res)
})
