const pgenumREFTYPELOCAL = 'local-ref'

const pgenumSPECPROPTYPEDEF = 'def' // default
const pgenumSPECPROPTYPEFKEY = 'fkey'
const pgenumSPECPROPTYPEBASE = 'base'
const pgenumSPECPROPTYPEBASELIST = 'baselist'
const pgenumSPECPROPTYPESUBJ = 'subj'
const pgenumSPECPROPTYPECHILDSUBJ = 'childsubj'
const pgenumSPECPROPTYPEINIT = 'init'
const pgenumSPECPROPTYPEFULL = 'full'
const pgenumSPECPROPTYPECHILD = 'child'
const pgenumSPECPROPTYPEPART = 'part'
const pgenumSPECPROPTYPECACHE = 'cache'
const pgenumSPECPROPTYPES = [
  pgenumSPECPROPTYPEDEF,
  pgenumSPECPROPTYPEFKEY,
  pgenumSPECPROPTYPEBASE,
  pgenumSPECPROPTYPEBASELIST,
  pgenumSPECPROPTYPESUBJ,
  pgenumSPECPROPTYPECHILDSUBJ,
  pgenumSPECPROPTYPEINIT,
  pgenumSPECPROPTYPEFULL,
  pgenumSPECPROPTYPECHILD,
  pgenumSPECPROPTYPEPART,
  pgenumSPECPROPTYPECACHE,
  'className'// temporary
]

const pgenumSPECPROPTYPEisValidRe = new RegExp(
  `^(${pgenumSPECPROPTYPES.join('|')})$`)

const pgenumNODETYPEPATH = 'PATHNODE'

export {
  pgenumREFTYPELOCAL,
  pgenumSPECPROPTYPEisValidRe,

  pgenumNODETYPEPATH
}
