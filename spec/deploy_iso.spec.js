const test = require('ava'),
      deploy_iso = require('../src/deploy_iso');

test("getisofilenamearr should return iso filenames", t => {
  t.deepEqual(
    deploy_iso.getisofilenamearr(
      'LangLocale',
      [ 'eng-US', 'spa-ES' ],
      [ 'ES', 'US' ]),
    [ 'eng-US_ES', 'eng-US_US', 'spa-ES_ES', 'spa-ES_US' ]
  );
});
