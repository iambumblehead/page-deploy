const test = require('ava'),
      deploy_paths = require('../src/deploy_paths');

test("removedir should remove directory from a path", t => {
  t.is(
    deploy_paths.removedir(
      'src/spec/page/about/lang-baseLang.md',
      './src/spec'
    ), 'page/about/lang-baseLang.md'
  );

  t.is(
    deploy_paths.removedir(
      'src/spec/page/about/lang-baseLang.md',
      'src/spec'
    ), 'page/about/lang-baseLang.md'
  );

  t.is(
    deploy_paths.removedir(
      './src/spec/page/about/lang-baseLang.md',
      'src/spec'
    ), './page/about/lang-baseLang.md'
  );
});

test("outputsupportpath should return an output support path", t => {
  t.is(
    deploy_paths.outputsupportpath({
      publicPath : '/spec',
      inputDir : './src/spec',
      outputDir : './public/spec'
    }, 'src/spec/page/about/lang-baseLang.md'),
    'public/spec/page/about/support'
  );
});

test("pathpublic should return string with updated public path", t => {
  t.is(
    deploy_paths.publicsupportpath({
      publicPath : '/spec',
      inputDir : './src/spec',
      outputDir : './public/spec'
    }, 'src/spec/page/about/lang-baseLang.md'),
    '/spec/page/about/support'
  );
});

test("with public should string with updated public path", t => {
  t.deepEqual(
    deploy_paths.withpublicpath({
      inputDir : './src/spec',
      outputDir : './public/spec',
      publicPath : '/spec'
    }, 'support/img/hand.png', 'src/spec/page/about/lang-baseLang.md'),
    '/spec/page/about/support/img/hand.png'
  );
});
