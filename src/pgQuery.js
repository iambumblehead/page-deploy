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
  pgErrTableDoesNotExist,
  pgErrCannotUseNestedRow,
  pgErrNoAttributeInObject,
  pgErrPrimaryKeyWrongType,
  pgErrNotATIMEpsuedotype
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
  // pgEnumQueryArgTypeCHAIN,
  pgEnumQueryNameIsCURSORORDEFAULTRe,
  pgEnumIsQueryArgsResult,
  pgEnumIsChainShallow,
  pgEnumIsChain
} from './pgEnum.js'

import {
  // mmDbStateAggregate,
  // mmDbStateDbCreate,
  // mmDbStateDbDrop,
  // pgDbStateDbGet,
  // pgDbStateTableSet,
  pgDbStateTableGet,
  pgDbStateTableGetResolved,
  // mmDbStateTableIndexAdd,
  // mmDbStateTableGetIndexNames,
  pgDbStateTableGetIndexTuple,
  pgDbStateTableGetPrimaryKey,
  // mmDbStateTableCursorSet,
  // mmDbStateTableDocCursorSet,
  // mmDbStateTableCursorSplice,
  // mmDbStateTableDocCursorSplice,
  // mmDbStateTableCursorsPushChanges,
  // mmDbStateTableCursorsGetOrCreate,
  // mmDbStateTableDocCursorsGetOrCreate,
  // mmDbStateTableConfigGet,
  // mmDbStateTableCreate,
  // mmDbStateTableDrop,
  // mmDbStateDbConfigGet
} from './pgDbState.js'

import {
  pgTableDocGet,
  pgTableDocGetIndexValue
} from './pgTable.js'

import {
  pgGraphResolverLocaleKeyGet
} from './pgGraph.js'

import {
  pgMdParse
} from './pgMd.js'


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
  for (let i in reqlObj.recs) {
    let rec = reqlObj.recs[i]
    // const val = reqlObj.recs.reduce((qstNext, rec, i) => {
    // avoid mutating original args w/ suspended values
    const queryArgs = rec[1].slice()

    if (qstNext.error && !pgEnumQueryNameIsCURSORORDEFAULTRe.test(rec[0]))
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

      // if (reqlObj.recs.slice(-1)[0][0] === 'getCursor')
      //   return qstNext

      e[pgEnumTypeERROR] = typeof e[pgEnumTypeERROR] === 'boolean'
        ? e[pgEnumTypeERROR]
        : true

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

  return qst
}

q.row.fn = async (st, qst, args) => {
  if (typeof args[0] === 'string' && !(args[0] in qst.target)) {
    throw pgErrNoAttributeInObject(args[0])
  }

  return q.getField(st, qst, args)
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

q.coerceTo = (st, qst, args) => {
  const coerceType = String(args[0]).toLowerCase()
  let resolved = spend(st, qst, qst.target)

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

q.map = async (st, qst, args) => {
  // qst.target = qst
  //   .target.map(t => spend(st, qst, args[0], [t]))

  const listold = qst.target
  const listnew = []

  for (const i in listold)
    listnew[i] = await spend(st, qst, args[0], [listold[i]])

  qst.target = listnew
  return qst
}

q.without = (st, qst, args) => {
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

  args = spend(st, qst, args)

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
q.args = (st, qst, args) => {
  const result = spend(st, qst, args[0])
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

q.serialize = (st, qst) => {
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

q.forEach =  (st, qst, args) => {
  const [forEachRow] = args

  if (args.length !== 1) {
    throw pgErrArgsNumber('forEach', 1, args.length)
  }

  qst.target = qst.target.reduce((st, arg) => {
    const result = spend(st, qst, forEachRow, [arg])

    return "mmDbStateAggregate(st, result)"
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

  if (!tableDoc) {
    throw new Error('temp... doc not found!', {
      primaryKeyValue, queryLocale
    })
  }

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

        //value = sortObj.sortBy
        value = doc[sortObj.sortBy]
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

q.filter = async (db, qst, args) => {
  // qst.ntarget = await Promise
  //   .all(qst.target.map(t => spend(db, qst, args[0], [t])))
  qst.target = await Promise
    .all(qst.target.map(t => spend(db, qst, args[0], [t])))
    .then(results => qst.target.filter((_, i) => results[i]))

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

q.error = async (cst, qst, args) => {
  const [error] = await spend(cst, qst, args)

  throw new Error(error)
}

// Get a single field from an object. If called on a sequence, gets that field
// from every object in the sequence, skipping objects that lack it.
//
// https://rethinkdb.com/api/javascript/get_field
q.getField = async (db, qst, args) => {
  const [fieldName] = await spend(db, qst, args)

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

q.filter.fn = q.getField

q.count = (cst, qst) => {
  qst.target = qst.target.length

  return qst
}

q.ge = async (cst, qst, args) => {
  qst.target = qst.target >= await spend(cst, qst, args[0])

  return qst
}

q.lt = async (cst, qst, args) => {
  const argTarget = await spend(cst, qst, args[0])

  if (argTarget instanceof Date && !(qst.target instanceof Date)) {
    throw pgErrNotATIMEpsuedotype('forEach', 1, args.length)
  }

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

export default Object.assign(spend, q)