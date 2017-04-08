// Filename: fileconverter.spec.js  
// Timestamp: 2017.03.25-16:32:00 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

var FileConverter = require('../src/deploy_fileconvert');

describe("fileconverter.getRefPathFilename", function () {
  var result, resultExpected;

  // in ./inputs/name
  // out /home/duko/Software/pocket-markdown-converter/getStarted/convert/page-object/forms/sign-up/inputs/name/baseLocale.json
  it("should ", function () {
    var fileConverter = FileConverter.getFromJSONNew(
      '/home/duko/test/baseLang.md',
      '{}'
    );
    resultExpected = '/home/duko/test/inputs/name/baseLang.md';
    result = fileConverter.getRefPathFilename('./inputs/name');

    expect( result ).toBe( resultExpected );
  });
});

describe("fileconverter.getRefPath", function () {
  var result, resultExpected;

  // in ./inputs/name
  // out /home/duko/Software/pocket-markdown-converter/getStarted/convert/page-object/forms/sign-up/inputs/name/baseLocale.json
  it("should ", function () {
    var fileConverter = FileConverter.getFromJSONNew(
      '/home/duko/test/baseLang.md',
      '{}'
    );
    resultExpected = '/home/duko/test/inputs/name/baseLang.md';
    result = fileConverter.getRefPath('./inputs/name');

    console.log(result);
    //expect( result ).toBe( resultExpected );
  });
});