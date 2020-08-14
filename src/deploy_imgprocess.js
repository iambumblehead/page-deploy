const path = require('path'),
      jimp = require('jimp'),
      castas = require('castas').default,
      deploy_msg = require('./deploy_msg'),
      deploy_file = require('./deploy_file'),
      deploy_paths = require('./deploy_paths'),
      deploy_pattern = require('./deploy_pattern');

module.exports = (o => {
  o.imgFitRe = /support.*(\.jpg|\.jpeg|\.png).*pd\.fit\:(\d*)x?(\d*)?/i;

  o.isembeddedimgkey = key => key === 'content' || /img$/i.test(key);

  // input 'support/img/pyramid.jpg#pd.fit:1000' 'jpg' [ 'fit', 100 ]
  // return 'support/img/pyramid.fit.1000.jpg'
  o.getprocessedimgpath = (filepath, extn, filterids) => {
    const extname = path.extname(filepath),
          dirname = path.dirname(filepath),
          basename = path.basename(filepath, extn),
          filterstr = filterids.filter(e => e).join('.');

    return path.join(dirname, `${basename}.${filterstr}${extname}`);
  };

  // img is processed per-article, why? so that markdown can be used to preview
  // image locally using the single existing image
  // 
  o.processembeddedimgref = (opts, filename, str, content, fn) => {
    const match = String(str).match(o.imgFitRe),
          [ localimgpath, extn, wstr, hstr ] = match || [],
          width = castas.num(wstr),
          height = castas.num(hstr, width),
          localimgpathsans = localimgpath.replace(/#.*/, ''),
          localimgpathnew = o.getprocessedimgpath(
            localimgpathsans, extn, [ 'fit', wstr, hstr ]),
          outfilename = deploy_pattern.getasoutputpath(opts, filename, content),
          supportInput = path.join(path.dirname(filename), localimgpathsans),
          supportOutput = path.join(path.dirname(outfilename), localimgpathnew),
          updatedstr = str.split(localimgpath).join(localimgpathnew);

    if (!deploy_file.exists(supportInput))
      deploy_msg.throw_imgnotfound(supportInput);

    if (deploy_file.exists(supportOutput)) {
      return fn(null, updatedstr);
    }

    jimp.read(supportInput, (err, file) => {
      if (err) return fn(err);

      const { bitmap } = file,
            bytelength = +bitmap.data.byteLength,
            isscalable = bitmap.width > width || bitmap.height > height;

      if (isscalable) {
        file.scaleToFit(width, height);

        if (width < 1000 || height < 1000) {
          file.quality(80);
        }
      }

      file.write(supportOutput, (err, savedfile) => {
        if (err) return fn(err);

        if (bytelength === savedfile.bitmap.data.byteLength) {
          deploy_msg.convertedfilename(opts, supportOutput);
        } else {
          deploy_msg.scaledimage(
            opts, supportOutput, bytelength, savedfile.bitmap.data.byteLength);
        }

        fn(null, updatedstr);
      });
    });
  };

  o.process = (opts, filename, articleobj, fn = () => {}) => {
    const articlekeys = Object.keys(articleobj);

    (function next (x, keys, key) {
      if (!x--) return fn(null, articleobj);

      key = keys[x];

      if (o.isembeddedimgkey(key) && o.imgFitRe.test(articleobj[key])) {
        return o.processembeddedimgref(
          opts, filename, articleobj[key], articleobj, (err, updatedstr) => {
            if (err) return fn(err);

            articleobj[key] = updatedstr;

            next(x, keys);
          });
      }

      next(x, keys);
    }(articlekeys.length, articlekeys));
  };

  return o;
})({});
