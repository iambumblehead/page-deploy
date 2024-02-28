import { randomUUID } from 'crypto'
import url from 'node:url'
import pgManifest from './pgManifest.js'

import {
  pgLocaleDocResolve,
  pgLocaleIdResolve
} from './pgLocale.js'

import {
  pgKeyLangRemove
} from './pgKey.js'

import {
  pgErrArgsNumber,
  pgErrTableExists,
  pgErrInvalidTableName,
  pgErrTableDoesNotExist,
  pgErrCannotUseNestedRow,
  pgErrNoAttributeInObject,
  pgErrPrimaryKeyWrongType,
  pgErrNotATIMEpsuedotype,
  pgErrExpectedTypeFOOButFoundBAR,
  pgErrCannotCallFOOonBARTYPEvalue,
  pgErrIndexOutOfBounds,
  pgErrUnrecognizedOption,
  pgErrInvalidDbName,
  pgErrPrimaryKeyCannotBeChanged,
  pgErrDuplicatePrimaryKey,
  pgErrSecondArgumentOfQueryMustBeObject
} from './pgErr.js'

import {
  pgEnumIsGraph,
  pgEnumNodeDesignTypeIs,
  pgEnumNodeDesignTypeResolverIs,
  // pgEnumGRAPHMETADESIGNNODEMAPS,
  pgEnumSPECPROPTYPELOOKUPisValidRe,
  // pgEnumIsNodeDesign,
  pgEnumTypeERROR,
  pgEnumQueryArgTypeARGSIG,
  pgEnumQueryArgTypeARGS,
  pgEnumQueryArgTypeCHAIN,
  pgEnumQueryNameIsDEFAULTRe,
  // pgEnumQueryNameIsCURSORORDEFAULTRe,
  pgEnumIsQueryArgsResult,
  pgEnumIsChainShallow,
  pgEnumIsChain
} from './pgEnum.js'

import {
  pgDbStateAggregate,
  pgDbStateDbCreate,
  pgDbStateDbDrop,
  pgDbStateDbGet,
  // pgDbStateTableSet,
  pgDbStateTableGet,
  pgDbStateTableGetResolved,
  pgDbStateTableIndexAdd,
  pgDbStateTableGetIndexNames,
  pgDbStateTableGetIndexTuple,
  pgDbStateTableGetPrimaryKey,

  // mmDbStateTableCursorSet,
  // mmDbStateTableDocCursorSet,
  // mmDbStateTableCursorSplice,
  // mmDbStateTableDocCursorSplice,
  // mmDbStateTableCursorsPushChanges,
  // mmDbStateTableCursorsGetOrCreate,
  // mmDbStateTableDocCursorsGetOrCreate,
  pgDbStateTableConfigGet,
  pgDbStateTableCreate,
  pgDbStateTableDrop,
  pgDbStateDbConfigGet
} from './pgDbState.js'

import {
  // pgQueryResFilterUndefined,
  // pgQueryResChangeTypeADD,
  // pgQueryResChangeTypeREMOVE,
  // pgQueryResChangeTypeCHANGE,
  // pgQueryResChangeTypeINITIAL,
  // pgQueryResChangeTypeUNINITIAL,
  // pgQueryResChangeTypeSTATE,

  pgQueryResChangesErrorPush,
  pgQueryResChangesSpecFinal,
  pgQueryResChangesSpecPush,
  pgQueryResChangesFieldCreate,
  pgQueryResTableStatus,
  pgQueryResTableInfo
} from './pgQueryRes.js'

import {
  pgTableDocGet,
  pgTableDocRm,
  pgTableDocsGet,
  pgTableDocsSet,
  pgTableDocHasIndexValueFn,
  pgTableDocGetIndexValue,
  pgTableDocEnsurePrimaryKey,
  pgTableSet
} from './pgTable.js'

import {
  pgGraphResolverLocaleKeyGet
} from './pgGraph.js'

import {
  pgMdParse
} from './pgMd.js'

import {
  pgArrFilterAsync,
  pgArrMapAsync,
  pgArrReduceAsync,
  pgArrSomeAsync,
  pgArrEveryAsync
} from './pgArr.js'

// pending removal, should use event system
import pgLog from './pgLog.js'

import {
  pgUrlManifestCreate
} from './pgUrl.js'

import {
  pgFsRead,
  pgFsWriteObj  
} from './pgFs.js'

import pgGraphWrite from './pgGraphWrite.js'
import pgGraphBuild from './pgGraphBuild.js'


// const isBoolNumStrRe = /boolean|number|string/
const isBoolNumUndefRe = /boolean|number|undefined/

const isLookObj = obj => obj
  && typeof obj === 'object'
  && !(obj instanceof Date)

const reqlArgsParse = obj => (
  obj[pgEnumQueryArgTypeARGS])

const reqlArgsCreate = value => (
  { [pgEnumQueryArgTypeARGS]: value })

const isNumOrStr = (o, to = typeof o) => (
  to === 'number' || to === 'string')

const isBoolNumOrStr = (o, to = typeof o) => (
  to === 'boolean' || to === 'number' || to === 'string')

// created by 'asc' and 'desc' queries
const isSortObj = obj => isLookObj(obj)
  && 'sortBy' in obj

const sortObjParse = o => isLookObj(o)
  ? (isSortObj(o) ? o : isSortObj(o.index) ? o.index : null)
  : null

const isConfigObj = (obj, objType = typeof obj) => obj
  && /object|function/.test(objType)
  && !pgEnumIsChain(obj)
  && !Array.isArray(obj)

// return last query argument (optionally) provides query configurations
const queryArgsOptions = (queryArgs, queryOptionsDefault = {}) => {
  const queryOptions = queryArgs.slice(-1)[0] || {}

  return isConfigObj(queryOptions)
    ? queryOptions
    : queryOptionsDefault
}

// use when order not important and sorting helps verify a list
const compare = (a, b, prop) => {
  if (a[prop] < b[prop]) return -1
  if (a[prop] > b[prop]) return 1
  return 0
}

const asList = value => Array.isArray(value) ? value : [value]

const q = {}

const spendRecs = async (db, qst, reqlObj, rows) => {
  if (rows && rows.length) {
    qst.rowMap[reqlObj.recId] = rows.slice()
  }

  let qstNext = {
    // if nested spec is not a function expression,
    // pass target value down from parent
    //
    // r.expr(...).map(
    //   r.branch(
    //     r.row('victories').gt(100),
    //     r.row('name').add(' is a hero'),
    //     r.row('name').add(' is very nice')))
    target: reqlObj.recs[0][0] === 'row' ? qst.target : null,
    recId: reqlObj.recId,
    rowMap: qst.rowMap || {},
    rowDepth: qst.rowDepth || 0
  }

  // const val = reqlObj.recs.reduce((qstNext, rec, i) => {
  // for (let i in reqlObj.recs) {
  for (let i = 0; i < reqlObj.recs.length; i++) {
    let rec = reqlObj.recs[i]

    // const val = reqlObj.recs.reduce((qstNext, rec, i) => {
    // avoid mutating original args w/ suspended values
    const queryArgs = rec[1].slice()

    if (qstNext.error && !pgEnumQueryNameIsDEFAULTRe.test(rec[0]))
      return qstNext    
    
    if (rec[0] === 'row') {
      // following authentic rethinkdb, disallow most nested short-hand
      // row queries. legacy 'rethinkdb' driver is sometimes more permissive
      // than newer rethinkdb-ts: rethinkdb-ts behaviour preferred here
      //
      // ex, nested r.row('membership') elicits an error
      // ```
      // r.expr(list).filter( // throws error
      //   r.row('user_id').eq('xavier').or(r.row('membership').eq('join'))
      // ```
      if (qstNext.rowDepth >= 1 && i === 0 && (
        // existance of ARGSIG indicates row function was used
        pgEnumQueryArgTypeARGSIG !== rec[1][0])) {
        throw pgErrCannotUseNestedRow()
      } else {
        qstNext.rowDepth += 1
      }
    }

    if (i === 0 && rows && !/\(.*\)/.test(reqlObj.recId)) {
      // assigns row from callee to this pattern target,
      //  * this pattern must represent the beginning of a chain
      //  * this pattern is not a 'function'; pattern will not resolve row
      //
      // ex, filter passes each item to the embedded 'row'
      // ```
      // r.expr(list).filter(
      //   r.row('time_expire').during(
      //     r.epochTime(0),
      //     r.epochTime(now / 1000)))
      // ```
      qstNext.target = rows[0]
    }

    try {
      qstNext = await (/\.fn/.test(rec[0])
        ? q[rec[0].replace(/\.fn/, '')].fn
        : q[rec[0]]
      )(db, qstNext, queryArgs, reqlObj)
    } catch (e) {
      // do not throw error if chain subsequently uses `.default(...)`
      // * if no future default query exists, tag error
      // * throw all tagged errors up to user
      qstNext.target = null
      qstNext.error = e

      e[pgEnumTypeERROR] = typeof e[pgEnumTypeERROR] === 'boolean'
        ? e[pgEnumTypeERROR]
        : !reqlObj.recs.slice(i + 1)
          .some(o => pgEnumQueryNameIsDEFAULTRe.test(o[0]))

      if (e[pgEnumTypeERROR])
        throw e
    }

    // return qstNext
    // return qstNext
  }
  /*
  }, {
    // if nested spec is not a function expression,
    // pass target value down from parent
    //
    // r.expr(...).map(
    //   r.branch(
    //     r.row('victories').gt(100),
    //     r.row('name').add(' is a hero'),
    //     r.row('name').add(' is very nice')))
    target: reqlObj.recs[0][0] === 'row' ? qst.target : null,
    recId: reqlObj.recId,
    rowMap: qst.rowMap || {},
    rowDepth: qst.rowDepth || 0
  })
  */

  // return val.target
  return qstNext.target
}

