// Filename: index.js  
// Timestamp: 2017.03.19-14:10:52 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

var converter = require('./src/deploy'),
    deploy_err = require('./src/deploy_err'),
    UserOptions = require('./src/deploy_opts'),
    userOptions;

module.exports = {
  convert : function (opts, fn) {
    userOptions = UserOptions.getNew(opts);
    converter.convert(userOptions, function (err, res) {
      if (err) return fn(deploy_err.AbstractError(err));
      if (typeof fn === 'function') fn(err, res);
    });
  }
};
