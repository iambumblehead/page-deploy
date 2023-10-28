// Filename: fileconverter.spec.js  
// Timestamp: 2017.04.09-01:37:56 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

const test = require('node:test'),
      assert = require('node:assert/strict'),
      os = require('os'),
      path = require('path'),
      deploy_fileconvert = require('../src/deploy_fileconvert'),

      homedir = os.homedir();

// in ./inputs/name
// out $HOME/software/pocket-markdown-converter/ \
//   getStarted/convert/page-object/forms/sign-up/inputs/name/baseLocale.json
test("getRefPathFilename should ", () => {
  const baseLangMDPath = path.join(homedir, 'test/baseLang.md');

  assert.strictEqual(
    deploy_fileconvert.getRefPathFilename(baseLangMDPath, './inputs/name'),
    path.join(homedir, 'test/inputs/name/baseLang.md')
  );
});

// in ./inputs/name
// out $HOME/Software/pocket-markdown-converter/ \
//   getStarted/convert/page-object/forms/sign-up/inputs/name/baseLocale.json
test("getRefPath should ", () => {
  const baseLangMDPath = path.join(homedir, 'test/baseLang.md');

  assert.strictEqual(
    deploy_fileconvert.getRefPath(baseLangMDPath, './inputs/name'),
    path.join(homedir, 'test/inputs/name')
  );
});
