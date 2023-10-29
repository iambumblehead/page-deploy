// Filename: deploy.js  
// Timestamp: 2017.09.03-22:41:45 (last modified)
// Author(s): Bumblehead (www.bumblehead.com)
//
// uses gfm (github-flavored-markdown): https://github.com/chjj/marked


import fs from 'node:fs'
import path from 'node:path'
import util from 'node:util'
import deploy_msg from './deploy_msg.js'
import deploy_opts from './deploy_opts.js'
import deploy_file from './deploy_file.js'
import deploy_tokens from './deploy_tokens.js'
import deploy_pattern from './deploy_pattern.js'
import deploy_fileconvert from './deploy_fileconvert.js'

const { UNIVERSAL } = deploy_tokens


const bfsconvertdir = (opts, input, fn) => {
  if (deploy_file.isdir(!input)) {
    throw new Error(`input must be a file: ${input}`)
  }

  fs.readdir(input, { withFileTypes: true }, (err, direntarr) => {
    if (err) return fn(err)

    deploy_fileconvert.foreachasync(opts, direntarr, (opts, dirent, fn) => {
      const filepath = path.join(input, dirent.name)
      
      if (dirent.isFile() &&
          deploy_pattern.patternisvalidinputfilename(dirent.name)) {
        return deploy_fileconvert.convertbase(opts, filepath, fn)
      }

      if (dirent.isDirectory()) {
        return bfsconvertdir(opts, filepath, fn)
      }

      return fn(null, null)
    }, (err, res) => {
      if (err) return fn(err)
      
      if (deploy_file.isdir(path.join(input, UNIVERSAL))) {
        deploy_msg.applyuniverse(opts, path.join(input, UNIVERSAL))
        deploy_fileconvert.applyuniverse(opts, input, (err, res) => {
          if (err) return fn(err)
          
          fn(err, res)
        })
      } else {
        fn(err, res)
      }
    })
  })
}

const convert = async opts => {
  deploy_msg.start()

  opts = deploy_opts(opts)
  
  await util.promisify(bfsconvertdir)(opts, opts.inputDir)

  deploy_msg.finish()
}

export {
  convert as default,
  bfsconvertdir,
  convert
}
