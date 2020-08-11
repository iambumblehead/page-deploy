const test = require('ava'),
      rewiremock = require('rewiremock').default,
      timezone_mock = require('timezone-mock'),

      deploy_parse = require('../src/deploy_parse');

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

test.cb("getadjacentarticlepaths should return adjacent article paths", t => {
  const deploy_article = rewiremock.proxy('../src/deploy_article.js', {
    './deploy_file' : {
      readdir : (dir, fn) => fn(null, [
        '2008.09.27-pyramid',
        '2009.05.05-big-update',
        '2010.06.04-making-waves',
        '2011.05.21-hello-javascript'
      ])
    }
  });

  // eslint-disable-next-line max-len
  deploy_article.getadjacentarticlepaths({}, '/path/to/filename.json', (err, res) => {
    t.deepEqual(res, [
      '/path/2008.09.27-pyramid/filename.json',
      '/path/2009.05.05-big-update/filename.json',
      '/path/2010.06.04-making-waves/filename.json',
      '/path/2011.05.21-hello-javascript/filename.json'
    ]);

    t.end();
  });
});

test.cb("applyuniverseisoobjarr should return adjacent article paths", t => {
  const deploy_article = rewiremock.proxy('../src/deploy_article.js', {
    './deploy_file' : {
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

  deploy_article.applyuniverseisoobjarr({}, 'output/path', [
    [ 'input/path/spec-spa-ES.json', { title : 'spanish title' } ],
    [ 'input/path/spec-eng-US.json', { title : 'english title' } ]
  ], (err, res) => {
    t.deepEqual(res, [
      'output/path/2008.09.27-pyramid',
      'output/path/2009.05.05-big-update',
      'output/path/2010.06.04-making-waves',
      'output/path/2011.05.21-hello-javascript'
    ]);

    t.end();
  });
});

test.cb("getnextprevarticlepath should return prev article path", t => {
  const deploy_article = rewiremock.proxy('../src/deploy_article.js', {
    './deploy_file' : {
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

  deploy_article.getnextprevarticlepath({
    articlescache : [] // eslint-disable-next-line max-len
  }, 'output/2011.05.21-hello-javascript/spec-spa-ES.json', -1, (err, nextpath, fileobj) => {

    t.is(nextpath, 'output/2010.06.04-making-waves/spec-spa-ES.json');
    t.is(fileobj, MDStringMakingWaves);
    t.end();
  });
});

test.cb("getnextprevarticlepath should return next article path", t => {
  const deploy_article = rewiremock.proxy('../src/deploy_article.js', {
    './deploy_file' : {
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

  deploy_article.getnextprevarticlepath({
    articlescache : [] // eslint-disable-next-line max-len
  }, 'output/2009.05.05-big-update/spec-spa-ES.json', 1, (err, nextpath, fileobj) => {

    t.is(nextpath, 'output/2010.06.04-making-waves/spec-spa-ES.json');
    t.is(fileobj, MDStringMakingWaves);
    t.end();
  });
});

test.cb("applyuniversearticleisoobj should update ns namespace", t => {
  const deploy_article = rewiremock.proxy('../src/deploy_article.js', {
    './deploy_file' : {
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
        if (filepath === 'output/2010.06.04-making-waves/spec-eng-US.json') {
          fn(null, deploy_parse.parseMD({}, MDStringMakingWaves, filepath));
        }
        if (filepath === 'output/2008.09.27-pyramid/spec-eng-US.json') {
          fn(null, deploy_parse.parseMD({}, MDStringPyramid, filepath));
        }        
      }
    }
  });

  deploy_article.applyuniversearticleisoobj({
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
  ], (err, res) => {
    t.deepEqual(res, {
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
    t.end();
  });
});
