const pgobjcreate = () => ({})

const pgobjget = (o, key) => (
  o[key])

const pgobjset = (o, key, val) => (
  o[key] = val,
  o)

const pgobjrm = (o, key) => (
  delete o[key],
  o)

export {
  pgobjcreate,
  pgobjget,
  pgobjset,
  pgobjrm
}
