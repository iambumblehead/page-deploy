import pgopts from './pgopts.js'
import pgscriptopts from './pgscriptopts.js'
import pglanglocale from './pglanglocale.js'
import pgmanifest from './pgmanifest.js'
// import pgdraw from './pgdraw.js'
import pgdraw from './pgReql.js'

import {
  pgGraphCreate,
  pgGraphSet,
  pgGraphSetChild,
  pgGraphSetChildEdge,
  pgGraphSetRouteEdge
} from './pgGraph.js'

import {
  pgurl_manifestcreate
} from './pgurl.js'

import {
  key_urlcreate,
  key_refchildcreate,
  key_childlanglocalecreate
} from './pgkey.js'

import {
  pgscript_helpercreate
} from './pgscript.js'

import {
  pgfs_writeobj,
  pgfs_dirrmdir
} from './pgfs.js'

import pglog from './pglog.js'

import {
  pgEnumNODETYPEPATH,
  // pgEnumNODETYPEPATH,
  pgEnumIsChain,
  pgEnumIsChainShallow,
  pgEnumQueryNameIsGREEDYRe,
  pgEnumIsChainDeep
} from './pgEnum.js'

// if grouped nodechildlangs defined
//   return those
// else if single nodechilds
//   compose default nodechildlangs from tho
const nodechildlangsget = (opts, nodespec) => (
  nodespec.nodechildlangs || (
    nodespec.nodechilds
      ? [[ opts.i18n[0][0], nodespec.nodechilds ]]
      : []))

const nodechildaslangsgroup = (opts, nodespec) => (
  Array.isArray(nodespec)
    ? nodespec
    : [[ opts.i18n[0][0], nodespec ]])

const routesdfsgraphset = async (opts, graph, nodespec, parentid, routes) => {
  if (!routes.length)
    return graph

  const route = routes[0]
  const routename = route[0]

  // routedetails ex, { title, description }
  const routedetails = route[1][0]
  const routenamedecoded = routepathparsename(routename)
  const routenoderesolve = route[2]

  // default name 'index' so childs will be contained
  // within *something* comparable to non-index routes
  const routenodename = `pg-${routenamedecoded || 'index'}`
  const routenode = routenoderesolve({}, {}, {
    nodename: routenodename,
    routemeta: routedetails
  })

  graph = await specdfsgraphsetroot(opts, graph, routenode, parentid)

  return routesdfsgraphset(opts, graph, nodespec, parentid, routes.slice(1))
}


// {
//   requrl: d.typefn('getrequrl'),
//   other: 'val'
// }
//
// [{
//   requrl: d.typefn('getrequrl'),
//   other: 'val'
// }]
//
// [{
//   requrl: d.typefn('getrequrl')
// }, {
//   other: 'val'
// }]
const resolvespec = async (opts, lang, graph, child, key, spec, prop, props = []) => {
/*
  if (prop === 'parts') {
    console.log('SPEC', JSON.stringify(spec))
    // console.log('VAL', val)
    throw new Error('===')
  }
*/  
  if (pgEnumIsChainDeep(spec)) {
    if (Array.isArray(spec)) {
      for (const specprop in spec) {
        props[specprop] = await resolvespec(
          opts, lang, graph, child, key, spec[specprop], specprop)

      }

      // props[key] = props[key].flat()
      return props.flat()
      // spec = spec.map((el, i) => resolvespec(el, i))
    } else {
      props[0] = null
      // console.log('shallow one...', spec)
      for (const specprop of Object.keys(spec)) {
        console.log({ specprop, spec: String(spec), val: String(spec[specprop]) })
        // only push if spec[prop] is function AND
        // if root query is 'greedy' AND
        // if only one arg was given -- this last one is sloppy and should
        // maybe detect r('expr')
        // pgEnumQueryNameIsGREEDYRe
        // console.log(
        //   'tgerm',
        //   typeof spec[specprop] === 'function' &&
        //    spec[specprop].recs.slice(-1)[0][0])
        if (typeof spec[specprop] === 'function'
            && pgEnumQueryNameIsGREEDYRe.test(
              spec[specprop].recs.slice(-1)[0][0])) {

          // console.log(spec[specprop])
          // console.log(spec[specprop])
          // console.log('heas')
          // throw new Error('===')

          const resolved = await resolvespec(
            opts, lang, graph, child, key, spec[specprop], specprop)          
          // let val = await resolvespec(spec[key], key)
          console.log('pushed resolved', resolved)
          props.push(resolved)
        } else {
          props[0] = props[0] || {}
          props[0][specprop] = await resolvespec(
            opts, lang, graph, child, key, spec[specprop], specprop)
        }
      }

      console.log('returning looped prps', props)
      return props[0] === null
        ? props.slice(1)
        : props
    }
  }

  // pgEnumQueryArgTypeCHAINIsRe.test(obj.type)
  if (pgEnumIsChain(spec) || typeof spec === 'function') {
    // spec.recs[0][1].push(prop)
    // console.log('recs here', spec.recs[0][1])
    // convert node helper to actual node from graaph
    // console.log('spec', spec)

    // console.log(child)
    // throw new Error('must start with node')
    spec.state = {
      lang,
      graph,
      node: child,
      outerprop: prop,
      key
    }
    /*
    spec.recs[0][1] = [prop, ...spec.recs[0][1].map(e => {
      if (e.graphkeys)
        e = graph[e.graphkeys[0]]
      
      return e
    })]
    */
    // console.log('can spec be augmented w. expr?', spec.recs[0])
    // console.log('RUN', spec.run.toString())
    // throw new Error('==')
    
    const val = await spec.run()
    
    console.log('resultig val', val)
    //throw new Error('erro')
    if (prop === 'labelprimary') {
      // console.log('SPEC', spec)
      // console.log('VAL', val)
      // throw new Error('===')
    }
    return val
  }

  return spec
}

