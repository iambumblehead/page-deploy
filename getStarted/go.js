var localeDeploy = require('../index.js');

// should be relative paths
var converterOpts = {
  inputDir : __dirname + '/convert',
  outputDir : __dirname + '/converted',
  publicPath : 'domain.com/converted',
  supportedLocaleArr : ['US', 'ES'],
  supportedLangArr : ['eng-US', 'spa-ES']
};

localeDeploy.convert(converterOpts, function (err, res) {
  if (err) return console.log(err);
});
