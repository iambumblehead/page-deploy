// Filename: deploy_file.js  a
// Timestamp: 2017.09.03-13:23:35 (last modified)
// Author(s): bumblehead <chris@bumblehead.com>

const fs = require('fs'), // read/write files
      path = require('path'),
      deploy_msg = require('./deploy_msg');

module.exports = (o => {
  o.exists = filepath =>
    fs.existsSync(filepath);

  o.isdir = filepath =>
    o.exists(filepath) && fs.statSync(filepath).isDirectory();

  o.isfile = filepath =>
    o.exists(filepath) && fs.statSync(filepath).isFile();

  o.readdir = (dir, fn) =>
    fs.readdir(dir, fn);

  o.readdirfullpath = (dir, fn) =>
    fs.readdir(dir, (err, namearr) => (
      fn(err, err ? null : namearr.map(name => path.join(dir, name)))));

  o.stringify = obj =>
    (/string|boolean|number/.test(typeof obj)
     ? obj : JSON.stringify(obj, null, '  '));    

  o.read = (filepath, fn) =>
    fs.readFile(filepath, 'utf8', (err, fd) => (
      fn(err, err ? deploy_msg.pathInvalid(filepath) : fd)));

  o.readobj = (filepath, fn) => {
    o.read(filepath, (err, file) => {
      if (err) return fn(err);

      try {
        file = JSON.parse(file);
      } catch (e) {
        err = e;
      }
      
      fn(err, file);
    });
  };

  o.write = (filename, content, fn) =>
    fs.writeFile(filename, o.stringify(content), (err, res) => (
      fn(err && new Error(err), res)));

  o.writeassign = (filename, content, fn) =>
    o.readobj(filename, (err, obj) => {
      if (err) return fn(err);

      obj = Object.assign(obj, content);

      o.write(filename, obj, (err, res) => {
        if (err) return fn(err);

        fn(null, obj);
      });
    });

  // only creates the path if it does not exist
  o.createPath = (directory, fn) => o.isdir(directory)
    ? fn(null, directory)
    : fs.mkdir(directory, {recursive: true}, fn);

  o.writeRecursive = (filename, content, fn) =>
    o.createPath(path.dirname(filename), (err, res) => {
      if (err) return fn(err);
      
      o.write(filename, content, fn);
    });
 
  return o;

})({});
