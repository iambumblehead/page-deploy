const pgEnumREFTYPELOCAL = 'local-ref'

const pgEnumSPECPROPTYPEDEF = 'def' // default
const pgEnumSPECPROPTYPEFKEY = 'fkey'
const pgEnumSPECPROPTYPEBASE = 'base'
const pgEnumSPECPROPTYPEBASELIST = 'baselist'
const pgEnumSPECPROPTYPESUBJ = 'subj'
const pgEnumSPECPROPTYPECHILDSUBJ = 'childsubj'
const pgEnumSPECPROPTYPEINIT = 'init'
const pgEnumSPECPROPTYPEFULL = 'full'
const pgEnumSPECPROPTYPECHILD = 'child'
const pgEnumSPECPROPTYPEPART = 'part'
const pgEnumSPECPROPTYPECACHE = 'cache'
const pgEnumSPECPROPTYPES = [
  pgEnumSPECPROPTYPEDEF,
  pgEnumSPECPROPTYPEFKEY,
  pgEnumSPECPROPTYPEBASE,
  pgEnumSPECPROPTYPEBASELIST,
  pgEnumSPECPROPTYPESUBJ,
  pgEnumSPECPROPTYPECHILDSUBJ,
  pgEnumSPECPROPTYPEINIT,
  pgEnumSPECPROPTYPEFULL,
  pgEnumSPECPROPTYPECHILD,
  pgEnumSPECPROPTYPEPART,
  pgEnumSPECPROPTYPECACHE
  // 'className'// temporary
]

const pgEnumSPECPROPTYPEisValidRe = new RegExp(
  `^(${pgEnumSPECPROPTYPES.join('|')})$`)
const pgEnumSPECPROPTYPELOOKUPisValidRe = new RegExp(
  `^(${pgEnumSPECPROPTYPES.join('|')})\\.`)

const pgEnumNODETYPEPATH = 'PATHNODE'

const pgEnumQueryArgTypeCHAIN = 'reqlARGSCHAIN'
const pgEnumQueryArgTypeARGS = 'reqlARGSRESULT'
const pgEnumQueryArgTypeARGSIG = 'reqlARGSIG'

const pgEnumQueryArgTypeCHAINIsRe = new RegExp(`^${pgEnumQueryArgTypeCHAIN}`)
const pgEnumQueryArgTypeCHAINHasRe = new RegExp(`${pgEnumQueryArgTypeCHAIN}`)

const pgEnumTypeERROR = 'reqlERROR'

const pgEnumQueryNamesResolving = [
  'serialize', 'run']

const pgEnumQueryNamesFirstTerm = [
  'desc', 'asc', 'now', 'time', 'epochTime', 'ISO8601']

const pgEnumQueryNamesGreedy = [
  'typensprop', 'typefn']

// eslint-disable-next-line security/detect-non-literal-regexp
const pgEnumQueryNameIsRESOLVINGRe = new RegExp(
  `^(${pgEnumQueryNamesResolving.join('|')})$`)
// eslint-disable-next-line security/detect-non-literal-regexp
const pgEnumQueryNameIsFIRSTTERMRe = new RegExp(
  `^(${pgEnumQueryNamesFirstTerm.join('|')})$`)

const pgEnumQueryNameIsGREEDYRe = new RegExp(
  `^(${pgEnumQueryNamesGreedy.join('|')})$`)

const pgEnumQueryNameIsCURSORORDEFAULTRe = /getCursor|default/

const pgEnumIsLookObj = obj => obj
  && typeof obj === 'object' && !(obj instanceof Date)

const pgEnumIsChain = obj => pgEnumIsLookObj(obj)
  && pgEnumQueryArgTypeCHAINIsRe.test(obj.type)

const pgEnumIsChainShallow = obj => pgEnumIsLookObj(obj) && (
  pgEnumQueryArgTypeCHAINIsRe.test(obj.type) ||
    pgEnumQueryArgTypeCHAINHasRe.test(Object.values(obj).join()))

const pgEnumIsChainDeep = (obj, depth = 4) => pgEnumIsLookObj(obj) && (
  pgEnumIsChainShallow(obj) || (
    depth && Object.keys(obj).some(k => pgEnumIsChainDeep(obj[k], depth - 1))))

const pgEnumIsQueryArgsResult = obj => pgEnumIsLookObj(obj)
  && Boolean(pgEnumQueryArgTypeARGS in obj)

const pgEnumIsNodeDesign = obj => {
  return obj && typeof obj === 'object' &&
    'nodespec' in obj
}

export {
  pgEnumREFTYPELOCAL,
  pgEnumSPECPROPTYPEisValidRe,
  pgEnumSPECPROPTYPELOOKUPisValidRe,

  pgEnumNODETYPEPATH,

  
  pgEnumQueryArgTypeARGS,
  pgEnumQueryArgTypeARGSIG,
  pgEnumQueryArgTypeCHAIN,
  pgEnumQueryArgTypeCHAINIsRe,
  pgEnumQueryArgTypeCHAINHasRe,

  pgEnumQueryNameIsRESOLVINGRe,
  pgEnumQueryNameIsFIRSTTERMRe,
  pgEnumQueryNameIsCURSORORDEFAULTRe,
  pgEnumQueryNameIsGREEDYRe,

  pgEnumTypeERROR,

  pgEnumIsChain,
  pgEnumIsChainShallow,
  pgEnumIsChainDeep,
  pgEnumIsQueryArgsResult,
  pgEnumIsNodeDesign
}
