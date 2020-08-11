const test = require('ava'),
      timezone_mock = require('timezone-mock'),
      deploy_marked = require('../src/deploy_marked');

timezone_mock.register('US/Pacific');

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
\`\`\``,
        /* eslint-disable max-len */
        HTMLStringCode = `<p>a code block</p>
<pre><code class="language-javascript"><span class="hljs-function"><span class="hljs-keyword">function</span> <span class="hljs-title">log</span> (<span class="hljs-params"></span>) </span>{ <span class="hljs-built_in">console</span>.log(<span class="hljs-string">&#x27;yes!&#x27;</span>) }</code></pre>
`;
  /* eslint-enable max-len */

  t.is(deploy_marked(MDStringCode), HTMLStringCode);
});

test("extractsymbols should return symbol mapping", t => {
  const MDStringSymbols = `
[meta:type]: <> (blog)
[meta:tagsArr]: <> (misc)
[meta:isComments]: <> (false)
[meta:ispublished]: <> (true)
[meta:posterimg]: <> (support/img/pyramid.jpg)

★ pyramid
==========
\`✑ bumblehead\`
_⌚ 2008.09.27-22:45:00_`;

  t.deepEqual(deploy_marked.extractsymbols(MDStringSymbols)[1], {
    author : 'bumblehead',
    timeDate : 1222580700000,
    title : 'pyramid'
  });
});
