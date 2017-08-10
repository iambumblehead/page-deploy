// Filename: index.js  
// Timestamp: 2017.08.09-00:57:45 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

const deploy = require('./src/deploy'),
      deploy_opts = require('./src/deploy_opts');

module.exports = {
  convert : (opts, fn) => 
    deploy.convert(deploy_opts(opts), (err, res) => {
      if (err) throw new Error(err);
      
      typeof fn === 'function' && fn(err, res);
    })
};
