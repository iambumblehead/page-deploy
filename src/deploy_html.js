// Filename: deploy_html.js  
// Timestamp: 2017.08.06-23:22:29 (last modified)
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

  return o;
  
})({});
