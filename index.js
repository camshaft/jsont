/**
 * Module dependencies
 */

var each = require('each-component');
var type = require('type-component');
var fmtparser = require('format-parser');
var get = require('selectn');
var Batch = require('batch');

module.exports = JSONt;

var defaults = {};

defaults.map = function(input, done) {
  var inputType = type(input);
  var out;

  if (inputType === 'object') out = {}
  else if (inputType === 'array') out = [];
  else return done(new Error('Incompatible type for `map`: '+inputType));

  var batch = new Batch;
  var pipe = this.pipe;
  var exit = this.exit;

  each(input, function(value, key) {
    batch.push(function(next) {
      renderProperty(pipe.slice(0), value, function(err, value) {
        if (err) return next(err);
        set(''+key, value, out);
        next();
      });
    });
  });

  batch.end(function(err) {
    if (err) return exit(err);
    exit(null, out);
  });
};

function JSONt() {
  if (!(this instanceof JSONt)) return new JSONt();
  this.pipes = {};
  this.pipes.__proto__ = defaults;
}

JSONt.prototype.pipe = function(name, fun) {
  this.pipes[name] = fun;
  return this;
};

JSONt.prototype.compile = function(template, options) {
  var context = new Context(template, options, this);
  return function(data, fn) {
    return context.render(data, fn);
  };
};

function Context(template, options, instance) {
  this.template = typeof template === 'string'
    ? JSON.parse(template)
    : template;
  this.options = options || {};
  this.instance = instance;
  this.locations = [];
  scan(this.template, this.locations, 'template', this.getPipe.bind(this));
};

Context.prototype.getTemplate = function() {
  // TODO we may need to speed this up
  return JSON.parse(JSON.stringify(this.template));
};

Context.prototype.getPipe = function(name, args) {
  var self = this;
  return function(input, next, exit, pipe, data) {
    var newargs = args
      .slice(0);

    newargs.unshift(input);
    newargs.push(next);
    var selected = self.instance.pipes[name];
    if (!selected) return next(new Error('Invalid pipe "'+name+'"'));

    return selected.apply({
      exit: exit,
      pipe: pipe,
      data: data,
      options: self.options
    }, newargs);
  };
};

Context.prototype.render = function(data, fn) {
  var out = {
    template: this.getTemplate()
  };
  var errors = [];

  var batch = new Batch;

  this.locations.forEach(function(loc) {
    batch.push(function(done) {
      var pipe = loc.pipe.slice(0);
      renderProperty(pipe, data, function(err, value) {
        if (err) return done(err);
        set(loc.path, value, out);
        done();
      });
    });
  });

  batch.end(function(err) {
    fn(err, out.template);
  });
};

function scan(template, acc, path, pipes) {
  each(template, function(key, value) {
    var newpath = path+'.'+key;
    if (type(value) === 'string') return parse(value, acc, newpath, pipes);
    if (type(value) === 'object') return scan(value, acc, newpath, pipes);
    if (type(value) === 'array') return scan(value, acc, newpath, pipes);
  });
};

function parse(value, acc, path, pipes) {
  // This isn't a templated property
  var out = /^`(.+)`$/.exec(value);
  if (!out) return;

  var val = out[1];
  var pipe = fmtparser(val);

  var pipefns = pipe.map(function(input, i) {
    if (i !== 0) return pipes(input.name, input.args);

    // TODO we should be able to parse valid js - similar to angular
    var name = /^'(.+)'$/.exec(input.name);

    var val = input.name;
    if (!name) {
      var _get = get(val);
      return function(data, next) {
        next(null, _get(data));
      };
    }

    var val = name[1];
    return function(data, next) {
      next(null, val);
    };
  });

  acc.push({
    pipe: pipefns,
    path: path
  });
};

function renderProperty(pipe, data, done) {
  var fn = pipe.shift();

  if (!fn) return done(null, data);

  fn(data, function(err, val) {
    if (err) return done(err);
    setTimeout(function() {
      renderProperty(pipe, val, done);
    }, 0);
  }, done, pipe);
};

function set(path, value, obj) {
  var keys = path.split('.')
    , keyLength = keys.length-1
    , tmp = obj;

  var key;
  for (var i = 0; i <= keyLength; i++) {
    key = keys[i];
    if (i !== keyLength) tmp = tmp[key];
    else tmp[key] = value;
  }
  return obj;
}
