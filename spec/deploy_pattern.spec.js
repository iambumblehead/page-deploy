
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

test.cb("updatelangdefs should update definitions of lang properties", t => {
  const deploy_pattern = rewiremock.proxy('../src/deploy_pattern.js');

  deploy_pattern.updatelangdefs({
    node : "nodetype",
    name : "nodename",
    child : [ {
      node : "childnodetype",
      name : "childnodename",
      subj : [ {
        label : "label",
        labelanchor : "pd.langkey.labelanchor"
      } ]
    }, {
      node : "childnode2type",
      name : "childnode2name",
      subj : [ "pd.langobj" ]
    }, {
      type : "local-ref",
      path : "../page-about-points-readable-json"
    } ]
  }, {
    labelanchor : 'labelanchor'
  }, (err, updatedobj) => {

    t.is(updatedobj.child[0].subj[0].labelanchor, 'labelanchor');
    t.is(updatedobj.child[1].subj[0].labelanchor, 'labelanchor');

    t.end();
  });
});

test.cb("updatelangkeys should update keys of lang properties", t => {
  const deploy_pattern = rewiremock.proxy('../src/deploy_pattern.js');

  deploy_pattern.updatelangkeys({
    label : { langkey : 'langkeya' },
    obj : { langobj : true }
  }, {
    langkeya : 'langkey-value'
  }, (err, updatedobj) => {
    t.deepEqual(updatedobj, {
      label : 'langkey-value',
      obj : { langkeya : 'langkey-value' }
    });
    t.end();
  });
});

test("getdatetitlestampoutputpath should return outputdir", t => {
  const deploy_pattern = require('../src/deploy_pattern.js');

  t.is(
    deploy_pattern.getdatetitlestampoutputpath('/path/to/base-lang.json', {
      title : 'articletitle',
      timeDate : 1222580700000
    }, {}),
    '/path/2008.09.27-articletitle/base-lang.json'
  );
});

test("getdatetitlestamp should return outputdir", t => {
  const deploy_pattern = require('../src/deploy_pattern.js');

  t.is(
    deploy_pattern.getdatetitlestamp(1222580700000, 'articletitle'),
    '2008.09.27-articletitle'
  );
});

test("getuniversefilepath should return universe filepath", t => {
  const deploy_pattern = require('../src/deploy_pattern.js');

  t.is(
    deploy_pattern.getuniversefilepath('/path/to/spec-ES.md'),
    '/path/universal/spec-ES.json'
  );
});

test("getasoutputpath should return datetitle outputdir", t => {
  const deploy_pattern = require('../src/deploy_pattern.js');

  t.is(
    deploy_pattern.getasoutputpath({
      outputDir : '/path/to/outputDir',
      inputDir : '/path/to/inputDir',
      datetitlesubdirs : [ '/data/' ]
    }, '/path/to/inputDir/data/spec-ES.md', {
      title : 'articletitle',
      timeDate : 1222580700000
    }),
    '/path/to/outputDir/2008.09.27-articletitle/ES.json'
  );
});
