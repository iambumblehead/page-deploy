import test from 'node:test';
import assert from 'node:assert/strict';
import deploy_iso from '../src/deploy_iso.js';

test("getisofilenamearr should return iso filenames", () => {
  assert.deepEqual(
    deploy_iso.getisofilenamearr(
      'LangLocale',
      [ 'eng-US', 'spa-ES' ],
      [ 'ES', 'US' ]),
    [ 'eng-US_ES', 'eng-US_US', 'spa-ES_ES', 'spa-ES_US' ]
  );
});
