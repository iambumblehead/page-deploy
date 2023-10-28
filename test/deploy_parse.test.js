import test from 'node:test';
import assert from 'node:assert/strict';
import timezone_mock from 'timezone-mock';
import deploy_parse from '../src/deploy_parse.js';

timezone_mock.register('US/Pacific');

// eslint-disable-next-line one-var
const fileMD = `
[meta:type]: <> (blog)
[meta:tagsArr]: <> (software,art)
[meta:isComments]: <> (false)
[meta:ispublished]: <> (true)
[meta:posterimg]: <> (support/neonbrand-269297.jpg)

★ hello javascript
===================
\`✑ bumblehead\`
_⌚ 2011.05.21-19:46:00_

Text behind ellipsis is an excerpt.…

\`\`\`javascript
function(src) {
   var i = new Image();
   i.onload = function() { alert("hi"); }
   i.src = src;
}
\`\`\``;

/* eslint-disable max-len */
const fileMDparsed = (`
<p>Text behind ellipsis is an excerpt.</p>
<pre><code class="hljs language-javascript"><span class="hljs-keyword">function</span>(<span class="hljs-params">src</span>) {
   <span class="hljs-keyword">var</span> i = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Image</span>();
   i.<span class="hljs-property">onload</span> = <span class="hljs-keyword">function</span>(<span class="hljs-params"></span>) { <span class="hljs-title function_">alert</span>(<span class="hljs-string">&quot;hi&quot;</span>); }
   i.<span class="hljs-property">src</span> = src;
}
</code></pre>
`).slice(1, -1)
/* eslint-enable max-len */

// eslint-disable-next-line one-var
const fileJSON = `{
  "sort" : {
    "prop" : "timeDate",
    "sorttype" : "gtfirst"
  },
  "type" : "local-ref-pagearr",
  "path" : "../*",
  "itemsperpage" : 8
}`;

test("parseMD should parse an MD file", () => {
  assert.deepEqual(deploy_parse.parseMD({}, fileMD, 'filename.md'), {
    author : 'bumblehead',
    content : fileMDparsed,
    excerpthtml : '<p>Text behind ellipsis is an excerpt.</p>',
    excerptnohtml : 'Text behind ellipsis is an excerpt.',
    isComments : false,
    ispublished : true,
    posterimg : 'support/neonbrand-269297.jpg',
    tagsArr : [
      'software',
      'art'
    ],
    timeDate : 1306032360000,
    title : 'hello javascript',
    type : 'blog'
  });
});

test("parseJSON should parse a JSON file", () => {
  assert.deepEqual(deploy_parse.parseJSON({}, fileJSON, 'filename.json'), {
    sort : {
      prop : "timeDate",
      sorttype : "gtfirst"
    },
    type : "local-ref-pagearr",
    path : "../*",
    itemsperpage : 8
  });
});

test("parsefile should parse a JSON file", () => {
  assert.deepEqual(deploy_parse.parsefile({}, fileJSON, 'filename.json'), {
    sort : {
      prop : "timeDate",
      sorttype : "gtfirst"
    },
    type : "local-ref-pagearr",
    path : "../*",
    itemsperpage : 8
  });  
});

test("parsefile should throw an error for wrong file extension", async () => {
  await assert.rejects(async () => (
    deploy_parse.parsefile({}, fileJSON, 'filename.txt')
  ), {
    // eslint-disable-next-line max-len
    message : '[!!!] page-deploy: parser error file type not supported, filename.txt'
  });
});

test("extractexcerpt should extract excerpt text before ellipsis", () => {
  assert.deepEqual(
    deploy_parse.extractexcerpt('<p>this summer I did… nothing</p>'), [
      '<p>this summer I did nothing</p>',
      '<p>this summer I did</p>' ]);
});

test("extractexcerpt should extract no excerpt text when no ellipsis", () => {
  assert.deepEqual(
    deploy_parse.extractexcerpt('<p>this summer I did nothing</p>'), [
      '<p>this summer I did nothing</p>',
      null ]);
});

