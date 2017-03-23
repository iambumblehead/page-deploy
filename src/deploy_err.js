// Filename: deploy_err.js  
// Timestamp: 2017.03.19-14:08:19 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

const util = require('util');

const deploy_err = module.exports = (o => {

  o.AbstractError = function (error) {
    Error.captureStackTrace(this, error || this);
    this.message = error || 'Error';
  };
  
  util.inherits(o.AbstractError, Error);
  
  o.AbstractError.prototype.name = 'Abstract Error';

  return o;

})({});