// eslint-disable-next-line max-len
const spend = async (db, qst, qspec, rows, d = 0, type = typeof qspec, f = null) => {
  if (qspec === f
    || isBoolNumUndefRe.test(type)
    || qspec instanceof Date) {
    f = qspec
  } else if (d === 0 && type === 'string') {
    // return field value from query like this,
    // ```
    // row('fieldname')
    // ```
    // seems okay now, may require deeper lookup later
    f = rows && rows[0] ? rows[0][qspec] : qspec
  } else if (pgEnumIsChain(qspec)) {
    // why re-use existing reql.rows, eg `spec.rows || rows`?
    // ```
    // r.expr([{ type: 'boot' }]).contains(row => r
    //  .expr([ 'cleat' ]).contains(row.getField('type')))
    //  .run();
    // ```
    // `{ type: 'boot' }` is correct, existing row at `row.getField('type')`,
    // but '.contains( ... )' would define incorrect row 'cleat'.
    //
    // current unit-tests pass, but logic could be wrong in some situations
    f = await spendRecs(db, qst, qspec, rows)
  } else if (Array.isArray(qspec)) {
    // detach if spec is has args
    if (pgEnumIsQueryArgsResult(qspec.slice(-1)[0])) {
      f = await qspec.slice(-1)[0].run()
    } else {
      // f = qspec.map(v => spend(db, qst, v, rows, d + 1))
      let newf = []
      for (let i in qspec) {
        newf[i] = await spend(db, qst, qspec[i], rows, d + 1)
      }
      f = newf
      f = pgEnumIsQueryArgsResult(f[0]) ? reqlArgsParse(f[0]) : f
    }
    // render nested query objects, shallow. ex `row('id')`,
    // ```
    // r.expr([{ id: 1 }, { id: 2 }])
    //  .merge(row => ({ oldid: row('id'), id: 0 }))
    //  .run()
    // ```    
  } else if (pgEnumIsChainShallow(qspec)) {
    let newf = {}
    for (let key in qspec) {
      newf[key] = await spend(db, qst, qspec[key], rows, d + 1)
    }
    f = newf
    /*
    f = Object.keys(qspec).reduce((prev, key) => {
      prev[key] = spend(db, qst, qspec[key], rows, d + 1)

      return prev
    }, {})
    */
  } else {
    f = qspec
  }

  return f
}

const mockdbReqlQueryOrStateDbName = (qst, db) => (
  qst.db || db.dbSelected)

// as well as resolving locale sources, also constructs
// additional options around those, such as priortiy locale
// lists using list of locale derived from the sources
const mockdbi18nResolved = async (st, qst) => {
  const dbname = mockdbReqlQueryOrStateDbName(qst, st)
  const i18ntable = pgDbStateTableGet(st, dbname, 'i18n')
  const i18ndoc = (i18ntable || [])[0]

  if (!i18ndoc || i18ndoc.resolved) {
    return i18ndoc
  }

  if (i18ndoc.csv && i18ndoc.csv.endsWith('.csv')) {
    i18ndoc.csv = await pgFsRead(new url.URL(i18ndoc.csv, st.metaurl))
    i18ndoc.priority = st.i18nPriority || i18ndoc.priority
      || (i18ndoc.csv && i18ndoc.csv.match(/(?<=")\w\w\w?-\w\w(?=")/g))
      || ['eng-US']
  }

  if (!i18ndoc.priority) {
    i18ndoc.priority = st.i18nPriority || ['eng-US']
  }

  return i18ndoc
}

// 'i' for 'i18n'
q.i = async (st, qst, args) => {
  const key = args[0]
  const valdefault = args[1]
  const i18nDoc = await mockdbi18nResolved(st, qst)

  // todo: rename 'lang' to 'localeId' here (later)
  qst.target = typeof st.i18nResolve === 'function'
    ? st.i18nResolve(st, i18nDoc, key, valdefault, st.lang)
    : pgLocaleDocResolve(st, i18nDoc, key, valdefault, st.lang)

  return qst
}

q.node = (st, qst, args) => {
  const nodeidorspec = args[0]
  const graph = st.graph
  const isdesign = (
    pgEnumNodeDesignTypeResolverIs(nodeidorspec)
      || pgEnumNodeDesignTypeIs(nodeidorspec))
  const key = isdesign && pgGraphResolverLocaleKeyGet(
    graph, st.lang, nodeidorspec.nodescriptid)

  // key: '/dataenv/:eng-US'
  if (key) {
    qst.target = graph[key]
  }

  return qst
}

q.typefn = (st, qst, args) => {
  const name = args[1] || st.outerprop
  
  // const node = pgEnumIsNodeDesign(qst.target)
  //    ? qst.target
  //    : qst.node
  
  qst.target = {
    type: 'fn',
    fnname: args[0],
    name
  }

  return qst
}

q.typeliteral = async (db, qst, args) => {
  qst.target = {
    type: 'literal',
    value: await spend(db, qst, args[0])
  }

  return qst
}

q.typensprop = (st, qst, args) => {
  const node = pgEnumNodeDesignTypeIs(qst.target)
    ? qst.target
    : st.node

  const nslookup = args[0]
  const outerprop = st.outerprop
  const nodekey = node && node.key
  const nsfull = pgEnumSPECPROPTYPELOOKUPisValidRe.test(nslookup)
    ? nslookup : `subj.${nslookup}`
  const propfull = (nodekey && !nslookup.startsWith('part.'))
    ? `[${pgKeyLangRemove(nodekey)}].${nsfull}`
    : nsfull

  // {
  //    type: "nsprop",
  //    prop: "[/dataenv].subj.requrl",
  //    name: "value"
  // }
  qst.target = {
    type: 'nsprop',
    prop: propfull,
    name: outerprop
  }

  return qst
}

q.graph = async (st, qst, args) => {
  const tree = args[0]

  if (!Array.isArray(tree))
    throw new Error('unknown target for graph (needs tree)')

  // list of languages used when building the graph
  st.i18nPriority = st.i18nPriority
    || (await mockdbi18nResolved(st, qst) || {}).priority
    || ['eng-US']

  qst.target = await pgGraphBuild(tree, st)

  return qst
}

q.write = async (st, qst, args) => {
  const target = qst.target
  const writeopts = args[0] || {}
  const newst = Object.assign({}, st, writeopts)

  if (pgEnumIsGraph(target)) {
    await pgGraphWrite(target, newst)
    const manifest = await pgManifest(
      Object.assign({}, st, target.META_DETAILS), target)

    await pgFsWriteObj(
      newst, pgUrlManifestCreate(newst), manifest)
    pgLog(newst, JSON.stringify(manifest, null, '  '))
  } else {
    throw new Error('unsupported write target')
  }

  return qst
}

q.tree = async (st, qst, args) => {
  const tree = args[0]

  qst.target = tree

  return qst
}

q.md = async (st, qst, args) => {
  const path = args[0] || qst.target

  qst.target = path

  // if no new lines and if it ends with 'md', build it
  // consider $lang and :pg vars
  if (String(path).includes('\n')) {
    await pgFsRead(path)
  } else if (path.endsWith('.md')) {
    const mdurl = new url.URL(path, st.metaurl)
    const mdstr = await pgFsRead(mdurl)
    const mdobj = pgMdParse(path, mdstr)

    qst.target = mdobj
  } else if (path.endsWith('/')) {
    // try to find dir?
  }

  return qst
}

