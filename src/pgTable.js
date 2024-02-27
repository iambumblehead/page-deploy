import { randomUUID } from 'crypto'
import { pgEnumIsChainShallow } from './pgEnum.js'

import {
  pgLocaleIdResolve
} from './pgLocale.js'

const isNumOrStr = (o, to = typeof o) => (
  to === 'number' || to === 'string')

const pgTableDocIsPrimaryKey = (doc, primaryKey) => Boolean(
  doc && isNumOrStr(doc[primaryKey]))

const pgTableIdOrDocAsPrimaryKey = (idOrDoc, primaryKey) => (
  isNumOrStr(idOrDoc)
    ? idOrDoc
    : idOrDoc && idOrDoc[primaryKey])

// experimental for now, should return an ordered list
// an exact match is returned immediately, fallback documents
// added to list and best match returned
const pgTableDocGet = (table, idOrDoc, primaryKey, lang) => {
  const id = pgTableIdOrDocAsPrimaryKey(idOrDoc, primaryKey)
  const idLang = id + '.' + pgLocaleIdResolve(lang)
  const isDocId = doc => {
    const docId = doc[primaryKey]

    return docId === idLang
      || docId === id
  }

  return table.find(isDocId) || null
}

const pgTableDocsGet = (table, idOrDocs = [], primaryKey = 'id') => {
  const ids = isNumOrStr(idOrDocs[0])
    ? idOrDocs
    : idOrDocs.map(i => i && i[primaryKey])
  const idsRe = new RegExp(`^(${ids.join('|')})$`)

  return table.filter(doc => idsRe.test(doc[primaryKey]))
}

const pgTableDocRm = (table, doc, primaryKey = 'id') => {
  if (!pgTableDocIsPrimaryKey(doc, primaryKey))
    return [table]

  const existingIndex = table
    .findIndex(d => d[primaryKey] === doc[primaryKey])

  if (existingIndex > -1)
    table.splice(existingIndex, 1)

  return [table]
}

const pgTableDocEnsurePrimaryKey = (doc, primaryKey) => {
  if (!pgTableDocIsPrimaryKey(doc, primaryKey))
    doc[primaryKey] = randomUUID()

  return doc
}

const pgTableDocsSet = (table, docs, primaryKey = 'id') => {
  docs = docs.map(doc => {
    [table] = pgTableDocRm(table, doc, primaryKey)

    table.push(
      pgTableDocEnsurePrimaryKey(doc, primaryKey))

    return doc
  })

  return [table, docs]
}

const pgTableDocsRmAll = table => {
  table.length = 0

  return [table]
}

// set the entire table, replace existing documents
const pgTableSet = (table, docs) => {
  table.length = 0

  docs.forEach(doc => table.push(doc))

  return [table]
}

const pgTableDocSpecSpend = async (spend, cst, qst, spec, doc) => (
  spend(cst, qst, spec, [doc]))

const pgTableDocSpecSpendAll = async (spend, cst, qst, specs, doc, ac = []) => {
  if (specs.length === 0)
    return ac

  ac.push(await spend(cst, qst, specs[0], [doc]))

  return pgTableDocSpecSpendAll(spend, cst, qst, specs.slice(1), doc, ac)
}

const pgTableDocGetIndexValue = async (doc, idxl, spend, qst, cst, idxDef) => {
  const [indexName, spec] = idxl

  if (pgEnumIsChainShallow(spec)) {
    idxDef = Array.isArray(spec)
      ? await pgTableDocSpecSpendAll(spend, cst, qst, spec, doc)
      : await pgTableDocSpecSpend(spend, cst, qst, spec, doc)
      // ? spec.map(field => spend(cst, qst, field, [doc]))
      // : spend(cst, qst, spec, [doc])
  } else {
    idxDef = doc[indexName]
  }

  return idxDef
}

const pgTableDocHasIndexValueFn = (tableIndexTuple, indexValues, dbState) => {
  const targetIndexMulti = Boolean(tableIndexTuple[2].multi)
  const targetValueRe = targetIndexMulti
    || new RegExp(`^(${indexValues.join('|')})$`)
  const targetValueIs = valueResolved => targetValueRe.test(valueResolved)

  return (doc, spend, qst) => {
    const indexValueResolved = pgTableDocGetIndexValue(
      doc, tableIndexTuple, spend, qst, dbState)

    if (!targetIndexMulti)
      return targetValueIs(indexValueResolved)

    return indexValues.every(value => (
      Array.isArray(indexValueResolved)
        ? indexValueResolved.flat().includes(value)
        : indexValueResolved === value))
  }
}

export {
  pgTableDocGet,
  pgTableDocsGet,
  pgTableDocsSet,
  pgTableDocRm,
  pgTableDocsRmAll,
  pgTableDocGetIndexValue,
  pgTableDocEnsurePrimaryKey,
  pgTableDocIsPrimaryKey,
  pgTableDocHasIndexValueFn,
  pgTableSet
}
