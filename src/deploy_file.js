// Filename: deploy_file.js  a
// Timestamp: 2017.08.10-00:39:30 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

const fs = require('fs'), // read/write files
      cpr = require('recursive-copy'),
      path = require('path'),
      nodefs = require('node-fs'),
      deploy_iso = require('./deploy_iso'),
      deploy_msg = require('./deploy_msg');

module.exports = (o => {

  o.readdir = (dir, fn) =>
    fs.readdir(dir, fn);

  o.stringify = obj =>
    (/string|boolean|number/.test(typeof obj)
     ? obj : JSON.stringify(obj, null, '  '));    

  o.read = (file, fn) =>
    fs.readFile(file, 'utf8', (err, fd) => {
      if (err) return fn(deploy_msg.pathInvalid(file));
      
      fn(err, fd);
    });

  o.write = (file, content, fn) =>
    fs.writeFile(file, o.stringify(content), (err, res) => {
      if (err) return fn(new Error(res));
      
      fn(null, res);
    });

  // only creates the path if it does not exist
  // https://github.com/bpedro/node-fs/blob/master/lib/fs.js
  o.createPath = (directory, fn) =>
    fs.stat(directory, (err, stat) => { 
      if (stat && stat.isDirectory()) {
        fn(null, directory);
      } else {
        
        nodefs.mkdir(directory, 0755, true, (err, res) => {
          if (err) return fn(err);
          fn(err, res);
        });
      }
    });

  o.writeRecursive = (filename, content, fn) =>
    o.createPath(path.dirname(filename), (err, res) => {
      if (err) return fn(err);
      
      o.write(filename, content, fn);
    });
 
  return o;

})({});