// this calls row then row.fn
// r.row('age').gt(5)
// r.row → value
// row => row('name_screenname')
// r.row( 'hobbies' ).add( r.row( 'sports' )
//
// dynamic row sometimes passes value,
//   [ 'reqlARGSSUSPEND', 'reqlARGSIG.row', 0, 'row' ]
//
// target row will include value in qst.target
// question: should it be possible for qst.target to be defined here?
//           even when ...
//
q.row = (cst, qst, args) => {
  if (args[0] === pgEnumQueryArgTypeARGSIG && !(args[1] in qst.rowMap)) {
    // keep this for development
    // console.log(qst.target, mockdbSpecSignature(reqlObj), args, qst.rowMap);
    throw new Error('[!!!] error: missing ARGS from ROWMAP')
  }

  qst.target = args[0] === pgEnumQueryArgTypeARGSIG
    ? qst.rowMap[args[1]][args[2]]
    : qst.target[args[0]]

  // console.log(
  //   'r.row() target',
  //   qst.target,
  //   args[0] === pgEnumQueryArgTypeARGSIG)
  return qst
}

q.row.fn = async (cst, qst, args) => {
  if (typeof args[0] === 'string' && !(args[0] in qst.target)) {
    throw pgErrNoAttributeInObject(args[0])
  }

  return q.getField(cst, qst, args)
}

q.default = async (st, qst, args) => {
  if (qst.target === null) {
    qst.error = null
    qst.target = await spend(st, qst, args[0])
  }

  return qst
}

q.expr = async (st, qst, args) => {
  const [argvalue] = args

  qst.target = await spend(st, qst, argvalue, [qst.target])

  return qst
}

q.expr.fn = (st, qst, args) => {
  if (Array.isArray(qst.target)) {
    qst.target = qst.target.map(t => t[args[0]])
  } else if (args[0] in qst.target) {
    qst.target = qst.target[args[0]]
  } else {
    throw pgErrNoAttributeInObject(args[0])
  }

  return qst
}

q.coerceTo = async (cst, qst, args) => {
  const coerceType = String(args[0]).toLowerCase()
  let resolved = await spend(cst, qst, qst.target)

  if (coerceType === 'string')
    resolved = String(resolved)

  qst.target = resolved

  return qst
}

q.upcase = (st, qst) => {
  qst.target = String(qst.target).toUpperCase()

  return qst
}

q.downcase = (st, qst) => {
  qst.target = String(qst.target).toLowerCase()

  return qst
}

// Used to ‘zip’ up the result of a join by merging the ‘right’ fields into
// ‘left’ fields of each member of the sequence.
q.zip = (db, qst) => {
  qst.target = qst.target
    .map(t => ({ ...t.left, ...t.right }))

  return qst
}

q.map = async (st, qst, args) => {
  // qst.target = qst
  //   .target.map(t => spend(st, qst, args[0], [t]))
  qst.target = await pgArrMapAsync(
    qst.target.slice(), async listoldi => (
      // console.log({ listoldi }),
      spend(st, qst, args[0], [listoldi])))

  return qst
}

q.isEmpty = async (st, qst) => {
  qst.target = qst.target.length === 0

  return qst
}

q.union = async (db, qst, args) => {
  const queryOptions = queryArgsOptions(args, null)

  if (queryOptions)
    args.splice(-1, 1)

  // let res = args.reduce((acc, arg) => {
  let res = await pgArrReduceAsync(args, async (ac, arg) => {
    return ac.concat(await spend(db, qst, arg))
  }, qst.target || [])

  if (queryOptions && queryOptions.interleave) {
    res = res.sort(
      (a, b) => compare(a, b, queryOptions.interleave)
    )
  }

  qst.target = res

  return qst
}

// Rethink has its own alg for finding distinct,
// but unique by ID should be sufficient here.
q.distinct = async (db, qst, args) => {
  const queryOptions = queryArgsOptions(args)
  const dbName = mockdbReqlQueryOrStateDbName(qst, db)

  if (Array.isArray(qst.target)
    && qst.tablename
    // skip if target is filtered, concatenated or manipulated in some way
      && !isBoolNumOrStr(qst.target[0])) {
    const primaryKey = queryOptions.index
      || pgDbStateTableGetPrimaryKey(db, dbName, qst.tablename)

    const keys = {}
    qst.target = qst.target.reduce((disti, row) => {
      const value = row[primaryKey]

      if (!keys[value]) {
        keys[value] = true
        disti.push(row)
      }

      return disti
    }, [])
  } else if (Array.isArray(qst.target)) {
    qst.target = qst.target.filter(
      (item, pos, self) => self.indexOf(item) === pos)
  } else if (Array.isArray(args[0])) {
    qst.target = args[0].filter(
      (item, pos, self) => self.indexOf(item) === pos)
  }

  return qst
}

q.without = async (st, qst, args) => {
  const queryTarget = qst.target

  const withoutFromDoc = (doc, withoutlist) => Object.keys(doc)
    .reduce((newdoc, key) => {
      if (!withoutlist.includes(key))
        newdoc[key] = doc[key]

      return newdoc
    }, {})

  const withoutFromDocList = (doclist, withoutlist) => doclist
    .map(doc => withoutFromDoc(doc, withoutlist))

  if (args.length === 0) {
    throw pgErrArgsNumber('without', 1, args.length)
  }

  args = await spend(st, qst, args)

  if (qst.eqJoinBranch) {
    const isleft = 'left' in args[0]
    const isright = 'right' in args[0]
    const leftArgs = isleft && asList(args[0].left)
    const rightArgs = isright && asList(args[0].right)

    if (isleft || isright) {
      qst.target = queryTarget.map(qt => {
        if (isright)
          qt.right = withoutFromDoc(qt.right, rightArgs)

        if (isleft)
          qt.left = withoutFromDoc(qt.left, leftArgs)

        return qt
      })
    }
  } else {
    qst.target = Array.isArray(queryTarget)
      ? withoutFromDocList(queryTarget, args)
      : withoutFromDoc(queryTarget, args)
  }

  return qst
}

// Call an anonymous function using return values from other
// ReQL commands or queries as arguments.
q.do = async (st, qst, args) => {
  const [doFn] = args.slice(-1)

  if (pgEnumIsChain(doFn)) {
    qst.target = args.length === 1
      ? await spend(st, qst, doFn, [qst.target])
      : await spend(st, qst, doFn, args.slice(0, -1))

    if (pgEnumIsQueryArgsResult(qst.target))
      qst.target = reqlArgsParse(qst.target)[0]

  } else if (args.length) {
    qst.target = doFn
  }

  return qst
}

q.or = async (st, qst, args) => {
  const rows = [qst.target]

  while (!qst.target && args.length) {
    qst.target = await spend(st, qst, args[0], rows)
    args = args.slice(1)
  }

  // qst.target = args.reduce((current, arg) => (
  //   current || spend(st, qst, arg, rows)
  // ), qst.target)

  return qst
}

q.and = (st, qst, args) => {
  const rows = [qst.target]

  qst.target = args.reduce((current, arg) => (
    current && spend(st, qst, arg, rows)
  ), typeof qst.target === 'boolean' ? qst.target : true)
  
  return qst
}

// r.args(array) → special
q.args = async (st, qst, args) => {
  const result = await spend(st, qst, args[0])
  if (!Array.isArray(result))
    throw new Error('args must be an array')

  qst.target = reqlArgsCreate(result)

  return qst
}

q.desc = async (st, qst, args) => {
  qst.target = {
    sortBy: await spend(st, qst, args[0], [qst.target]),
    sortDirection: 'desc'
  }

  return qst
}

q.asc = async (st, qst, args) => {
  qst.target = {
    sortBy: await spend(st, qst, args[0], [qst.target]),
    sortDirection: 'asc'
  }

  return qst
}

q.monday = 1
q.tuesday = 2
q.wednesday = 3
q.thursday = 4
q.friday = 5
q.saturday = 6
q.sunday = 7
q.january = 1
q.february = 2
q.march = 3
q.april = 4
q.may = 5
q.june = 6
q.july = 7
q.august = 8
q.september = 9
q.october = 10
q.november = 11
q.december = 12

q.run = (st, qst) => {
  if (qst.error) {
    throw new Error(qst.error)
  }

  // return qst.target;
  return qst
}

q.serialize = (cst, qst) => {
  qst.target = JSON.stringify(qst.chain)

  return qst
}

// The reduction function can be called on the results of two previous
// reductions because the reduce command is distributed and parallelized
// across shards and CPU cores. A common mistaken when using the reduce
// command is to suppose that the reduction is executed from left to right.
// Read the map-reduce in RethinkDB article to see an example.
//
// If the sequence is empty, the server will produce a ReqlRuntimeError
// that can be caught with default.
//
// TAKECARE: when shape of reduced value differs from shape of sequence values
//
// await r.expr([
//   { count: 3 }, { count: 0 },
//   { count: 6 }, { count: 7 }
// ]).reduce((left, right) => (
//   left('count').add(right('count').add(5))
// )).run()
//
// > 'Cannot perform bracket on a non-object non-sequence `8`.'
//
q.reduce = (st, qst, args) => {
  if (args.length === 0) {
    throw pgErrArgsNumber('reduce', 1, args.length)
  }

  // live rethinkdb inst returns sequence of 1 atom
  if (qst.target.length === 1) {
    [qst.target] = qst.target

    return qst
  }

  const seq = qst.target.sort(() => 0.5 - Math.random())

  qst.target = seq.slice(1)
    .reduce((st, arg) => spend(st, qst, args[0], [st, arg]), seq[0])

  return qst
}