const resolvespecs = async (opts, lang, graph, key, child) => {
  const resolvedspec = {}
  const childspec = child.nodespec

  for (const specprop in childspec) {
    const childspecpropval = childspec[specprop]
    
    resolvedspec[specprop] = (
      pgEnumIsChainDeep(childspecpropval)
        || typeof childspecpropval === 'function')
      ? await resolvespec(opts, lang, graph, child, key, childspecpropval, specprop)
      : childspecpropval
  }

  return resolvedspec
}

const isRoute = child => {
  return Array.isArray(child)
    && Array.isArray(child[0])
    && typeof child[0][0] === 'string'
}

// sets graph nodes recursively deeply from nodespec
// each parent node contains language-locale-specific child lists
const childsdfsgraphset = async (opts, graph, nodespec, parentid) => {
  const nodechildlanglocalegroups = nodechildlangsget(opts, nodespec)
  // const noderoutes = (nodespec.nodemeta || {}).routes
  // const nodechildrefs = []

  for (const nodechildlanglocalegroup of nodechildlanglocalegroups) {
    const childlanglocale = nodechildlanglocalegroup[0]
    const childresolvers = nodechildlanglocalegroup[1]

    for (const i in childresolvers) {
      const childresolver = childresolvers[i]
      const child = (
        typeof childresolver === 'function'
          ? childresolver()
          : childresolver)

      if (isRoute(child)) {
      // if (child === pgEnumNODETYPEPATH) {
        graph = pgGraphSetChildEdge(
          graph, parentid, childlanglocale, pgEnumNODETYPEPATH)
      } else {
        // entirely different list of childs is possible
        // for each langlocale... so each is generated
        const nodename = child.nodespec.name // '/'
        const nodelanglocalename = nodename + '/:' + childlanglocale
        const nodelanglocalekey = key_childlanglocalecreate(
          parentid, nodelanglocalename)

        if (typeof childresolver === 'function') {
          childresolver.graphkeys = childresolver.graphkeys || []
          childresolver.graphkeys.push(nodelanglocalekey)
        }
        // child.nodespec = resolvespec(child.nodespec)
        // need to set node first
        child.nodespec = await resolvespecs(
          opts,
          childlanglocale,
          graph,
          nodelanglocalekey,
          child)
          // child.nodespec)

        console.log('nodespec final', child.nodespec.subj)
        // for (const key of (child.nodespec))
        //   child.nodespec[key] = await resolvespec(child.nodespec[key], key)

        //   return prev
        // }, {})
        /*
        if (pgEnumIsChainShallow(child.nodespec)) {
    
          child.ndoespec = Object.keys(child.nodespec).reduce((prev, key) => {
            pgEnumIsChainShallow
          // qst.target = val
          // r.expr()
            console.log('CHILD', child)
          })
        }
        */
        graph = pgGraphSetChild(
          graph, parentid, childlanglocale, nodelanglocalekey, child)

        if (child.nodechilds && child.nodechilds.length) {
          graph = await childsdfsgraphset( // nodespec, fullkeytoparent
            opts, graph, child, nodelanglocalekey)
        }
      }
    }
  }

  return graph
}


