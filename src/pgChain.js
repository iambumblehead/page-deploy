import pgChainRawArg from './pgChainRawArg.js'
import pgChainRecNext from './pgChainRec.js'
import pgQuery from './pgQuery.js'

import {
  pgEnumQueryNameIsRESOLVINGRe,
  pgEnumQueryNameIsFIRSTTERMRe,
  pgEnumQueryArgTypeCHAIN
} from './pgEnum.js'

const chainFnCreate = (chains, queryName) => function (...args) {
  const chainCreate = pgChain // eslint-disable-line no-use-before-define
  const chain = pgChainRecNext(this, [
    queryName, pgChainRawArg(args, this.recId, chainCreate)])

  // must not follow another term, ex: r.expr( ... ).desc( 'foo' )
  if (chain.recs.length > 1 && pgEnumQueryNameIsFIRSTTERMRe.test(queryName)) {
    throw new Error(`.${queryName} is not a function`)
  }

  if (pgEnumQueryNameIsRESOLVINGRe.test(queryName)) {
    return queryName === 'serialize'
      ? JSON.stringify(chain.recs)
      : pgQuery(chain.state, { recId: chain.recId }, pgChainRecNext(chain))
  }

  return Object.assign((...fnargs) => {
    // eg: row => row('field')
    const chainNext = pgChainRecNext(chain, [
      `${queryName}.fn`, pgChainRawArg(fnargs, chain.recId, chainCreate)])

    return Object.assign((...attributeFnArgs) => (
      // eg: row => row('field')('attribute')
      Object.assign(chainNext, pgChainRecNext(chainNext, [
        'getField', pgChainRawArg(attributeFnArgs, chainNext.recId, chainCreate)
      ]), chains)
    ), chainNext, chains)
  }, chain, chains)
}

const chain = (() => {
  const chainPart = Object.keys(pgQuery).reduce((prev, queryName) => {
    prev[queryName] = typeof pgQuery[queryName] === 'function'
      ? chainFnCreate(prev, queryName)
      : pgQuery[queryName]

    return prev
  }, {
    toString: () => pgEnumQueryArgTypeCHAIN,
    type: pgEnumQueryArgTypeCHAIN
  })

  Object.assign(chainPart.row, chainPart)

  return chainPart
})()

// this complex flow is an optimization.
// query record calls are looped and defined once only.
// record calls are mapped to functions 'applied' to unique chain state
const pgChain = state => Object
  .assign({ state }, chain)

export default pgChain
