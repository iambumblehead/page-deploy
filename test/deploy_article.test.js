import util from 'node:util';
import test from 'node:test';
import assert from 'node:assert/strict';
import esmock from 'esmock';
import timezone_mock from 'timezone-mock';

import deploy_parse from '../src/deploy_parse.js';

timezone_mock.register('US/Pacific');

// eslint-disable-next-line one-var
const MDStringMakingWaves = `
[meta:type]: <> (blog)
[meta:tagsArr]: <> (video,misc,professional,software,2d,art)
[meta:isComments]: <> (false)
[meta:ispublished]: <> (true)
[meta:posterimg]: <> (support/ringed.png)

★ making waves
===============
\`✑ bumblehead\`
_⌚ 2010.06.04-20:06:00_

I finished a sinewave animation.
`;

// eslint-disable-next-line one-var
const MDStringPyramid = `
[meta:type]: <> (blog)
[meta:tagsArr]: <> (misc)
[meta:isComments]: <> (false)
[meta:ispublished]: <> (true)
[meta:posterimg]: <> (support/img/pyramid.jpg#pd:fit-WxH)

★ pyramid
==========
\`✑ bumblehead\`

_⌚ 2008.09.27-22:45:00_

![pyramid](support/img/pyramid.jpg#fit-WxH)
`;

test("getadjacentarticlepaths should return adjacent article paths", async () => {
  const deploy_article = await esmock('../src/deploy_article.js', {
    '../src/deploy_file.js' : {
      readdir : (dir, fn) => fn(null, [
        '2008.09.27-pyramid',
        '2009.05.05-big-update',
        '2010.06.04-making-waves',
        '2011.05.21-hello-javascript'
      ])
    }
  });

  // eslint-disable-next-line max-len
  const res = await util.promisify(
    deploy_article.getadjacentarticlepaths)({}, '/path/to/filename.json')

  assert.deepEqual(res, [
    '/path/2008.09.27-pyramid/filename.json',
    '/path/2009.05.05-big-update/filename.json',
    '/path/2010.06.04-making-waves/filename.json',
    '/path/2011.05.21-hello-javascript/filename.json'
  ]);
});

test("applyuniverseisoobjarr should return adjacent article paths", async () => {
  const deploy_article = await esmock('../src/deploy_article.js', {
    '../src/deploy_file.js' : {
      writeassign : (filename, content, fn) => {
        fn(null, content);
      },
      readdir : (dir, fn) => fn(null, [
        '2008.09.27-pyramid',
        '2009.05.05-big-update',
        '2010.06.04-making-waves',
        '2011.05.21-hello-javascript'
      ])
    }
  });

  const res = await util.promisify(deploy_article.applyuniverseisoobjarr)({}, 'output/path', [
    [ 'input/path/spec-spa-ES.json', { title : 'spanish title' } ],
    [ 'input/path/spec-eng-US.json', { title : 'english title' } ]
  ])

  assert.deepEqual(res, [
    'output/path/2008.09.27-pyramid',
    'output/path/2009.05.05-big-update',
    'output/path/2010.06.04-making-waves',
    'output/path/2011.05.21-hello-javascript'
  ]);
});

test("getnextprevarticlepath should return prev article path", async () => {
  const deploy_article = await esmock('../src/deploy_article.js', {
    '../src/deploy_file.js' : {
      writeassign : (filename, content, fn) => {
        fn(null, content);
      },
      readdir : (dir, fn) => fn(null, [
        '2008.09.27-pyramid',
        '2009.05.05-big-update',
        '2010.06.04-making-waves',
        '2011.05.21-hello-javascript'
      ]),
      readobj : (filepath, fn) => {
        if (filepath === 'output/2010.06.04-making-waves/spec-spa-ES.json') {
          fn(null, MDStringMakingWaves);
        }
      }
    }
  });

  const [ nextpath, fileobj ] = await new Promise(resolve => {
    deploy_article.getnextprevarticlepath({
      articlescache : [] // eslint-disable-next-line max-len
    }, 'output/2011.05.21-hello-javascript/spec-spa-ES.json', -1, (err, nextpath, fileobj) => {
      resolve([ nextpath, fileobj ])
    })
  })

  assert.strictEqual(nextpath, 'output/2010.06.04-making-waves/spec-spa-ES.json');
  assert.strictEqual(fileobj, MDStringMakingWaves);    
});

test("getnextprevarticlepath should return next article path", async () => {
  const deploy_article = await esmock('../src/deploy_article.js', {
    '../src/deploy_file.js' : {
      writeassign : (filename, content, fn) => {
        fn(null, content);
      },
      readdir : (dir, fn) => fn(null, [
        '2008.09.27-pyramid',
        '2009.05.05-big-update',
        '2010.06.04-making-waves',
        '2011.05.21-hello-javascript'
      ]),
      readobj : (filepath, fn) => {
        if (filepath === 'output/2010.06.04-making-waves/spec-spa-ES.json') {
          fn(null, MDStringMakingWaves);
        }
      }
    }
  });

  const [ nextpath, fileobj ] = await new Promise(resolve => {
    deploy_article.getnextprevarticlepath({
      articlescache : [] // eslint-disable-next-line max-len
    }, 'output/2009.05.05-big-update/spec-spa-ES.json', 1, (err, nextpath, fileobj) => {
      resolve([ nextpath, fileobj ])
    })
  })

  assert.strictEqual(nextpath, 'output/2010.06.04-making-waves/spec-spa-ES.json');
  assert.strictEqual(fileobj, MDStringMakingWaves);
});

test("applyuniversearticleisoobj should update ns namespace", async () => {
  const deploy_article = await esmock('../src/deploy_article.js', {
    '../src/deploy_file.js' : {
      writeassign : (filename, content, fn) => {
        fn(null, content);
      },
      readdir : (dir, fn) => fn(null, [
        '2008.09.27-pyramid',
        '2009.05.05-big-update',
        '2010.06.04-making-waves',
        '2011.05.21-hello-javascript'
      ]),
      readobj : (filepath, fn) => {
        if (filepath === 'output/2010.06.04-making-waves/eng-US.json') {
          fn(null, deploy_parse.parseMD({}, MDStringMakingWaves, filepath));
        }
        if (filepath === 'output/2008.09.27-pyramid/eng-US.json') {
          fn(null, deploy_parse.parseMD({}, MDStringPyramid, filepath));
        }        
      }
    }
  });

  const res = await util.promisify(deploy_article.applyuniversearticleisoobj)({
    articlescache : []
  }, 'output/2009.05.05-big-update', [
    'input/universal/spec-eng-US.json', {
      next : {
        type : 'newer',
        title : 'ns.next.title',
        tagsArr : 'ns.next.tagsArr',
        timeDate : 'ns.next.timeDate'
      },
      prev : {
        type : 'older',
        title : 'ns.prev.title',
        tagsArr : 'ns.prev.tagsArr',
        timeDate : 'ns.prev.timeDate'
      }
    }
  ])
  assert.deepEqual(res, {
    next : {
      type : 'newer',
      title : 'making waves',
      tagsArr : [ 'video', 'misc', 'professional', 'software', '2d', 'art' ],
      timeDate : 1275707160000
    },
    prev : {
      type : 'older',
      title : 'pyramid',
      tagsArr : [ 'misc' ],
      timeDate : 1222580700000
    }
  });
});