// fold has the following differences from reduce:
//
//  * it is guaranteed to proceed through the sequence from
//    first element to last.
//  * it passes an initial base value to the function with the
//    first element in place of the previous reduction result.
//
q.fold = (st, qst, args) => {
  const [startVal, reduceFn] = args

  if (args.length < 2) {
    throw pgErrArgsNumber('fold', 2, args.length)
  }

  qst.target = qst.target
    .reduce((st, arg) => spend(st, qst, reduceFn, [st, arg]), startVal)

  return qst
}

q.forEach = async (cst, qst, args) => {
  const forEachRow = args[0]

  if (args.length !== 1) {
    throw pgErrArgsNumber('forEach', 1, args.length)
  }

  //qst.target = qst.target.reduce((st, arg) => {
  qst.target = await pgArrReduceAsync(qst.target, async (ac, arg) => {
    const result = await spend(cst, qst, forEachRow, [arg])

    return pgDbStateAggregate(ac, result)
  }, {})



  return qst
}

q.toISO8601 = (st, qst, args) => {
  const date = qst.target
  const tzo = -date.getTimezoneOffset()
  const dif = tzo >= 0 ? '+' : '-'
  const pad = num => (num < 10 ? '0' : '') + num

  qst.target = date.getFullYear() +
    '-' + pad(date.getMonth() + 1) +
    '-' + pad(date.getDate()) +
    'T' + pad(date.getHours()) +
    ':' + pad(date.getMinutes()) +
    ':' + pad(date.getSeconds()) +
    dif + pad(Math.floor(Math.abs(tzo) / 60)) +
    ':' + pad(Math.abs(tzo) % 60)

  return qst
}

q.toEpochTime = (cst, qst) => {
  qst.target = (new Date(qst.target)).getTime() / 1000

  return qst
}

q.date = (cst, qst) => {
  const dateYMD = new Date(qst.target)

  dateYMD.setMilliseconds(0)
  dateYMD.setSeconds(0)
  dateYMD.setMinutes(0)
  dateYMD.setHours(0)

  qst.target = dateYMD

  return qst
}

q.epochTime = (cst, qst, args) => {
  if (args.length !== 1)
    throw pgErrArgsNumber('r.epochTime', 1, args.length)
  
  qst.target = new Date(args[0] * 1000)

  return qst
}

q.now = (cst, qst) => {
  qst.target = new Date()

  return qst
}

// Return the hour in a time object as a number between 0 and 23.
q.hours = (cst, qst) => {
  qst.target = new Date(qst.target).getHours()

  return qst
}

q.minutes = (cst, qst) => {
  qst.target = new Date(qst.target).getMinutes()

  return qst
}

q.seconds = (cst, qst) => {
  qst.target = new Date(qst.target).getSeconds()

  return qst
}

q.time = async (db, qst, args) => {
  const timeargs = await spend(db, qst, args)

  if (timeargs.length < 4)
    throw pgErrArgsNumber('r.time', 4, args.length, true)

  if (!/^[4|7]$/.test(timeargs.length))
    throw new Error('Got 5 arguments to TIME (expected 4 or 7)')

  if (typeof timeargs[2] === 'number')
    timeargs[2] += 1

  if (timeargs[6]) {
    console.log('[!!!] r.time: zerotimezone not supported')
    timeargs.splice(6, 1)
  }

  while (typeof timeargs.slice(-1)[0] !== 'number')
    timeargs.splice(timeargs.length -1, 1)

  qst.target = new Date(...timeargs)
  
  return qst
}

q.inTimezone = async (cst, qst, args) => {
  const timezone = await spend(cst, qst, args)[0] // ex, '-08:00'

  if (args.length !== 1)
    throw pgErrArgsNumber('inTimezone', 1, args.length)

  const hhmm = timezone.split(':')
  const time = (+hhmm[0] * 60) + hhmm[1]
  qst.target = new Date(qst.target)
  qst.target.getTimezoneOffset = () => time

  // qst.target.timezoneOffset(time)
  // new Date().timezoneOffset(-180) // +3 UTC
  //  qst.target = new Date(qst.target.toISOString()
  //    .replace(/\.\d*Z$/, '') + timezone)
  
  return qst
}

q.timezone = async (cst, qst) => {
  const timezoneMinutes = qst.target.getTimezoneOffset()

  // convert minutes to hours
  const timezoneHours = timezoneMinutes > 0
    ? Math.floor(timezoneMinutes / 60)
    : Math.ceil(timezoneMinutes / 60)
  const timezoneHoursMin = timezoneMinutes - timezoneHours * 60
  const timezonePre =timezoneMinutes > 0 ? '-' : ''

  const timezoneStr = timezonePre + [
    String('0' + timezoneHours).slice(-2),
    String('0' + timezoneHoursMin).slice(-2)
  ].join(':')

  qst.target = timezoneStr

  return qst
}

q.ISO8601 = async (cst, qst, args) => {
  const isoargs = await spend(cst, qst, args)
  const isoopts = queryArgsOptions(isoargs)

  if (isoargs.length > 2)
    throw new Error('`r.ISO8601` takes at most 2 arguments, 3 provided.')
  if (typeof isoargs[0] !== 'string')
    throw pgErrArgsNumber('r.ISO8601', 1, args.length)
  
  const isostr = isoopts.defaultTimezone
    ? isoargs[0].replace(/-\d\d:\d\d$/, '') + isoopts.defaultTimezone
    : isoargs[0]

  qst.target = new Date(isostr)
  
  return qst
}

// time.during(startTime, endTime[, {
//   leftBound: "closed", rightBound: "open"
// }]) → bool
q.during = async (cst, qst, args) => {
  const [start, end] = args
  const startTime = await spend(cst, qst, start)
  const endTime = await spend(cst, qst, end)

  if (args.length < 2)
    throw pgErrArgsNumber('during', 2, args.length, true)

  if (args.length > 3)
    throw new Error(
      '`during` takes at most 3 arguments, ' + args.length + ' provided.')

  qst.target = (
    qst.target.getTime() > startTime.getTime()
      && qst.target.getTime() < endTime.getTime()
  )

  return qst
}

// used for selecting/specifying db, not supported yet
q.db = async (cst, qst, args) => {
  const [dbName] = args
  const isValidDbNameRe = /^[A-Za-z0-9_]*$/

  if (!args.length) {
    throw pgErrArgsNumber('r.db', 1, args.length)
  }

  if (!isValidDbNameRe.test(dbName)) {
    throw pgErrInvalidDbName(dbName)
  }

  qst.db = dbName

  return qst
}

q.dbList = (cst, qst) => {
  qst.target = Object.keys(cst.db)

  return qst
}

q.dbCreate = async (cst, qst, args) => {
  const dbName = await spend(cst, qst, args[0])

  if (!args.length)
    throw pgErrArgsNumber('r.dbCreate', 1, args.length)

  pgDbStateDbCreate(cst, dbName)

  qst.target = {
    config_changes: [{
      new_val: pgDbStateDbConfigGet(dbName),
      old_val: null
    }],
    dbs_created: 1
  }

  return qst
}

q.dbDrop = (db, qst, args) => {
  const [dbName] = args
  const dbConfig = pgDbStateDbConfigGet(db, dbName)
  const tables = pgDbStateDbGet(db, dbName)

  if (args.length !== 1) {
    throw pgErrArgsNumber('r.dbDrop', 1, args.length)
  }

  db = pgDbStateDbDrop(db, dbName)

  qst.target = {
    config_changes: [{
      new_val: null,
      old_val: dbConfig
    }],
    dbs_dropped: 1,
    tables_dropped: Object.keys(tables).length
  }

  return qst
}

q.table = async (st, qst, args) => {
  const tablename = args[0]
  const dbName = mockdbReqlQueryOrStateDbName(qst, st)
  const table = await pgDbStateTableGetResolved(st, dbName, tablename)

  if (!Array.isArray(table))
    throw pgErrTableDoesNotExist(dbName, tablename)

  qst.tablename = tablename
  qst.tablelist = table
  qst.target = table.slice()

  return qst
}

q.table.fn = q.getField

q.tableList = (cst, qst) => {
  const dbName = mockdbReqlQueryOrStateDbName(qst, cst)
  const tables = pgDbStateDbGet(cst, dbName)

  qst.target = Object.keys(tables)

  return qst
}

