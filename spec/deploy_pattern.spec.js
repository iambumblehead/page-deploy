
const test = require('ava'),
      rewiremock = require('rewiremock').default;

test.cb("getsimilarfilename should return similar file", t => {
  const deploy_pattern = rewiremock.proxy('../src/deploy_pattern.js', {
    './deploy_file' : {
      readdir : (dir, fn) => fn(null, [ 'spec-ES.md' ])
    }
  });

  deploy_pattern.getsimilarfilename('/input/spec-ES.json', {}, (err, path) => {
    t.deepEqual([ 'spec-ES.md' ], path);
    t.end();
  });
});

test.cb("getsimilarfilename should not return the same file", t => {
  const deploy_pattern = rewiremock.proxy('../src/deploy_pattern.js', {
    './deploy_file' : {
      readdir : (dir, fn) => fn(null, [ 'spec-ES.json' ])
    }
  });

  deploy_pattern.getsimilarfilename('/input/spec-ES.json', {}, (err, path) => {
    t.deepEqual([], path);
    t.end();
  });
});
