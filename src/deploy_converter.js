// Filename: converter.js  
// Timestamp: 2017.04.08-13:39:58 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>


const deploy_msg = require('./deploy_msg'),
      deploy_pattern = require('./deploy_pattern'),
      deploy_converterbase = require('./deploy_converterbase');

const deploy_converter = module.exports = (o => {

  // convert base file, then convert lang files 
  // filename is a 'base' file.
  // copy the base file to the output directory
  // copy lang/locale files to the output directory
  // use 'base' in the stead of missing lang/locale files
  // 
  // should be full obj with locale base state.
  o.convertFilesForBase = (filename, opts, fn) => {
    if (!deploy_pattern.isvalidpatternfilename(filename)) {
      return deploy_msg.err_invalidfilename(filename);
    }

    deploy_converterbase.getFromFileNew(filename, opts, (err, fcobj) => {
      if (err) return fn(err);

      fcobj.writeAtFilename(filename, opts, (err, res) => {
        if (err) return fn(err);
        
        fcobj.writeSupportDir(opts, (err, res) => {
          if (err) return fn(err);

          fcobj.convertForISO(opts, (err, res) => {
            if (err) return fn(err);

            deploy_msg.convertedfilename(filename, opts);

            fn(err, 'success');
          });
        });
      });
    });
  };

  return o;
  
})({});


