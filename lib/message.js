

var Message = module.exports = {
  pathInvalid : function (path) {
    return "[!!!] pmc: path is invalid: " + path;
  },
  status : {
    pathCreated : function (path) {
      return "[mmm] pmc: path created: " + path;
    }    
  },
  error : {
    pathInvalid : function (path) {
      return "[!!!] pmc: path is invalid: " + path;
    },
    pathCreation : function (path) {
      return "[!!!] pmc: path not created: " + path;
    },
    generic : function (err) {
      
    }
  }
};