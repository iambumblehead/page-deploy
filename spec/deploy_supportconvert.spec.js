// Filename: deploy_supportconvert.spec.js  
// Timestamp: 2017.03.25-15:12:58 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

const deploy_supportconvert = require('../src/deploy_supportconvert');

describe('deploy_supportconvert.getpathin', () => {

  it('should return path', () => {

    expect(
      deploy_supportconvert.getpathin({
        publicPath : '/public',
        inputDir   : '/input',
        outputDir  : '/outputpath'
      },{
        supportedFilename : 'input/path/to/filename.jpg'
      })
    ).toBe( 'input/path/to/support' );
  });
  
});


describe('deploy_supportconvert.getpathout', () => {

  it('should return path', () => {

    expect(
      deploy_supportconvert.getpathout({
        publicPath : '/public',
        inputDir   : '/input',
        outputDir  : '/outputpath'
      },{
        supportedFilename : 'input/path/to/filename.jpg'
      })
    ).toBe( '/outputpath/input/path/to/support' );
  });
  
});

describe('deploy_supportconvert.getpathpublic', () => {

  it('should return path', () => {

    expect(
      deploy_supportconvert.getpathpublic({
        publicPath : '/public',
        inputDir   : '/input',
        outputDir  : '/outputpath'
      },{
        supportedFilename : 'input/path/to/filename.jpg'
      })
    ).toBe( '/outputpath/input/path/to/support' );
  });
  
});


  
/*
describe('deploy_supportconvert.getWithPublicPathStr', () => {

  it('should replace a support path found in a substring', () => {
    var pathStr = '"support/go.jpg"';

    var result = deploy_supportconvert.getWithPublicPathStr(
      '"support/go.jpg"',
      {
        publicPath : '/public',
        inputDir : '/input',
        outputDir : '/outputpath'
      },{
        supportedFilename : 'filename'
      });
    
    expect( result ).toBe( '"public/go.jpg"' );
  });

  it('should replace a support path at the beginning of a substring', () => {
    var result = deploy_supportconvert.getWithPublicPathStr(
      'support/go.jpg', {
        publicPath : '/public',
        inputDir : '/input',
        outputDir : '/outputpath'
      },{
        supportedFilename : 'filename'
      });
    
    expect( result ).toBe( 'public/go.jpg' );
  });

  it('should not replace a support in path where support is a subdirectory', () => {
    var result = deploy_supportconvert.getWithPublicPathStr(
      'path/to/support/go.jpg', {
      publicPath : '/public',
      inputDir : '/input',
      outputDir : '/outputpath'
      },{
        supportedFilename : 'filename'
      });
    
    expect( result ).toBe( 'path/to/support/go.jpg' );
  });

});
*/
