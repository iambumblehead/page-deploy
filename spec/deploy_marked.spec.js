// const os = require('os');
const test = require('ava');
const deploy_marked = require('../src/deploy_marked');

test("default should return marked content", t => {
  t.is(
    deploy_marked('**hey now**'),
    '<p><strong>hey now</strong></p>\n'
  );
});

test("default should return marked content, w/ highlighted code blocks", t => {
  const MDStringCode = `
a code block
\`\`\`javascript
function log () { console.log('yes!') }
\`\`\``;

  const HTMLStringCode = `<p>a code block</p>
<pre><code class="language-javascript"><span class="hljs-function"><span class="hljs-keyword">function</span> <span class="hljs-title">log</span> (<span class="hljs-params"></span>) </span>{ <span class="hljs-built_in">console</span>.log(<span class="hljs-string">&#x27;yes!&#x27;</span>) }</code></pre>
`;

  t.is(deploy_marked(MDStringCode), HTMLStringCode);
});
