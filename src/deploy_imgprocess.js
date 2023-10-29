import path from 'path'
import jimp from 'jimp';
import castas from 'castas'
import deploy_msg from './deploy_msg.js'
import deploy_file from './deploy_file.js'
import deploy_pattern from './deploy_pattern.js'

// import {
//   initializeImageMagick,
//   ImageMagick,
//   Magick,
//   MagickFormat,
//   Quantum
// } from '@imagemagick/magick-wasm'

const imgFitRe = /support.*(\.jpg|\.jpeg|\.png).*pd\.fit\:(\d*)x?(\d*)?/i

const isembeddedimgkey = key => (
  key === 'content' || /img$/i.test(key))

// input 'support/img/pyramid.jpg#pd.fit:1000' 'jpg' [ 'fit', 100 ]
// return 'support/img/pyramid.fit.1000.jpg'
const getprocessedimgpath = (filepath, extn, filterids) => {
  const extname = path.extname(filepath)
  const dirname = path.dirname(filepath)
  const basename = path.basename(filepath, extn)
  const filterstr = filterids.filter(e => e).join('.')

  return path.join(dirname, `${basename}.${filterstr}${extname}`)
}

// img is processed per-article, why? so that markdown can be used to preview
// image locally using the single existing image
// 
const processembeddedimgref = (opts, filename, str, content, fn) => {
  const match = String(str).match(imgFitRe)
  const [ localimgpath, extn, wstr, hstr ] = match || []
  const width = castas.num(wstr)
  const height = castas.num(hstr, width)
  const localimgpathsans = localimgpath.replace(/#.*/, '')
  const localimgpathnew = getprocessedimgpath(
    localimgpathsans, extn, [ 'fit', wstr, hstr ])
  const outfilename = deploy_pattern.getasoutputpath(opts, filename, content)
  const supportInput = path.join(path.dirname(filename), localimgpathsans)
  const supportOutput = path.join(path.dirname(outfilename), localimgpathnew)
  const updatedstr = str.split(localimgpath).join(localimgpathnew)

  if (!deploy_file.exists(supportInput))
    deploy_msg.throw_imgnotfound(supportInput)

  if (deploy_file.exists(supportOutput)) {
    return fn(null, updatedstr)
  }

  // initializeImageMagick('@imagemagick/magick-wasm').then(() => {
  //   ImageMagick.read(supportInput, image => {
  //     console.log('what do we have here', image)
  //     image.resize(100, 100);
  //     image.blur(1, 5);
  //     console.log(image.toString());
  //     image.write(MagickFormat.Jpeg, data => {
  //       console.log(data.length);
  //     });
  //   })
  // })

  jimp.read(supportInput, (err, file) => {
    if (err) return fn(err)

    const { bitmap } = file
    const bytelength = +bitmap.data.byteLength
    const isscalable = bitmap.width > width || bitmap.height > height

    if (isscalable) {
      file.scaleToFit(width, height)

      if (width < 1000 || height < 1000) {
        file.quality(80)
      }
    }

    file.write(supportOutput, (err, savedfile) => {
      if (err) return fn(err)

      if (bytelength === savedfile.bitmap.data.byteLength) {
        deploy_msg.convertedfilename(opts, supportOutput)
      } else {
        deploy_msg.scaledimage(
          opts, supportOutput, bytelength, savedfile.bitmap.data.byteLength)
      }

      fn(null, updatedstr)
    })
  })
}

const process = (opts, filename, articleobj, fn = () => {}) => {
  const articlekeys = Object.keys(articleobj)

  ;(function next (x, keys, key) {
    if (!x--) return fn(null, articleobj)

    key = keys[x]

    if (isembeddedimgkey(key) && imgFitRe.test(articleobj[key])) {
      return processembeddedimgref(
        opts, filename, articleobj[key], articleobj, (err, updatedstr) => {
          if (err) return fn(err)

          articleobj[key] = updatedstr

          next(x, keys)
        })
    }

    next(x, keys)
  }(articlekeys.length, articlekeys))
}

export default {
  getprocessedimgpath,
  processembeddedimgref,
  process
}