q.tableCreate = async (db, qst, args) => {
  const tableName = await spend(db, qst, args[0])
  const isValidConfigKeyRe = /^(primaryKey|durability)$/
  const isValidTableNameRe = /^[A-Za-z0-9_]*$/
  const config = queryArgsOptions(args)
  const invalidConfigKey = Object.keys(config)
    .find(k => !isValidConfigKeyRe.test(k))

  if (invalidConfigKey) {
    throw pgErrUnrecognizedOption(
      invalidConfigKey, config[invalidConfigKey])
  }

  if (!tableName) {
    throw pgErrArgsNumber('r.tableCreate', 1, 0, true)
  }

  if (!isValidTableNameRe.test(tableName)) {
    throw pgErrInvalidTableName(tableName)
  }

  const dbName = mockdbReqlQueryOrStateDbName(qst, db)
  const tables = pgDbStateDbGet(db, dbName)
  if (tableName in tables) {
    throw pgErrTableExists(dbName, tableName)
  }

  db = pgDbStateTableCreate(db, dbName, tableName, config)

  const tableConfig = pgDbStateTableConfigGet(db, dbName, tableName)

  qst.target = {
    tables_created: 1,
    config_changes: [{
      new_val: tableConfig,
      old_val: null
    }]
  }

  return qst
}

q.tableDrop = (db, qst, args) => {
  const [tableName] = args
  const dbName = mockdbReqlQueryOrStateDbName(qst, db)
  const tableConfig = pgDbStateTableConfigGet(db, dbName, tableName)

  db = pgDbStateTableDrop(db, dbName, tableName)
    
  qst.target = {
    tables_dropped: 1,
    config_changes: [{
      new_val: null,
      old_val: tableConfig
    }]
  }

  return qst
}

q.get = async (cst, qst, args) => {
  const queryLocale = pgLocaleIdResolve(cst.lang)
  const primaryKeyValue = await spend(cst, qst, args[0])
  const dbName = mockdbReqlQueryOrStateDbName(qst, cst)
  const primaryKey = pgDbStateTableGetPrimaryKey(cst, dbName, qst.tablename)
  const tableDoc = pgTableDocGet(
    qst.target, primaryKeyValue, primaryKey, queryLocale)
  // || pgLocaleIdResolve

  if (args.length === 0) {
    throw pgErrArgsNumber('get', 1, 0)
  }

  /*
  if (!tableDoc) {
    throw new Error('temp... doc not found!', {
      primaryKeyValue, queryLocale
    })
  }
  */
  if (!isNumOrStr(primaryKeyValue) && !Array.isArray(primaryKeyValue)) {
    throw pgErrPrimaryKeyWrongType(primaryKeyValue)
  }

  // define primaryKeyValue on qst to use in subsequent change() query
  // for the case of change() request for document which does not exist (yet)
  qst.primaryKeyValue = primaryKeyValue
  qst.target = tableDoc || null

  return qst
}

q.get.fn = async (db, qst, args) => {
  qst.target = await spend(db, qst, args[0], [qst.target])

  return qst
}

q.getAll = async (db, qst, args) => {
  const queryOptions = queryArgsOptions(args)
  const primaryKeyValues = await spend(
    db,
    qst,
    (queryOptions && queryOptions.index) ? args.slice(0, -1) : args
  )

  const dbName = mockdbReqlQueryOrStateDbName(qst, db)
  const tablename = qst.tablename
  const primaryKey = queryOptions.index
    || pgDbStateTableGetPrimaryKey(db, dbName, qst.tablename)
  const tableIndexTuple = pgDbStateTableGetIndexTuple(
    db, dbName, tablename, primaryKey)
  if (primaryKeyValues.length === 0) {
    qst.target = []

    return qst
  }

  const tableDocHasIndex = pgTableDocHasIndexValueFn(
    tableIndexTuple, primaryKeyValues, db)

  qst.target = await pgArrFilterAsync(qst.target, async doc => (
    tableDocHasIndex(doc, spend, qst)))

  qst.target = qst.target
    // .filter(doc => tableDocHasIndex(doc, spend, qst))
    .sort(() => 0.5 - Math.random())

  return qst
}

q.nth = async (db, qst, args) => {
  const nthIndex = await spend(db, qst, args[0])

  if (nthIndex >= qst.target.length) {
    throw pgErrIndexOutOfBounds(nthIndex)
  }

  qst.target = qst.target[nthIndex]

  return qst
}

// The replace command can be used to both insert and delete documents.
// If the “replaced” document has a primary key that doesn’t exist in the
// table, the document will be inserted; if an existing document is replaced
// with null, the document will be deleted. Since update and replace
// operations are performed atomically, this allows atomic inserts and
// deletes as well.
q.replace = async (db, qst, args) => {
  const queryTarget = qst.target
  const queryTable = qst.tablelist
  const dbName = mockdbReqlQueryOrStateDbName(qst, db)
  const primaryKey = pgDbStateTableGetPrimaryKey(db, dbName, qst.tablename)
  const config = queryArgsOptions(args.slice(1))

  const isValidConfigKeyRe =
    /^(returnChanges|durability|nonAtomic|ignoreWriteHook)$/
  const invalidConfigKey = Object.keys(config)
    .find(k => !isValidConfigKeyRe.test(k))
  if (invalidConfigKey) {
    throw pgErrUnrecognizedOption(
      invalidConfigKey, config[invalidConfigKey])
  }

  if (!args.length) {
    throw pgErrArgsNumber('replace', 1, args.length, true)
  }

  // const resSpec = asList(queryTarget).reduce((spec, targetDoc) => {
  const resSpec = await pgArrReduceAsync(asList(queryTarget), async (ac, doc) => {
    const replacement = await spend(db, qst, args[0], [doc])
    const oldDoc = pgTableDocGet(queryTable, doc, primaryKey)
    const newDoc = replacement === null ? null : replacement

    if (oldDoc === null
      && newDoc && ('primaryKeyValue' in qst)
      && newDoc[primaryKey] !== qst.primaryKeyValue) {
      return pgQueryResChangesErrorPush(
        ac, pgErrPrimaryKeyCannotBeChanged(primaryKey))
    }

    if (oldDoc && newDoc === null)
      pgTableDocRm(queryTable, oldDoc, primaryKey)
    else if (newDoc)
      pgTableDocsSet(queryTable, [newDoc], primaryKey)

    return pgQueryResChangesSpecPush(ac, {
      new_val: newDoc,
      old_val: oldDoc
    })
  }, pgQueryResChangesFieldCreate({ changes: [] }))

  qst.target = pgQueryResChangesSpecFinal(resSpec, config)

  return qst
}

q.update = async (cst, qst, args) => {
  const queryTarget = qst.target
  const queryTable = qst.tablelist
  const updateProps = await spend(cst, qst, args[0], [qst.target])
  const dbName = mockdbReqlQueryOrStateDbName(qst, cst)
  const primaryKey = pgDbStateTableGetPrimaryKey(cst, dbName, qst.tablename)
  const options = args[1] || {}
  // const resSpec = asList(queryTarget).reduce((spec, targetDoc) => {
  const resSpec = await pgArrReduceAsync(asList(queryTarget), async (ac, doc) => {
    const oldDoc = pgTableDocGet(queryTable, doc, primaryKey)
    const newDoc = updateProps === null
      ? oldDoc
      : oldDoc && Object.assign({}, oldDoc, updateProps || {})

    if (oldDoc && newDoc) {
      pgTableDocsSet(queryTable, [newDoc], primaryKey)
    }

    return pgQueryResChangesSpecPush(ac, {
      new_val: newDoc,
      old_val: oldDoc
    })
  }, pgQueryResChangesFieldCreate({ changes: [] }))

  qst.target = pgQueryResChangesSpecFinal(resSpec, options)

  return qst
}

