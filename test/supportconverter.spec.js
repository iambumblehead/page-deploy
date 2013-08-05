var SupportConverter = require('../lib/supportconverter.js');

describe("supportconverter.getWithPublicPathStr", function () {

  it("should replace a support path found in a substring", function () {
    var pathStr = "'support/go.jpg'";

    var supportConverter = SupportConverter.getNew('filename');

    var result = supportConverter.getWithPublicPathStr(pathStr, {
      publicPath : '/public',
      inputDir : '/input',
      outputDir : '/outputpath'
    });
    expect( result ).toBe( "'public/go.jpg'" );
  });

  it("should replace a support path at the beginning of a substring", function () {
    var supportConverter = SupportConverter.getNew('filename');

    var result = supportConverter.getWithPublicPathStr(
      "support/go.jpg", {
      publicPath : '/public',
      inputDir : '/input',
      outputDir : '/outputpath'
    });
    expect( result ).toBe( "public/go.jpg" );
  });

  it("should not replace a support in path where support is a subdirectory", function () {
    var supportConverter = SupportConverter.getNew('filename');

    var result = supportConverter.getWithPublicPathStr(
      "path/to/support/go.jpg", {
      publicPath : '/public',
      inputDir : '/input',
      outputDir : '/outputpath'
    });
    expect( result ).toBe( "path/to/support/go.jpg" );
  });

});