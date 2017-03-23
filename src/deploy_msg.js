// Filename: deploy_msg.js  
// Timestamp: 2017.03.23-14:09:59 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

const deploy_msg = module.exports = (o => {
  
  o.pathInvalid = (path) =>
    '[!!!] pmc: path is invalid: ' + path;
  
  o.status = {
    pathCreated : (path) =>
      '[mmm] pmc: path created: ' + path
  };
  
  o.error = {
    pathInvalid : (path) =>
      '[!!!] pmc: path is invalid: ' + path,

    pathCreation : (path) =>
      '[!!!] pmc: path not created: ' + path
  };
  
})({});
