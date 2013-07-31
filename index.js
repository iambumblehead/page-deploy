var converter = require('./page-deploy.js'),
    UserOptions = require('./lib/useroptions.js'),
    userOptions;

////////////////////////
var util = require('util');

var AbstractError = function (error) {
  Error.captureStackTrace(this, error || this);
  this.message = error || 'Error';
};
util.inherits(AbstractError, Error);
AbstractError.prototype.name = 'Abstract Error';
/////////////////////////

module.exports = {
  convert : function (opts, fn) {
    userOptions = UserOptions.getNew(opts);
    converter.convert(userOptions, function (err, res) {
      if (err) return fn(AbstractError(err));
      if (typeof fn === 'function') fn(err, res);
    });
  }
};