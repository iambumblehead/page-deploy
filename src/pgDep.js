import pgGraphBuild from './pgGraphBuild.js'
import pgGraphWrite from './pgGraphWrite.js'
import pgNodeDesign from './pgNodeDesign.js'
import pgManifest from './pgManifest.js'
import pgReql from './pgReql.js'
import pgLog from './pgLog.js'

import {
  pgUrlManifestCreate
} from './pgUrl.js'

import {
  pgFsWriteObj
} from './pgFs.js'

const pg = {
  creator: pgNodeDesign,  
  graphCreate: pgGraphBuild,
  graphWrite: pgGraphWrite,

  manifestWrite: async (opts, graph) => {
    const manifest = pgManifest(opts, graph)
    await pgFsWriteObj(
      opts, pgUrlManifestCreate(opts), manifest)
    pgLog(opts, JSON.stringify(manifest, null, '  '))
  }
}

export default Object.assign(pgReql, pg)