// pass query down to 'spend' and copy data
q.insert = async (cst, qst, args) => {
  // both argument types (list or atom) resolved to a list here
  let documents = Array.isArray(args[0]) ? args[0] : args.slice(0, 1)
  let table = qst.tablelist
  const dbName = mockdbReqlQueryOrStateDbName(qst, cst)
  const primaryKey = pgDbStateTableGetPrimaryKey(cst, dbName, qst.tablename)
  const options = args[1] || {}

  const isValidConfigKeyRe = /^(returnChanges|durability|conflict)$/
  const invalidConfigKey = Object.keys(options)
    .find(k => !isValidConfigKeyRe.test(k))

  if (args.length > 1 && (!args[1] || typeof args[1] !== 'object')) {
    throw pgErrSecondArgumentOfQueryMustBeObject('insert')
  }

  if (invalidConfigKey) {
    throw pgErrUnrecognizedOption(
      invalidConfigKey, options[invalidConfigKey])
  }

  if (documents.length === 0) {
    throw pgErrArgsNumber('insert', 1, 0)
  }

  const documentIsPrimaryKeyPredefined = documents
    .some(d => primaryKey in d)

  documents = documents
    .map(doc => pgTableDocEnsurePrimaryKey(doc, primaryKey))

  const existingDocs = pgTableDocsGet(
    qst.tablelist, documents, primaryKey)

  if (existingDocs.length) {
    if (pgEnumIsChain(options.conflict)) {
      const resDoc = await spend(cst, qst, options.conflict, [
        documents[0].id,
        existingDocs[0],
        documents[0]
      ])

      const resSpec = pgQueryResChangesSpecPush(
        pgQueryResChangesFieldCreate({ changes: [] }), {
          old_val: existingDocs[0],
          new_val: resDoc,
          generated_key: documentIsPrimaryKeyPredefined
            ? null : resDoc[primaryKey]
        })

      pgTableDocsSet(table, [resDoc], primaryKey)

      qst.target = pgQueryResChangesSpecFinal(resSpec, options)

      return qst
    } else if (/^(update|replace)$/.test(options.conflict)) {
      const conflictIds = existingDocs.map(doc => doc[primaryKey])
      // eslint-disable-next-line security/detect-non-literal-regexp
      const conflictIdRe = new RegExp(`^(${conflictIds.join('|')})$`)
      const conflictDocs = documents
        .filter(doc => conflictIdRe.test(doc[primaryKey]))

      qst = options.conflict === 'update'
        ? await q.update(cst, qst, conflictDocs)
        : await q.replace(cst, qst, conflictDocs)

      return qst
    } else {
      qst.target = pgQueryResChangesErrorPush(
        pgQueryResChangesFieldCreate(),
        pgErrDuplicatePrimaryKey(
          existingDocs[0], documents
            .find(doc => doc[primaryKey] === existingDocs[0][primaryKey])))
    }
        
    return qst
  }

  [table, documents] = pgTableDocsSet(
    table,
    await pgArrMapAsync(
      documents, async doc => spend(cst, qst, doc)),
    primaryKey)

  const resSpec = documents.reduce((spec, doc) => {
    return pgQueryResChangesSpecPush(spec, {
      new_val: doc,
      old_val: null,
      generated_key: documentIsPrimaryKeyPredefined
        ? null : doc[primaryKey]
    })    
  }, pgQueryResChangesFieldCreate({ changes: [] }))

  qst.target = pgQueryResChangesSpecFinal(resSpec, options)

  return qst
}

// .indexCreate('foo')
// .indexCreate('foo', { multi: true })
// .indexCreate('foos', r.row('hobbies').add(r.row('sports')), { multi: true })
// .indexCreate([r.row('id'), r.row('numeric_id')])
q.indexCreate = async (db, qst, args) => {
  const [indexName] = args
  const config = queryArgsOptions(args)
  const dbName = mockdbReqlQueryOrStateDbName(qst, db)

  const fields = pgEnumIsChainShallow(args[1])
    ? args[1]
    : [indexName]

  pgDbStateTableIndexAdd(
    db, dbName, qst.tablename, indexName, fields, config)

  // should throw ReqlRuntimeError if index exits already
  qst.target = { created: 1 }

  return qst
}

q.indexWait = (db, qst) => {
  const dbName = mockdbReqlQueryOrStateDbName(qst, db)
  const tableIndexList = pgDbStateTableGetIndexNames(
    db, dbName, qst.tablename)

  qst.target = tableIndexList.map(indexName => ({
    index: indexName,
    ready: true,
    function: 1234,
    multi: false,
    geo: false,
    outdated: false
  }))

  return qst
}

q.indexList = (cst, qst) => {
  const dbName = mockdbReqlQueryOrStateDbName(qst, cst)
  const tableConfig = pgDbStateTableConfigGet(cst, dbName, qst.tablename)

  qst.target = tableConfig.indexes.map(i => i[0])

  return qst
}

q.orderBy = async (cst, qst, args) => {
  const queryTarget = qst.target
  const queryOptions = pgEnumIsChain(args[0])
    ? args[0]
    : queryArgsOptions(args)
  const queryOptionsIndex = await spend(cst, qst, queryOptions.index)
  const indexSortBy = (
    typeof queryOptionsIndex === 'object' && queryOptionsIndex.sortBy)
  const indexSortDirection = (
    typeof queryOptionsIndex === 'object' && queryOptionsIndex.sortDirection)
      || 'asc'
  const indexString = typeof queryOptionsIndex === 'string' && queryOptionsIndex
  const argsSortPropValue = typeof args[0] === 'string' && args[0]
  const indexName = indexSortBy || indexString || 'id'
  let fieldSortDirection = (
    typeof queryTarget === 'object' && queryTarget.sortDirection)
  const dbName = mockdbReqlQueryOrStateDbName(qst, cst)
  const tableIndexTuple = pgDbStateTableGetIndexTuple(
    cst, dbName, qst.tablename, indexName)
  const sortDirectionDefault = () => (
    fieldSortDirection || indexSortDirection)
  const sortDirection = (isAscending, dir = sortDirectionDefault()) => (
    isAscending * (dir === 'asc' ? 1 : -1))

  const getSortFieldValue = async doc => {
    let value

    // ex, queryOptions,
    //  ({ index: r.desc('date') })
    //  doc => doc('upvotes')
    if (pgEnumIsChainShallow(queryOptions)) {
      value = await spend(cst, qst, queryOptions, [doc])

      const sortObj = sortObjParse(value)
      if (sortObj) {
        if (sortObj.sortDirection) {
          fieldSortDirection = sortObj.sortDirection
        }

        value = sortObj.sortBy
        // value = doc[sortObj.sortBy]
      }
    } else if (argsSortPropValue) {
      value = doc[argsSortPropValue]
    } else {
      value = await pgTableDocGetIndexValue(
        doc, tableIndexTuple, spend, qst, cst)
    }

    return value
  }

  if (!args.length) {
    throw pgErrArgsNumber('orderBy', 1, args.length, true)
  }

  const queryTargetResolved = await Promise.all(
    queryTarget.map(async doc => [await getSortFieldValue(doc), doc]))

  qst.target = queryTargetResolved.sort((doctupa, doctupb) => (
    sortDirection(doctupa[0] < doctupb[0] ? -1 : 1)
  )).map(doctup => doctup[1])
  // qst.target = queryTarget.sort((doca, docb) => {
  //   const docaField = getSortFieldValue(doca, tableIndexTuple)
  //   const docbField = getSortFieldValue(docb, tableIndexTuple)
  //
  //   return sortDirection(docaField < docbField ? -1 : 1)
  // })

  return qst
}

q.filter = async (cst, qst, args) => {
  // qst.ntarget = await Promise
  //   .all(qst.target.map(t => spend(db, qst, args[0], [t])))
  qst.target = await pgArrFilterAsync(qst.target, async item => {
    const finitem = await spend(cst, qst, args[0], [item])

    /*
    console.log('filter', {
      finitem,
      item,
      args0: args[0],
      target: qst.target
    })*/
    if (finitem && typeof finitem === 'object') {
      return Object
        .keys(finitem)
        .every(key => finitem[key] === item[key])
    }
  
    return finitem
  })
  
  // qst.target = qst.target.filter(item => {
  //   const finitem = spend(db, qst, args[0], [item])
  //
  //   if (finitem && typeof finitem === 'object') {
  //     return Object
  //       .keys(finitem)
  //       .every(key => finitem[key] === item[key])
  //   }
  //
  //   return finitem
  // })

  return qst
}

// NOTE rethinkdb uses re2 syntax
// re using re2-specific syntax will fail
q.match = async (db, qst, args) => {
  let regexString = await spend(db, qst, args[0])

  let flags = ''
  if (regexString.startsWith('(?i)')) {
    flags = 'i'
    regexString = regexString.slice('(?i)'.length)
  }

  const regex = new RegExp(regexString, flags)

  if (typeof qst.target === 'number') {
    throw pgErrExpectedTypeFOOButFoundBAR('STRING', 'NUMBER')
  }

  qst.target = regex.test(qst.target)

  return qst
}

q.limit = (cst, qst, args) => {
  qst.target = qst.target.slice(0, args[0])

  return qst
}

q.difference = async (cst, qst, args) => {
  const differenceValues = await spend(cst, qst, args[0])

  if (typeof differenceValues === 'undefined') {
    throw pgErrArgsNumber('difference', 1, 0, false)
  }

  qst.target = qst.target
    .filter(e => !differenceValues.some(a => e == a))

  return qst
}

q.error = async (cst, qst, args) => {
  const [error] = await spend(cst, qst, args)

  throw new Error(error)
}

