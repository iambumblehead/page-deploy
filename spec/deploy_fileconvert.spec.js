// Filename: fileconverter.spec.js  
// Timestamp: 2017.04.09-01:37:56 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

const os = require('os');
const test = require('ava');
const path = require('path');
const deploy_fileconvert = require('../src/deploy_fileconvert');

const homedir = os.homedir();

// in ./inputs/name
// out /home/duko/Software/pocket-markdown-converter/getStarted/convert/page-object/forms/sign-up/inputs/name/baseLocale.json
test("getRefPathFilename should ", t => {
  const baseLangMDPath = path.join( homedir, 'test/baseLang.md' );

  t.is(
    deploy_fileconvert.getRefPathFilename(baseLangMDPath, './inputs/name'),
    path.join( homedir, 'test/inputs/name/baseLang.md' )
  );
});

// in ./inputs/name
// out /home/duko/Software/pocket-markdown-converter/getStarted/convert/page-object/forms/sign-up/inputs/name/baseLocale.json
test("getRefPath should ", t => {
  const baseLangMDPath = path.join( homedir, 'test/baseLang.md' );  

  t.is(
    deploy_fileconvert.getRefPath(baseLangMDPath, './inputs/name'),
    path.join( homedir, 'test/inputs/name' )
  );
});