const specdfsgraphsetroot = async (opts, graph, nodespec, parentkey) => {
  const isroot = Object.keys(graph).length === 0
  const langlocalegroups = nodechildaslangsgroup(opts, nodespec)
  const nodename = nodespec.nodespec.name // '/'
  // const noderoutes = nodespec.nodemeta.routes || []
  // isRoute(child)
  const noderoutes = nodespec.nodechilds.find(c => isRoute(c)) || []
  // onst noderoutes = nodespec.nodemeta.routes || []

  // maybe some routes only available some langs
  for (const langlocalegroup of langlocalegroups) {
    const nodelanglocale = langlocalegroup[0]
    const noderesolver = langlocalegroup[1]
    const nodelanglocalename =
          (nodename === '/' ? '' : nodename) + '/:' + nodelanglocale
    const nodelanglocalekey = key_childlanglocalecreate(
      parentkey, nodelanglocalename)

    graph = pgGraphSet(graph, nodelanglocalekey, nodespec)
    graph = isroot ? graph : pgGraphSetRouteEdge(
      graph, parentkey, nodelanglocale, nodelanglocalekey)
    graph = await childsdfsgraphset( // nodespec, fullkeytoparent
      opts, graph, noderesolver, nodelanglocalekey)
    graph = await routesdfsgraphset(
      opts, graph, noderesolver, nodelanglocalekey, noderoutes)
  }

  return graph
}

const graphdfswrite = async (opts, lang, graph, key, keyparent) => {
  const node = graph[key]
  const nodechilds = node['child:' + lang] || []
  const noderoutes = node['route:' + lang] || []
  const nodechildpaths = []

  for (const i in nodechilds) {
    const childpath = nodechilds[i] === pgEnumNODETYPEPATH
      ? ({ ispathnode: true })
      : key_refchildcreate(opts, keyparent || key, nodechilds[i])
    
    nodechildpaths.push(childpath)

    if (nodechilds[i] !== pgEnumNODETYPEPATH) {
      await graphdfswrite(opts, lang, graph, nodechilds[i], key)
    }
  }

  for (const i in noderoutes) {
    const noderoute = noderoutes[i]

    await graphdfswrite(opts, lang, graph, noderoute, key)
  }

  const outputurl = key_urlcreate(opts, key)
  const nodespec = Object.assign({}, node.nodespec, {
    ...(nodechilds.length && {
      child: nodechildpaths
    })
  })

  const nodemeta = node.nodemeta
  const routemeta = nodemeta && nodemeta.routemeta
  if (routemeta) {
    nodespec.subj = Object.assign(
      nodespec.subj || {},
      Object.keys(routemeta).reduce((acc, k) => (
        acc[`gnmeta${k}`] = routemeta[k],
        acc), {}))
  }

  await pgfs_writeobj(opts, outputurl, nodespec)
}

// /blog/ => blog
// / => pg
const routepathparsename = routepath => (
  routepath.replace(/\//g, ''))

const pgdep = async opts => {
  opts = pgopts(opts)

  const scriptopts = pgscriptopts(opts)

  await pgfs_dirrmdir(opts.outputDir)

  const rootresolver = await opts.root(scriptopts)
  const root = rootresolver()

  const graph = await specdfsgraphsetroot(
    opts, pgGraphCreate(), root, '/:eng-US')

  const langs = opts.i18n.reduce((accum, i18n) => {
    accum.push(i18n[0])
    return accum
  }, [])

  // unknown necessary lang+locale combinations, until children are processed
  // fallback to 'default' eg, en-US
  // eng-US, jap-US, eng-JP, jap-JP
  for (const lang of langs) {
    await graphdfswrite(opts, lang, graph, '/:' + lang)
  }

  const manifest = pgmanifest(opts, graph)
  const manifesturl = pgurl_manifestcreate(opts)

  await pgfs_writeobj(opts, manifesturl, manifest)
  pglog(opts, JSON.stringify(manifest, null, '  '))
}

export {
  pgdep as default,
  pgdraw,
  pgscript_helpercreate,
  pglanglocale
}
