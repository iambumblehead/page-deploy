[meta:title]: <> (Writing Javascript)
[meta:type]: <> (blog)
[meta:author]: <> (Bumblehead)
[meta:date]: <> (2012.09.03)
[meta:href]: <> (/blog/writing-javascript)
[meta:tags]: <> (software,art)
[meta:comments]: <> (off)

### Writing Javascript

I have:

 * A small JavaScript library for generic tasks.
 * 30+ scripts for more specialized tasks including,
   * an animation engine
   * json-to-xml and xml-to-json data processors
   * a script for advanced real-time management of ecommerce item and price totals
 * Knowledge that Opera's aggressive garbage collection would prevent this code from saying 'hi'.

 ```javascript
 function(src) {
     var i = new Image();
     i.onload = function() { alert("hi"); }
     i.src = src;
 }
 ```
 
 * A huge .emacs file with a treasure of well-tested code that automates much of my development (especially JavaScript).
