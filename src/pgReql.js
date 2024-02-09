import pgOpts from './pgOpts.js'
import pgChain from './pgChain.js'

export default (opts = {}) => {
  const dbState = pgOpts(opts)
  const d = pgChain(dbState)

  return {
    d: Object.assign((...args) => d.expr(... args), d),
    dbState
  }
}