// Get a single field from an object. If called on a sequence, gets that field
// from every object in the sequence, skipping objects that lack it.
//
// https://rethinkdb.com/api/javascript/get_field
q.getField = async (db, qst, args) => {
  const fieldName = (await spend(db, qst, args))[0]

  if (args.length === 0) {
    throw pgErrArgsNumber('(...)', 1, args.length)
  }

  // if ( Array.isArray( qst.target ) ) {
  //  qst.error = 'Expected type DATUM but found SEQUENCE"';
  //  qst.target = null;
  //   return qst;
  // }

  qst.target = Array.isArray(qst.target)
    ? qst.target.map(t => t[fieldName])
    : qst.target[fieldName]

  return qst
}

q.pluck = async (cst, qst, args) => {
  const queryTarget = qst.target
  const pluckObj = (obj, props) => props.reduce((plucked, prop) => {
    plucked[prop] = obj[prop]
    return plucked
  }, {})

  args = await spend(cst, qst, args)

  qst.target = Array.isArray(queryTarget)
    ? queryTarget.map(t => pluckObj(t, args))
    : pluckObj(queryTarget, args)

  return qst
}

q.filter.fn = q.getField

q.hasFields = (cst, qst, args) => {
  const queryTarget = qst.target
  const itemHasFields = item => Boolean(item && args
    .every(name => Object.prototype.hasOwnProperty.call(item, name)))

  qst.target = Array.isArray(queryTarget)
    ? queryTarget.filter(itemHasFields)
    : itemHasFields(queryTarget)

  return qst
}

q.slice = async (cst, qst, args) => {
  const [begin, end] = await spend(cst, qst, args.slice(0, 2))

  if (qst.isGrouped) { // slice from each group
    qst.target = qst.target.map(targetGroup => {
      targetGroup.reduction = targetGroup.reduction.slice(begin, end)

      return targetGroup
    })
  } else {
    qst.target = qst.target.slice(begin, end)
  }

  return qst
}

q.append = async (cst, qst, args) => {
  qst.target = (await spend(cst, qst, args)).reduce((list, val) => {
    list.push(val)

    return list
  }, qst.target)

  return qst
}

q.skip = async (cst, qst, args) => {
  const count = await spend(cst, qst, args[0])

  qst.target = qst.target.slice(count)

  return qst
}

q.contains = async (cst, qst, args) => {
  const queryTarget = qst.target

  if (!args.length) {
    throw new Error('Rethink supports contains(0) but rethinkdbdash does not.')
  }

  if (!Array.isArray(qst.target)) {
    throw pgErrExpectedTypeFOOButFoundBAR('SEQUENCE', 'SINGLE_SELECTION')
  }

  if (pgEnumIsChain(args[0])) {
    // qst.target = queryTarget.some(target => {    
    qst.target = await pgArrSomeAsync(queryTarget, async target => {
      const res = await spend(cst, qst, args[0], [target])

      return typeof res === 'boolean'
        ? res
        : queryTarget.includes(res)
    })
  } else {
    qst.target = await pgArrEveryAsync(args, async predicate => (
      queryTarget.includes(await spend(cst, qst, predicate))))
    // qst.target = args.every(predicate => (
    //   queryTarget.includes(spend(cst, qst, predicate))))
  }

  return qst
}

q.delete = async (cst, qst, args) => {
  const queryTarget = qst.target
  const queryTable = qst.tablelist
  const dbName = mockdbReqlQueryOrStateDbName(qst, cst)
  const primaryKey = pgDbStateTableGetPrimaryKey(cst, dbName, qst.tablename)
  const tableIndexTuple = pgDbStateTableGetIndexTuple(
    cst, dbName, qst.tablename, primaryKey)
  const targetList = asList(queryTarget)
  const targetIds = await pgArrMapAsync(targetList, async doc => (
    pgTableDocGetIndexValue(doc, tableIndexTuple, spend, qst, cst)))
  const targetIdRe = new RegExp(`^(${targetIds.join('|')})$`)
  const options = queryArgsOptions(args)
  // const tableFiltered = queryTable.filter(doc => !targetIdRe.test(
  //   pgTableDocGetIndexValue(doc, tableIndexTuple, spend, qst, cst)))
  const tableFiltered = await pgArrFilterAsync(
    queryTable, async doc => !targetIdRe.test(
      await pgTableDocGetIndexValue(doc, tableIndexTuple, spend, qst, cst)))
  const queryConfig = queryArgsOptions(args)
  const isValidConfigKeyRe = /^(durability|returnChanges|ignoreWriteHook)$/
  const invalidConfigKey = Object.keys(queryConfig)
    .find(k => !isValidConfigKeyRe.test(k))

  if (invalidConfigKey) {
    throw pgErrUnrecognizedOption(
      invalidConfigKey, queryConfig[invalidConfigKey])
  }

  const resSpec = targetList.reduce((spec, targetDoc) => {
    if (targetDoc) {
      spec = pgQueryResChangesSpecPush(spec, {
        new_val: null,
        old_val: targetDoc        
      })
    }

    return spec
  }, pgQueryResChangesFieldCreate({ changes: [] }))

  pgTableSet(queryTable, tableFiltered)

  qst.target = pgQueryResChangesSpecFinal(resSpec, options)

  return qst
}

q.merge = async (cst, qst, args) => {
  if (args.length === 0) {
    throw pgErrArgsNumber('merge', 1, args.length, true)
  }
  
  // evaluate anonymous function given as merge definition

  // const mergeTarget = (merges, target) => merges.reduce((p, next) => (
  const mergeTarget = async (merges, target) => (
    pgArrReduceAsync(merges, async (ac, next) => (
      // console.log('-->', qst.target, await spend(cst, qst, next, [target])),
      Object.assign(ac, await spend(cst, qst, next, [target]))
    ), { ...target })
  )

  // console.log('-->', qst.target)
  qst.target = Array.isArray(qst.target)
    ? await pgArrMapAsync(qst.target, async i => mergeTarget(args, i))
    : await mergeTarget(args, qst.target)

  return qst
}

q.concatMap = async (cst, qst, args) => {
  const func = args[0]

  // qst.target = qst
  //  .target.map(t => spend(cst, qst, func, [t])).flat()

  qst.target = await pgArrMapAsync(
    qst.target, async t => spend(cst, qst, func, [t]))

  qst.target = qst.target.flat()

  return qst
}

// .group(field | function...,
//   [{index: <indexname>, multi: false}]
// ) → grouped_stream
// arg can be stringy field name, { index: 'indexname' }, { multi: true }
q.group = async (db, qst, args) => {
  const queryTarget = qst.target
  const arg = args[0]

  const groupedData = await pgArrReduceAsync(queryTarget, async (ac, item) => {
    const key = (typeof arg === 'object' && arg && 'index' in arg)
      ? arg.index
      : await spend(db, qst, arg)
    const groupKey = item[key]

    ac[groupKey] = ac[groupKey] || []
    ac[groupKey].push(item)

    return ac
  }, {})

  // queryTarget.reduce((group, item) => {
  /*
  const groupedData = queryTarget.reduce((group, item) => {
    const key = (typeof arg === 'object' && arg && 'index' in arg)
      ? arg.index
      : spend(db, qst, arg)
    const groupKey = item[key]

    group[groupKey] = group[groupKey] || []
    group[groupKey].push(item)

    return group
  }, {})
  */
  
  const rethinkFormat = Object.entries(groupedData)
    .map(([group, reduction]) => ({ group, reduction }))

  qst.isGrouped = true
  qst.target = rethinkFormat

  return qst
}

// Documents in the result set consist of pairs of left-hand and right-hand
// documents, matched when the field on the left-hand side exists and is
// non-null and an entry with that field’s value exists in the specified index
// on the right-hand side.
q.eqJoin = async (cst, qst, args) => {
  const queryTarget = qst.target
  const isNonNull = v => v !== null && v !== undefined
  const queryConfig = queryArgsOptions(args)
  const isValidConfigKeyRe = /^index$/
  const rightFields = await spend(cst, qst, args[1])

  // should remove this... get table name from args[1] record
  // and call q.config() directly
  const rightFieldConfig = args[1] && await spend(cst, qst, {
    type: pgEnumQueryArgTypeCHAIN,
    recs: [
      ...args[1].recs,
      ['config', []]
    ]
  })
  
  const rightFieldKey = queryConfig.index
    || (rightFieldConfig && rightFieldConfig.primary_key)
  const invalidConfigKey = Object.keys(queryConfig)
    .find(k => !isValidConfigKeyRe.test(k))

  if (invalidConfigKey) {
    throw pgErrUnrecognizedOption(
      invalidConfigKey, queryConfig[invalidConfigKey])
  }
    
  if (args.length === 0) {
    throw pgErrArgsNumber('eqJoin', 2, 0, true)
  }

  // qst.target = queryTarget.reduce((joins, item) => {
  qst.target = await pgArrReduceAsync(queryTarget, async (ac, item) => {
    const leftFieldSpend = await spend(cst, qst, args[0], [item])
    
    const leftFieldValue = qst.tablelist
      ? item // if value comes from table use full document
      : leftFieldSpend

    if (isNonNull(leftFieldValue)) {
      const rightFieldValue = rightFields
        .find(rf => rf[rightFieldKey] === leftFieldSpend)

      if (isNonNull(rightFieldValue)) {
        ac.push({
          left: leftFieldValue,
          right: rightFieldValue
        })
      }
    }

    return ac
  }, [])

  qst.eqJoinBranch = true
  return qst
}

