// Filename: deploy_supportconvert.js  
// Timestamp: 2017.09.03-06:01:32 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>
//
// pickup and use 'support' directory and contents
// for given pattern

import fs from 'node:fs/promises'
import deploy_msg from './deploy_msg.js'
import deploy_file from './deploy_file.js'
import deploy_paths from './deploy_paths.js'

const writeSupportDir = (opts, rootfilename, outfilename, fn) => {
  const supportInput = deploy_paths.pathsupportdir(rootfilename)
  const supportOutput = deploy_paths.pathsupportdir(outfilename)

  if (!deploy_file.isdir(supportInput)) {
    return fn(null, null)
  }

  deploy_file.createPath(supportOutput, async err => {
    if (err) return fn(err)

    await fs.cp(supportInput, supportOutput, {
      recursive: true,
      force: true
    })

    deploy_msg.convertedfilename(opts, supportOutput)

    fn(null, 'success')
  })
}

export default {
  writeSupportDir
}
