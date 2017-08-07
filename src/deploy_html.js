// Filename: deploy_html.js  
// Timestamp: 2017.08.06-00:55:15 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  


module.exports = (o => {

  o.extractexcerpt = content => {
    const match = String(content).match(/<p>(.*)…/gi),
          excerpt = match && match[0].slice(0, -1); // remove ellipsis
    
    if (excerpt) {
      content = content.replace(match[0], excerpt);
    }

    return [content, excerpt];
  };

  /*
  // ⌚ ✑ ★
  o.extracttitle = content => {
    const match = String(content).match(/<[^>]*>★(.*)<.[^\/]\/>/ugi),
          title = match && match[0].slice(0, -1); // remove ellipsis

    if (/2017.06.11-20:59:00/gi.test(content)) {
    //if (/★/ugi.test(content)) {
      console.log('megukana', content, match);
    }

    //if (excerpt) {
    //  content = content.replace(match[0], excerpt);
    //}

    return [content, title];
  };
   */

  return o;
  
})({});
