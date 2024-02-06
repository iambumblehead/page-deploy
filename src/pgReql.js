import pgOpts from './pgOpts.js'
import pgChain from './pgChain.js'

const buildChain = (dbState = {}) => {
  const d = pgChain(dbState)

  return {
    d: Object.assign((...args) => d.expr(... args), d),
    dbState
  }
}
//
export default opts => buildChain(pgOpts(opts))