q.innerJoin = async (cst, qst, args) => {
  const queryTarget = qst.target
  const otherSequence = args[0]
  const joinFunc = args[1]
  const otherTable = await spend(cst, qst, otherSequence)

  qst.target = await pgArrMapAsync(queryTarget, async item => (
    pgArrMapAsync(otherTable, async otherItem => {
      //     // problem here is we don't know if item will be evaluated first
      const oinSPend = await spend(cst, qst, joinFunc, [item, otherItem])

      /*
      console.log({
        left: item,
        otherItem
        // oinSPend
        //right: oinSPend ? otherItem : null
      })
      */
      return {
        left: item,
        right: oinSPend ? otherItem : null
      }
    })
  // ))
  )).then(e => e.flat().filter(ob => ob.right))

  // console.log('qst.target', qst.target)
  // qst.target = queryTarget.map(item => (
  //   otherTable.map(otherItem => {
  //     // problem here is we don't know if item will be evaluated first
  //     const oinSPend = spend(db, qst, joinFunc, [item, otherItem])
  //
  //     return {
  //       left: item,
  //       right: oinSPend ? otherItem : null
  //     }
  //   })
  // )).flat().filter(({ right }) => right)
  

  return qst
}

q.config = (db, qst, args) => {
  const dbName = mockdbReqlQueryOrStateDbName(qst, db)

  if (args.length) {
    throw pgErrArgsNumber('config', 0, args.length)
  }

  if (qst.tablename) {
    qst.target = pgDbStateTableConfigGet(db, dbName, qst.tablename)
    qst.target = { // remove indexes data added for internal use
      ...qst.target,
      indexes: qst.target.indexes.map(i => i[0])
    }
  } else {
    qst.target = pgDbStateDbConfigGet(db, dbName, qst.tableName)
  }

  return qst
}

q.status = (db, qst) => {
  const dbName = mockdbReqlQueryOrStateDbName(qst, db)
  const tableConfig = pgDbStateTableConfigGet(db, dbName, qst.tablename)

  qst.target = pgQueryResTableStatus(tableConfig)

  return qst
}

q.info = (db, qst) => {
  const dbName = mockdbReqlQueryOrStateDbName(qst, db)
  qst.target = pgQueryResTableInfo(db, dbName, qst.tablename)

  return qst
}

q.info.fn = async (db, qst, args) => {
  return q.getField(db, qst, args)
}

q.eqJoin.fn = q.getField

// array.sample(number) → array
q.sample = (cst, qst, args) => {
  qst.target = qst.target
    .sort(() => 0.5 - Math.random())
    .slice(0, args)

  return qst
}

q.ungroup = (cst, qst) => {
  qst.isGrouped = false

  return qst
}

q.count = (cst, qst) => {
  qst.target = qst.target.length

  return qst
}

// if conditionals return any value but false or null (i.e., “truthy” values),
q.branch = async (cst, qst, args) => {
  const isResultTruthy = result => (
    result !== false && result !== null)

  const nextCondition = async (condition, branches) => {
    const conditionResult = await spend(cst, qst, condition)

    if (branches.length === 0)
      return conditionResult

    if (isResultTruthy(conditionResult)) {
      return spend(cst, qst, branches[0])
    }

    return nextCondition(branches[1], branches.slice(2))
  }

  qst.target = await nextCondition(args[0], args.slice(1))

  return qst
}

/*
q.or = (db, qst, args) => {
  const rows = [qst.target]

  qst.target = args.reduce((current, arg) => (
    current || spend(db, qst, arg, rows)
  ), qst.target)

  return qst
}

q.and = (db, qst, args) => {
  const rows = [qst.target]

  qst.target = args.reduce((current, arg) => (
    current && spend(db, qst, arg, rows)
  ), typeof qst.target === 'boolean' ? qst.target : true)
  
  return qst
}
*/
q.not = (cst, qst) => {
  const queryTarget = qst.target

  if (typeof queryTarget !== 'boolean')
    throw pgErrCannotCallFOOonBARTYPEvalue('not()', 'non-boolean')

  qst.target = !queryTarget

  return qst
}

q.gt = async (db, qst, args) => {
  qst.target = qst.target > await spend(db, qst, args[0])

  return qst
}

q.ge = async (cst, qst, args) => {
  qst.target = qst.target >= await spend(cst, qst, args[0])

  return qst
}

q.lt = async (cst, qst, args) => {
  const argTarget = await spend(cst, qst, args[0])

  if (typeof qst.target === typeof qst.target) {
    qst.target = qst.target < argTarget
  }

  return qst
}

q.le = async (cst, qst, args) => {
  qst.target = qst.target <= await spend(cst, qst, args[0])

  return qst
}

q.eq = async (cst, qst, args) => {
  qst.target = qst.target === await spend(cst, qst, args[0])

  return qst
}

q.ne = async (cst, qst, args) => {
  qst.target = qst.target !== await spend(cst, qst, args[0])

  return qst
}

q.max = (cst, qst, args) => {
  const targetList = qst.target
  const getListMax = (list, prop) => list.reduce((maxDoc, doc) => (
    maxDoc[prop] > doc[prop] ? maxDoc : doc
  ), targetList)

  const getListMaxGroups = (groups, prop) => (
    groups.reduce((prev, target) => {
      prev.push({
        ...target,
        reduction: getListMax(target.reduction, prop)
      })

      return prev
    }, [])
  )

  qst.target = qst.isGrouped
    ? getListMaxGroups(targetList, args[0])
    : getListMax(targetList, args[0])

  return qst
}

q.max.fn = async (db, qst, args) => {
  const field = await spend(db, qst, args[0])

  if (qst.isGrouped) {
    qst.target = qst.target.map(targetGroup => {
      targetGroup.reduction = targetGroup.reduction[field]

      return targetGroup
    })
  } else {
    qst.target = qst.target[field]
  }

  return qst
}

q.min = (cst, qst, args) => {
  const targetList = qst.target
  const getListMin = (list, prop) => list.reduce((maxDoc, doc) => (
    maxDoc[prop] < doc[prop] ? maxDoc : doc
  ), targetList)

  const getListMinGroups = (groups, prop) => (
    groups.reduce((prev, target) => {
      prev.push({
        ...target,
        reduction: getListMin(target.reduction, prop)
      })

      return prev
    }, [])
  )

  qst.target = qst.isGrouped
    ? getListMinGroups(targetList, args[0])
    : getListMin(targetList, args[0])

  return qst
}

q.sub = async (cst, qst, args) => {
  const target = qst.target
  const values = await spend(cst, qst, args)

  if (typeof target === null) {
    qst.target = Array.isArray(values)
      ? values.slice(1).reduce((prev, val) => prev - val, values[0])
      : values
  } else if (isBoolNumOrStr(target)) {
    qst.target = values.reduce((prev, val) => prev - val, target)
  }

  return qst
}

q.mul = async (cst, qst, args) => {
  const target = qst.target
  const values = await spend(cst, qst, args)

  if (typeof target === null) {
    qst.target = Array.isArray(values)
      ? values.slice(1).reduce((prev, val) => prev * val, values[0])
      : values
  } else if (isBoolNumOrStr(target)) {
    qst.target = values.reduce((prev, val) => prev * val, target)
  }

  return qst
}

q.add = async (cst, qst, args) => {
  const target = qst.target
  const values = await spend(cst, qst, args)

  if (target === null) {
    qst.target = Array.isArray(values)
      ? values.slice(1).reduce((prev, val) => prev + val, values[0])
      : values
  } else if (isBoolNumOrStr(target)) {
    qst.target = values.reduce((prev, val) => prev + val, target)
  } else if (Array.isArray(target)) {
    qst.target = [...target, ...values]
  }

  return qst
}

q.uuid = (cst, qst) => {
  qst.target = randomUUID()

  return qst
}

q.info = async (cst, qst) => {
  const dbName = mockdbReqlQueryOrStateDbName(qst, cst)
  qst.target = pgQueryResTableInfo(cst, dbName, qst.tablename)

  return qst
}

q.info.fn = async (db, qst, args) => {
  return q.getField(db, qst, args)
}

export default Object.assign(spend, q)
