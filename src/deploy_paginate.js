// Filename: deploy_paginate.js  
// Timestamp: 2017.09.05-03:34:49 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>  

import path from 'path';
import pathpublic from 'pathpublic';

import deploy_file from './deploy_file.js';
import deploy_pattern from './deploy_pattern.js';

export default (o => {

  // filename (parent file where obj is found)
  //   src/spec/page/blog/spec-baseLang.json
  //
  // blogs/pg1/spec-baseLocale.json
  // blogs/pg2/spec-baseLocale.json
  // blogs/pg3/spec-baseLocale.json
  // blogs/pg4/spec-baseLocale.json
  // spec-baseLocale.json
  //
  // what does it look like now? flat list of blogs, no metadata or page def
  // page blogs list gets data and renders
  //
  // {
  //    "itemstotal" : 31,
  //    "itemsperpage" : 10,
  //    "pages" : [{
  //       "type" : "url-ref",
  //       "path" : "./spec/page/blog/pg1/baseLocale.json",
  //       "items" : 10
  //    },{
  //       "type" : "url-ref",
  //       "path" : "./spec/page/blog/pg2/baseLocale.json",
  //       "items" : 10
  //    }]
  // }
  //
  o = (opts, filename, fileobj, childobjarr, fn) =>
    o.writepages(opts, filename, fileobj, childobjarr, fn);

  o.getchunkoutfilename = (opts, pfilename, pfileobj, chunknum) => {
    const poutfilename = deploy_pattern
            .getasoutputpath(opts, pfilename, pfileobj),
          dirname = path.dirname(poutfilename),
          basename = path.basename(poutfilename);

    //return path.join(dirname, 'pg' + chunknum, basename);
    
    //return path.join(dirname, 'pg', String(chunknum), basename);
    return path.join(dirname, String(chunknum), basename);
  };

  // 
  // temporary --wtites the same baseLangLocale chunks to supported ISOs
  // long-term solution would develop ISO-specific chunks
  //
  o.writeISOchunks = (opts, filename, outputpath, filobj, chunkobjarr, fn) => {
    const ISOnamearr = deploy_pattern.getisooutputfilenamearr(opts, filename),
          extname = path.extname(outputpath),
          dirname = path.dirname(outputpath);

    (function next (x, ISOname, ISOpath) {
      if (!x--) return fn(null, ISOnamearr);

      ISOname = ISOnamearr[x];
      ISOpath = path.join(dirname, ISOname + '.json');

      deploy_file.writeRecursive(ISOpath, chunkobjarr, (err, res) => {
        if (err) return fn(err);

        next(x);
      });
      
    }(ISOnamearr.length));
  };

  // return this meta data...
  //
  // {
  //   "type" : "url-ref",
  //   "path" : "./spec/page/blog/pg1/baseLocale.json",
  //   "items" : 10
  // }
  //
  // save the list of chunks at the referenced file
  //
  // filename: src/spec/page/blog/spec-baseLang.json
  //
  // chunkname: ??/spec/page/blog/pg0/baseLang.json
  //
  // ./src/deploy_fileconvert.js
  // ./src/deploy_pattern.js
  o.writechunk = (opts, filename, fileobj, chunkobjarr, chunknum, fn) => {
    const outputpath = o.getchunkoutfilename(opts, filename, fileobj, chunknum),
          urlrefpath = pathpublic.get(outputpath, opts.publicPath);

    // eslint-disable-next-line max-len
    o.writeISOchunks(opts, filename, outputpath, fileobj, chunkobjarr, (err, res) => {
      deploy_file.writeRecursive(outputpath, chunkobjarr, (err, res) => {
        fn(err, {
          type : 'url-ref',
          path : urlrefpath,
          pagenum : chunknum,
          items : chunkobjarr.length
        });
      });
    });
  };

  // eslint-disable-next-line max-len
  o.writechunks = (opts, filename, fileobj, childobjarr, fn, chunknum = 0, chunkmetaarr = []) => {
    const chunksize = fileobj.itemsperpage,
          nextchunks = childobjarr.slice(chunksize),
          chunk = childobjarr.length > chunksize
            ? childobjarr.slice(0, chunksize)
            : childobjarr.slice();

    o.writechunk(opts, filename, fileobj, chunk, chunknum, (err, chunkmeta) => {
      if (err) return fn(err);

      chunkmetaarr.push(chunkmeta);
      
      nextchunks.length // eslint-disable-next-line max-len
        ? o.writechunks(opts, filename, fileobj, nextchunks, fn, ++chunknum, chunkmetaarr)
        : fn(null, chunkmetaarr);
    });
  };


  o.writechunkall = (opts, filename, fileobj, chunkobjarr, chunknum, fn) => {
    const outputpath = o.getchunkoutfilename(opts, filename, fileobj, chunknum),
          urlrefpath = pathpublic.get(outputpath, opts.publicPath);

    // eslint-disable-next-line max-len
    o.writeISOchunks(opts, filename, outputpath, fileobj, chunkobjarr, (err, res) => {
      deploy_file.writeRecursive(outputpath, chunkobjarr, (err, res) => {
        fn(err, {
          type : 'url-ref',
          path : urlrefpath,
          pagenum : chunknum,
          items : chunkobjarr.length
        });
      });
    });
  };
  
  //    "itemstotal" : 31,
  //    "itemsperpage" : 10,
  //    "pages" : [ ... ] // childmeta
  //
  o.writepages = (opts, filename, fileobj, childobjarr, fn) => {
    // sort newest to oldest
    childobjarr = childobjarr.sort((obja, objb) => (
      obja.timeDate < objb.timeDate ? 1 : -1
    ));
    
    o.writechunks(opts, filename, fileobj, childobjarr, (err, chunkmetaarr) => {
      if (err) return fn(err);

      // write all chunk...
      // eslint-disable-next-line max-len
      o.writechunk(opts, filename, fileobj, childobjarr, 'all', (err, chunkmeta) => {
        //chunkmetaarr.push(chunkmeta);

        fn(null, {
          itemstotal : childobjarr.length,
          pagestotal : chunkmetaarr.length,
          pages : chunkmetaarr,
          pageall : chunkmeta
        });
      });
    });
  };
  
  return o;
  
})({});
