
const path = require('path'),

      castas = require('castas').default,
      deploy_paths = require('./deploy_paths'),
      deploy_pattern = require('./deploy_pattern');

module.exports = (o => {
  o.imgFitRe = /support.*(\.jpg|\.jpeg|\.png).*pd\.fit\:(\d*)x?(\d*)?/i;

  o.isembeddedimgkey = key => key === 'content' || /img$/i.test(key);

  // input 'support/img/pyramid.jpg#pd.fit:1000' 'jpg' [ 'fit', 100 ]
  // return 'support/img/pyramid.fit.1000.jpg'
  o.getprocessedimgpath = (filepath, extn, filterids) => {
    const filepathsans = filepath.replace(/#.*/, ''),
          extname = path.extname(filepathsans),
          dirname = path.dirname(filepathsans),
          basename = path.basename(filepathsans, extn),
          filterstr = filterids.filter(e => e).join('.');

    return path.join(dirname, `${basename}.${filterstr}${extname}`);
  };
  
  // img is processed per-article, why? so that markdown can be used to preview
  // image locally using the single existing image
  // 
  o.processembeddedimgref = (opts, filename, str, content) => {
    const match = String(str).match(o.imgFitRe),
          [ localimgpath, extn, wstr, hstr ] = match || [],
          width = castas.num(wstr),
          height = castas.num(hstr, width),
    
          outfilename = deploy_pattern.getasoutputpath(opts, filename, content),
          supportInput = path.join(path.dirname(filename), localimgpath),
          supportOutput = path.join(
            path.dirname(outfilename),
            o.getprocessedimgpath(localimgpath, extn, [ 'fit', wstr, hstr ]));

    'support/img/pyramid.jpg#pd.fit:1000'
    'support/img/pyramid.fit.1000.jpg'
    

    if (extn === '.jpg' || extn === '.jpeg') {
      console.log('path', [
        supportInput,
        supportOutput
      ]);
      // png better for photos where blurring OK and no alpha channel
      
    } else if (extn === '.png') {
      // png better for graphics. no blurring and alpha channel support

    }

    // const supportInput = deploy_paths.pathsupportdir(filename);
    //       supportOutput = deploy_paths.pathsupportdir(outfilename);    
    // localimgpath: 'support/img/pyramid.jpg#pd.fit:1000'
    // outputimgpath: 'support/img/pyramid.fit.1000.jpg'
    // extn: 'jpg'
    'https://www.npmjs.com/package/image-size'
    // width: '1000'
    // height: '1000'
    console.log({
      filename,
      localimgpath,
      extn, width, height, supportInput, supportOutput });
  };

  o.process = (opts, filename, articleobj, fn = () => {}) => {
    const articlekeys = Object.keys(articleobj);

    (function next (x, keys, key) {
      if (!x--) return fn(null, articleobj);

      key = keys[x];
      
      if (o.isembeededimgkey(key) && o.imgFitRe.test(articleobj[key])) {
        return o.processembeddedimgref(
          opts, filename, articleobj[key], articleobj, (err, res) => {
            if (err) return fn(err);
              
            next(x, keys);
          });
      }

      next(x, keys);
    }(articlekeys.length, articlekeys));
  };

  return o;

})({});
