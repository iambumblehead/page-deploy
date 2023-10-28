import url from 'node:url'
import deploy from '../src/deploy.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

// should be relative paths
deploy({
  inputDir : __dirname + '/convert',
  outputDir : __dirname + '/converted',
  publicPath : 'domain.com/converted',
  supportedLocaleArr : [ 'US', 'ES' ],
  supportedLangArr : [ 'eng-US', 'spa-ES' ],
  datetitlesubdirs : [ '/blog/' ]
})
