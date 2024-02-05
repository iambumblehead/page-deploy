import {
  pgEnumQueryArgTypeROW,
  pgEnumQueryArgTypeROWIsRe
} from './pgEnum.js'

const pgChainSigArg = (recarg, type = typeof recarg) => {
  if (type === 'string') {
    recarg = pgEnumQueryArgTypeROWIsRe.test(recarg) ? 'row' : `"${recarg}"`
  } else if (type === 'object') {
    recarg = '...'
  } else if (Array.isArray(recarg)) {
    recarg = 'arr'
  }

  return recarg
}

const pgChainSigArgs = rec => rec[1][0] === pgEnumQueryArgTypeROW
  ? rec[1][3]
  : rec[1].map(arg => pgChainSigArg(arg)).join(', ')

// returns a human readable signature from reqlOb,
//
// ex, '.row("rose")("petal")'
const pgChainSig = reqlObj => (
  reqlObj && reqlObj.recs.reduce((prev, rec) => (
    prev + (/\.fn/.test(rec[0])
      ? `(${pgChainSigArgs(rec)})`
      : `.${rec[0]}(${pgChainSigArgs(rec)})`)), ''))

export default pgChainSig
