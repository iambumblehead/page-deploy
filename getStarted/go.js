import url from 'node:url'
import localeDeploy from '../src/deploy.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

// should be relative paths
localeDeploy.convert({
  inputDir : __dirname + '/convert',
  outputDir : __dirname + '/converted',
  publicPath : 'domain.com/converted',
  supportedLocaleArr : [ 'US', 'ES' ],
  supportedLangArr : [ 'eng-US', 'spa-ES' ],
  datetitlesubdirs : [ '/blog/' ]
}, (err, res) => {
  if (err) console.log(err);
});
