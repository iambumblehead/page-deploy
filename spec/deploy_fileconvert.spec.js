// Filename: fileconverter.spec.js  
// Timestamp: 2017.04.09-01:37:56 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

var FileConverter = require('../src/deploy_fileconvert');

describe("fileconverter.getRefPathFilename", function () {
  var result, resultExpected;

  // in ./inputs/name
  // out /home/duko/Software/pocket-markdown-converter/getStarted/convert/page-object/forms/sign-up/inputs/name/baseLocale.json
  it("should ", function () {
    resultExpected = '/home/duko/test/inputs/name/baseLang.md';
    result = FileConverter.getRefPathFilename(      '/home/duko/test/baseLang.md', './inputs/name');

    expect( result ).toBe( resultExpected );
  });
});

describe("fileconverter.getRefPath", function () {
  var result, resultExpected;

  // in ./inputs/name
  // out /home/duko/Software/pocket-markdown-converter/getStarted/convert/page-object/forms/sign-up/inputs/name/baseLocale.json
  it("should ", function () {
    resultExpected = '/home/duko/test/inputs/name/baseLang.md';
    result = FileConverter.getRefPath('/home/duko/test/baseLang.md', './inputs/name');

    console.log(result);
    //expect( result ).toBe( resultExpected );
  });
});
