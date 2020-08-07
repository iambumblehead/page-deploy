const localeDeploy = require('../');

// should be relative paths
localeDeploy.convert({
  inputDir : __dirname + '/convert',
  outputDir : __dirname + '/converted',
  publicPath : 'domain.com/converted',
  supportedLocaleArr : [ 'US', 'ES' ],
  supportedLangArr : [ 'eng-US', 'spa-ES' ]
}, (err, res) => {
  if (err) console.log(err);
});
