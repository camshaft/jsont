
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module.exports) {
    module.exports = {};
    module.client = module.component = true;
    module.call(this, module.exports, require.relative(resolved), module);
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-format-parser/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Parse the given format `str`.\n\
 *\n\
 * @param {String} str\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(str){\n\
  return str.split(/ *\\| */).map(function(call){\n\
    var parts = call.split(':');\n\
    var name = parts.shift();\n\
    var args = parseArgs(parts.join(':'));\n\
\n\
    return {\n\
      name: name,\n\
      args: args\n\
    };\n\
  });\n\
};\n\
\n\
/**\n\
 * Parse args `str`.\n\
 *\n\
 * @param {String} str\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
function parseArgs(str) {\n\
  var args = [];\n\
  var re = /\"([^\"]*)\"|'([^']*)'|([^ \\t,]+)/g;\n\
  var m;\n\
  \n\
  while (m = re.exec(str)) {\n\
    args.push(m[2] || m[1] || m[0]);\n\
  }\n\
  \n\
  return args;\n\
}\n\
//@ sourceURL=component-format-parser/index.js"
));
require.register("component-type/index.js", Function("exports, require, module",
"\n\
/**\n\
 * toString ref.\n\
 */\n\
\n\
var toString = Object.prototype.toString;\n\
\n\
/**\n\
 * Return the type of `val`.\n\
 *\n\
 * @param {Mixed} val\n\
 * @return {String}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(val){\n\
  switch (toString.call(val)) {\n\
    case '[object Function]': return 'function';\n\
    case '[object Date]': return 'date';\n\
    case '[object RegExp]': return 'regexp';\n\
    case '[object Arguments]': return 'arguments';\n\
    case '[object Array]': return 'array';\n\
    case '[object String]': return 'string';\n\
  }\n\
\n\
  if (val === null) return 'null';\n\
  if (val === undefined) return 'undefined';\n\
  if (val && val.nodeType === 1) return 'element';\n\
  if (val === Object(val)) return 'object';\n\
\n\
  return typeof val;\n\
};\n\
//@ sourceURL=component-type/index.js"
));
require.register("wilmoore-selectn/index.js", Function("exports, require, module",
"\n\
// expose `selectn`\n\
\n\
module.exports = selectn;\n\
\n\
/**\n\
 * Select n-levels deep into an object given a dot/bracket-notation query.\n\
 * If partially applied, returns a function accepting the second argument.\n\
 *\n\
 * ### Examples:\n\
 *\n\
 *      selectn('name.first', contact);\n\
 *\n\
 *      selectn('addresses[0].street', contact);\n\
 *\n\
 *      contacts.map(selectn('name.first'));\n\
 *\n\
 * @param  {String} query\n\
 * dot/bracket-notation query string\n\
 *\n\
 * @param  {Object} object\n\
 * object to access\n\
 *\n\
 * @return {Function}\n\
 * accessor function that accepts an object to be queried\n\
 */\n\
\n\
function selectn(query) {\n\
  var parts;\n\
\n\
  // normalize query to `.property` access (i.e. `a.b[0]` becomes `a.b.0`)\n\
  query = query.replace(/\\[(\\d+)\\]/g, '.$1');\n\
  parts = query.split('.');\n\
\n\
  /**\n\
   * Accessor function that accepts an object to be queried\n\
   *\n\
   * @private\n\
   *\n\
   * @param  {Object} object\n\
   * object to access\n\
   *\n\
   * @return {Mixed}\n\
   * value at given reference or undefined if it does not exist\n\
   */\n\
\n\
  function accessor(object) {\n\
    var ref = object || (1, eval)('this');\n\
    var len = parts.length;\n\
    var idx = 0;\n\
\n\
    // iteratively save each segment's reference\n\
    for (; idx < len; idx += 1) {\n\
      if (ref) ref = ref[parts[idx]];\n\
    }\n\
\n\
    return ref;\n\
  }\n\
\n\
  // curry accessor function allowing partial application\n\
  return arguments.length > 1\n\
       ? accessor(arguments[1]) \n\
       : accessor;\n\
}\n\
\n\
//@ sourceURL=wilmoore-selectn/index.js"
));
require.register("component-indexof/index.js", Function("exports, require, module",
"module.exports = function(arr, obj){\n\
  if (arr.indexOf) return arr.indexOf(obj);\n\
  for (var i = 0; i < arr.length; ++i) {\n\
    if (arr[i] === obj) return i;\n\
  }\n\
  return -1;\n\
};//@ sourceURL=component-indexof/index.js"
));
require.register("component-emitter/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var index = require('indexof');\n\
\n\
/**\n\
 * Expose `Emitter`.\n\
 */\n\
\n\
module.exports = Emitter;\n\
\n\
/**\n\
 * Initialize a new `Emitter`.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
function Emitter(obj) {\n\
  if (obj) return mixin(obj);\n\
};\n\
\n\
/**\n\
 * Mixin the emitter properties.\n\
 *\n\
 * @param {Object} obj\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
function mixin(obj) {\n\
  for (var key in Emitter.prototype) {\n\
    obj[key] = Emitter.prototype[key];\n\
  }\n\
  return obj;\n\
}\n\
\n\
/**\n\
 * Listen on the given `event` with `fn`.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.on = function(event, fn){\n\
  this._callbacks = this._callbacks || {};\n\
  (this._callbacks[event] = this._callbacks[event] || [])\n\
    .push(fn);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Adds an `event` listener that will be invoked a single\n\
 * time then automatically removed.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.once = function(event, fn){\n\
  var self = this;\n\
  this._callbacks = this._callbacks || {};\n\
\n\
  function on() {\n\
    self.off(event, on);\n\
    fn.apply(this, arguments);\n\
  }\n\
\n\
  fn._off = on;\n\
  this.on(event, on);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Remove the given callback for `event` or all\n\
 * registered callbacks.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.off =\n\
Emitter.prototype.removeListener =\n\
Emitter.prototype.removeAllListeners = function(event, fn){\n\
  this._callbacks = this._callbacks || {};\n\
\n\
  // all\n\
  if (0 == arguments.length) {\n\
    this._callbacks = {};\n\
    return this;\n\
  }\n\
\n\
  // specific event\n\
  var callbacks = this._callbacks[event];\n\
  if (!callbacks) return this;\n\
\n\
  // remove all handlers\n\
  if (1 == arguments.length) {\n\
    delete this._callbacks[event];\n\
    return this;\n\
  }\n\
\n\
  // remove specific handler\n\
  var i = index(callbacks, fn._off || fn);\n\
  if (~i) callbacks.splice(i, 1);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Emit `event` with the given args.\n\
 *\n\
 * @param {String} event\n\
 * @param {Mixed} ...\n\
 * @return {Emitter}\n\
 */\n\
\n\
Emitter.prototype.emit = function(event){\n\
  this._callbacks = this._callbacks || {};\n\
  var args = [].slice.call(arguments, 1)\n\
    , callbacks = this._callbacks[event];\n\
\n\
  if (callbacks) {\n\
    callbacks = callbacks.slice(0);\n\
    for (var i = 0, len = callbacks.length; i < len; ++i) {\n\
      callbacks[i].apply(this, args);\n\
    }\n\
  }\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Return array of callbacks for `event`.\n\
 *\n\
 * @param {String} event\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.listeners = function(event){\n\
  this._callbacks = this._callbacks || {};\n\
  return this._callbacks[event] || [];\n\
};\n\
\n\
/**\n\
 * Check if this emitter has `event` handlers.\n\
 *\n\
 * @param {String} event\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.hasListeners = function(event){\n\
  return !! this.listeners(event).length;\n\
};\n\
//@ sourceURL=component-emitter/index.js"
));
require.register("visionmedia-batch/index.js", Function("exports, require, module",
"/**\n\
 * Module dependencies.\n\
 */\n\
\n\
try {\n\
  var EventEmitter = require('events').EventEmitter;\n\
} catch (err) {\n\
  var Emitter = require('emitter');\n\
}\n\
\n\
/**\n\
 * Noop.\n\
 */\n\
\n\
function noop(){}\n\
\n\
/**\n\
 * Expose `Batch`.\n\
 */\n\
\n\
module.exports = Batch;\n\
\n\
/**\n\
 * Create a new Batch.\n\
 */\n\
\n\
function Batch() {\n\
  if (!(this instanceof Batch)) return new Batch;\n\
  this.fns = [];\n\
  this.concurrency(Infinity);\n\
  this.throws(true);\n\
  for (var i = 0, len = arguments.length; i < len; ++i) {\n\
    this.push(arguments[i]);\n\
  }\n\
}\n\
\n\
/**\n\
 * Inherit from `EventEmitter.prototype`.\n\
 */\n\
\n\
if (EventEmitter) {\n\
  Batch.prototype.__proto__ = EventEmitter.prototype;\n\
} else {\n\
  Emitter(Batch.prototype);\n\
}\n\
\n\
/**\n\
 * Set concurrency to `n`.\n\
 *\n\
 * @param {Number} n\n\
 * @return {Batch}\n\
 * @api public\n\
 */\n\
\n\
Batch.prototype.concurrency = function(n){\n\
  this.n = n;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Queue a function.\n\
 *\n\
 * @param {Function} fn\n\
 * @return {Batch}\n\
 * @api public\n\
 */\n\
\n\
Batch.prototype.push = function(fn){\n\
  this.fns.push(fn);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Set wether Batch will or will not throw up.\n\
 *\n\
 * @param  {Boolean} throws\n\
 * @return {Batch}\n\
 * @api public\n\
 */\n\
Batch.prototype.throws = function(throws) {\n\
  this.e = !!throws;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Execute all queued functions in parallel,\n\
 * executing `cb(err, results)`.\n\
 *\n\
 * @param {Function} cb\n\
 * @return {Batch}\n\
 * @api public\n\
 */\n\
\n\
Batch.prototype.end = function(cb){\n\
  var self = this\n\
    , total = this.fns.length\n\
    , pending = total\n\
    , results = []\n\
    , errors = []\n\
    , cb = cb || noop\n\
    , fns = this.fns\n\
    , max = this.n\n\
    , throws = this.e\n\
    , index = 0\n\
    , done;\n\
\n\
  // empty\n\
  if (!fns.length) return cb(null, results);\n\
\n\
  // process\n\
  function next() {\n\
    var i = index++;\n\
    var fn = fns[i];\n\
    if (!fn) return;\n\
    var start = new Date;\n\
\n\
    try {\n\
      fn(callback);\n\
    } catch (err) {\n\
      callback(err);\n\
    }\n\
\n\
    function callback(err, res){\n\
      if (done) return;\n\
      if (err && throws) return done = true, cb(err);\n\
      var complete = total - pending + 1;\n\
      var end = new Date;\n\
\n\
      results[i] = res;\n\
      errors[i] = err;\n\
\n\
      self.emit('progress', {\n\
        index: i,\n\
        value: res,\n\
        error: err,\n\
        pending: pending,\n\
        total: total,\n\
        complete: complete,\n\
        percent: complete / total * 100 | 0,\n\
        start: start,\n\
        end: end,\n\
        duration: end - start\n\
      });\n\
\n\
      if (--pending) next()\n\
      else if(!throws) cb(errors, results);\n\
      else cb(null, results);\n\
    }\n\
  }\n\
\n\
  // concurrency\n\
  for (var i = 0; i < fns.length; i++) {\n\
    if (i == max) break;\n\
    next();\n\
  }\n\
\n\
  return this;\n\
};\n\
//@ sourceURL=visionmedia-batch/index.js"
));
require.register("CamShaft-jsont/index.js", Function("exports, require, module",
"module.exports = require('./lib');\n\
//@ sourceURL=CamShaft-jsont/index.js"
));
require.register("CamShaft-jsont/lib/each.js", Function("exports, require, module",
"/**\n\
 * We have to copy component/each since the apis are inconsistent:\n\
 *\n\
 * Object (key, value)\n\
 * Array (value, i)\n\
 * String (value, i)\n\
 *\n\
 * This one fixes it to be:\n\
 *\n\
 * Object (value, key)\n\
 * Array (value, i)\n\
 * String (value, i)\n\
 */\n\
\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var type;\n\
\n\
try {\n\
  type = require('type-component');\n\
} catch (e) {\n\
  type = require('type');\n\
}\n\
\n\
/**\n\
 * HOP reference.\n\
 */\n\
\n\
var has = Object.prototype.hasOwnProperty;\n\
\n\
/**\n\
 * Iterate the given `obj` and invoke `fn(val, i)`.\n\
 *\n\
 * @param {String|Array|Object} obj\n\
 * @param {Function} fn\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(obj, fn){\n\
  switch (type(obj)) {\n\
    case 'array':\n\
      return array(obj, fn);\n\
    case 'object':\n\
      if ('number' == typeof obj.length) return array(obj, fn);\n\
      return object(obj, fn);\n\
    case 'string':\n\
      return string(obj, fn);\n\
  }\n\
};\n\
\n\
/**\n\
 * Iterate string chars.\n\
 *\n\
 * @param {String} obj\n\
 * @param {Function} fn\n\
 * @api private\n\
 */\n\
\n\
function string(obj, fn) {\n\
  for (var i = 0; i < obj.length; ++i) {\n\
    fn(obj.charAt(i), i);\n\
  }\n\
}\n\
\n\
/**\n\
 * Iterate object keys.\n\
 *\n\
 * @param {Object} obj\n\
 * @param {Function} fn\n\
 * @api private\n\
 */\n\
\n\
function object(obj, fn) {\n\
  for (var key in obj) {\n\
    if (has.call(obj, key)) {\n\
      fn(obj[key], key);\n\
    }\n\
  }\n\
}\n\
\n\
/**\n\
 * Iterate array-ish.\n\
 *\n\
 * @param {Array|Object} obj\n\
 * @param {Function} fn\n\
 * @api private\n\
 */\n\
\n\
function array(obj, fn) {\n\
  for (var i = 0; i < obj.length; ++i) {\n\
    fn(obj[i], i);\n\
  }\n\
}//@ sourceURL=CamShaft-jsont/lib/each.js"
));
require.register("CamShaft-jsont/lib/helpers.js", Function("exports, require, module",
"/**\n\
 * Module dependencies\n\
 */\n\
\n\
var Batch = require('batch');\n\
var each = require('./each');\n\
var type;\n\
\n\
try {\n\
  type = require('type-component');\n\
} catch (e) {\n\
  type = require('type');\n\
}\n\
var stack = require('./stack');\n\
var set = require('./utils').set;\n\
\n\
exports.map = function(input, done) {\n\
  var self = this;\n\
\n\
  var inputType = type(input);\n\
  var obj;\n\
  if (inputType === 'object') obj = {}\n\
  else if (inputType === 'array') obj = [];\n\
  else return done(new Error('Incompatible type for `map`: '+inputType));\n\
\n\
  var batch = new Batch;\n\
\n\
  each(input, function(value, key) {\n\
    batch.push(function(next) {\n\
      stack.call(self, self.stack.slice(0), value, function(err, value) {\n\
        if (err) return next(err);\n\
        set([key], value, obj);\n\
        next();\n\
      });\n\
    });\n\
  });\n\
\n\
  batch.end(function(err) {\n\
    // Don't use done - we're controling the stack now\n\
    if (err) self.exit(err);\n\
    self.set(self.path, obj);\n\
    self.exit();\n\
  });\n\
};\n\
//@ sourceURL=CamShaft-jsont/lib/helpers.js"
));
require.register("CamShaft-jsont/lib/index.js", Function("exports, require, module",
"/**\n\
 * Module dependencies\n\
 */\n\
\n\
var defaults = require('./helpers');\n\
var template = require('./template');\n\
\n\
module.exports = createInstance;\n\
\n\
/**\n\
 * Create an instance of JSONt\n\
 *\n\
 * @return {JSONt}\n\
 */\n\
\n\
function createInstance() {\n\
  function JSONt(tmpl, options){ return JSONt.compile(tmpl, options); };\n\
  JSONt.helpers = {};\n\
  JSONt.helpers.__proto__ = defaults;\n\
\n\
  JSONt.use = use;\n\
  JSONt.plugin = plugin;\n\
  JSONt.compile = compile;\n\
  JSONt.render = render;\n\
  JSONt.renderFile = renderFile;\n\
\n\
  return JSONt;\n\
};\n\
\n\
/**\n\
 * Use a helpers\n\
 *\n\
 * @param {String} name\n\
 * @param {Function} fun\n\
 * @return {JSONt} for chaining\n\
 */\n\
\n\
function use(name, fun) {\n\
  this.helpers[name] = fun;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Register a collection of helpers\n\
 */\n\
\n\
function plugin(fn) {\n\
  fn(this);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Compile a template with the default helpers\n\
 *\n\
 * @param {String|Object} tmpl\n\
 * @param {Object} options\n\
 * @return {Template}\n\
 */\n\
\n\
function compile(tmpl, options) {\n\
  return template(tmpl, options || {}, this.helpers);\n\
};\n\
\n\
/**\n\
 * Compile and render a template\n\
 *\n\
 * @param {String|Object} tmpl\n\
 * @param {Object} options\n\
 * @param {Function} fn\n\
 */\n\
\n\
function render(tmpl, options, fn) {\n\
  this.compile(tmpl, options)(options, fn);\n\
};\n\
\n\
/**\n\
 * Compile and render a template\n\
 *\n\
 * @param {String} filename\n\
 * @param {Object} options\n\
 * @param {Function} fn\n\
 */\n\
\n\
function renderFile(file, options, fn) {\n\
  this.compile(require(file), options)(options, fn);\n\
};\n\
//@ sourceURL=CamShaft-jsont/lib/index.js"
));
require.register("CamShaft-jsont/lib/render.js", Function("exports, require, module",
"/**\n\
 * Module dependencies\n\
 */\n\
\n\
var Batch = require('batch');\n\
var each = require('./each');\n\
var stack = require('./stack');\n\
var set = require('./utils').set;\n\
\n\
module.exports = Render;\n\
\n\
/**\n\
 * Renders a template\n\
 *\n\
 */\n\
\n\
function Render(helpers, properties, value, options, data, fn) {\n\
  this.helpers = helpers;\n\
  this.properties = properties;\n\
  this.value = value;\n\
  this.options = options;\n\
  this.data = data;\n\
  this.render(fn);\n\
};\n\
\n\
Render.prototype.render = function(fn) {\n\
  var self = this;\n\
  var batch = new Batch;\n\
\n\
  each(self.properties, function(property) {\n\
    batch.push(function(next) {\n\
      // Setup the property context\n\
      var context = {\n\
        exit: next,\n\
        path: property.path,\n\
        stack: property.fns.slice(0)\n\
      };\n\
      context.__proto__ = self;\n\
\n\
      stack.call(context, context.stack, self.data, function(err, value) {\n\
        if (err) return next(err);\n\
        self.set(context.path, value);\n\
        next();\n\
      });\n\
    });\n\
  });\n\
\n\
  batch.end(function(err) {\n\
    if (err) return fn(err);\n\
    fn(null, self.value);\n\
  });\n\
};\n\
\n\
Render.prototype.set = function(path, value) {\n\
  set(path, value, this.value);\n\
  return this;\n\
};\n\
//@ sourceURL=CamShaft-jsont/lib/render.js"
));
require.register("CamShaft-jsont/lib/stack.js", Function("exports, require, module",
"/**\n\
 * Expose stack iteration function\n\
 */\n\
\n\
module.exports = exec;\n\
\n\
function exec(stack, data, done) {\n\
  var self = this;\n\
  var fn = stack.shift();\n\
\n\
  // We're all done\n\
  if (!fn) return done(null, data);\n\
\n\
  try {\n\
    fn.call(self, data, function(err, val) {\n\
      if (err) return done(err);\n\
      setTimeout(function() {\n\
        exec.call(self, stack, val, done);\n\
      }, 0);\n\
    });\n\
  } catch (e) {\n\
    done(e);\n\
  }\n\
};\n\
//@ sourceURL=CamShaft-jsont/lib/stack.js"
));
require.register("CamShaft-jsont/lib/template.js", Function("exports, require, module",
"/**\n\
 * Module dependencies\n\
 */\n\
\n\
var each = require('./each');\n\
var Render = require('./render');\n\
var fmtparser = require('format-parser');\n\
var type;\n\
\n\
try {\n\
  type = require('type-component');\n\
} catch (e) {\n\
  type = require('type');\n\
}\n\
var get = require('selectn');\n\
\n\
module.exports = createTemplate;\n\
\n\
/**\n\
 * Create an instance of Template\n\
 *\n\
 * @return {Template}\n\
 */\n\
\n\
function createTemplate(tmpl, options, helpers) {\n\
  function Template(data, fn){ return Template.render(data, fn); };\n\
  Template.helpers = {};\n\
  Template.helpers.__proto__ = helpers;\n\
  Template.properties = [];\n\
\n\
  // Properties\n\
  Template._tmpl = typeof tmpl === 'string'\n\
    ? JSON.parse(tmpl)\n\
    : tmpl;\n\
  Template.options = options;\n\
\n\
  // Methods\n\
  Template.use = use;\n\
  Template.render = render;\n\
  Template.scan = scan;\n\
  Template.parse = parse;\n\
\n\
  // Scan for templated properties\n\
  Template.scan(Template._tmpl, []);\n\
\n\
  return Template;\n\
};\n\
\n\
/**\n\
 * Use a helper\n\
 *\n\
 * @param {String} name\n\
 * @param {Function} fun\n\
 * @return {Template} for chaining\n\
 */\n\
\n\
function use(name, fun) {\n\
  this.helpers[name] = fun;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Render the template with the data\n\
 *\n\
 * @param {String|Object} tmpl\n\
 * @param {Object} options\n\
 * @return {Template}\n\
 */\n\
\n\
function render(data, fn) {\n\
  return new Render(this.helpers, this.properties, copy(this._tmpl), this.options, data, fn);\n\
};\n\
\n\
/**\n\
 * Deep copy an object\n\
 *\n\
 * @api private\n\
 */\n\
\n\
function copy(tmpl) {\n\
  return JSON.parse(JSON.stringify(tmpl));\n\
};\n\
\n\
/**\n\
 * Scan the properties for something that looks like a template\n\
 */\n\
\n\
var scannable = [\n\
  'object',\n\
  'array'\n\
];\n\
\n\
function scan(template, path) {\n\
  // We can't iterate\n\
  if (!~scannable.indexOf(type(template))) return;\n\
\n\
  var self = this;\n\
  each(template, function(value, key) {\n\
    var newpath = path.concat([key]);\n\
    if (type(value) === 'string') return self.parse(value, newpath);\n\
    if (type(value) === 'object') return self.scan(value, newpath);\n\
    if (type(value) === 'array') return self.scan(value, newpath);\n\
  });\n\
};\n\
\n\
/**\n\
 * Parse and register a templated property\n\
 */\n\
\n\
function parse(value, path) {\n\
  // Verify that it's a templated property\n\
  var out = /^`(.+)`$/.exec(value);\n\
  if (!out) return;\n\
\n\
  // Parse the arguments\n\
  var args = fmtparser(out[1]);\n\
\n\
  // Translate the argument into a function\n\
  var fns = args.map(function(input, i) {\n\
    return (!i && !input.args.length\n\
      ? exp\n\
      : helper)(input.name, input.args);\n\
  });\n\
\n\
  // Register the location and helper functions\n\
  this.properties.push({\n\
    fns: fns,\n\
    path: path\n\
  });\n\
};\n\
\n\
function helper(name, args) {\n\
  return function(input, next) {\n\
    // Find the helper\n\
    var helper = this.helpers[name];\n\
    if (!helper) return next(new Error('Invalid helper \"' + name + '\" at ' + this.path));\n\
\n\
    // Insert the input and add the next function\n\
    var newargs = args.slice(0);\n\
    newargs.unshift(input);\n\
    newargs.push(next);\n\
\n\
    return helper.apply(this, newargs);\n\
  };\n\
};\n\
\n\
function exp(name, args) {\n\
\n\
  // TODO we should be able to parse valid js - similar to angular\n\
  var val = /^'(.+)'$/.exec(name);\n\
\n\
  if (!val) {\n\
    var _get = get(name);\n\
    return function(data, next) {\n\
      next(null, _get(data));\n\
    };\n\
  }\n\
\n\
  var val = val[1];\n\
  return function(data, next) {\n\
    next(null, val);\n\
  };\n\
\n\
  // We've got a function\n\
  // if (args.length) return function(data, next) {\n\
  //   var newargs = args.slice(0);\n\
  //   newargs.unshift(data);\n\
  //   newargs.push(next);\n\
\n\
  // };\n\
\n\
};\n\
//@ sourceURL=CamShaft-jsont/lib/template.js"
));
require.register("CamShaft-jsont/lib/utils.js", Function("exports, require, module",
"/**\n\
 * Set a value at path on obj\n\
 */\n\
\n\
exports.set = function(path, value, obj) {\n\
  var length = path.length - 1;\n\
  var tmp = obj;\n\
  var key;\n\
\n\
  for (var i = 0; i <= length; i++) {\n\
    key = path[i];\n\
    if (i !== length) tmp = tmp[key];\n\
    else tmp[key] = value;\n\
  }\n\
  return obj;\n\
};\n\
//@ sourceURL=CamShaft-jsont/lib/utils.js"
));
require.register("CamShaft-Ractive/build/Ractive.js", Function("exports, require, module",
"/*! Ractive - v0.3.4 - 2013-08-07\n\
* Next-generation DOM manipulation\n\
\n\
* http://rich-harris.github.com/Ractive/\n\
* Copyright (c) 2013 Rich Harris; Licensed MIT */\n\
\n\
/*jslint eqeq: true, plusplus: true */\n\
/*global document, HTMLElement */\n\
\n\
\n\
(function ( global ) {\n\
\n\
'use strict';\n\
\n\
var Ractive,\n\
\n\
// current version\n\
VERSION = '0.3.4',\n\
\n\
doc = global.document || null,\n\
\n\
// Ractive prototype\n\
proto = {},\n\
\n\
// properties of the public Ractive object\n\
adaptors = {},\n\
eventDefinitions = {},\n\
easing,\n\
extend,\n\
parse,\n\
interpolate,\n\
interpolators,\n\
transitions = {},\n\
\n\
\n\
// internal utils - instance-specific\n\
teardown,\n\
clearCache,\n\
registerDependant,\n\
unregisterDependant,\n\
notifyDependants,\n\
notifyMultipleDependants,\n\
notifyDependantsByPriority,\n\
registerIndexRef,\n\
unregisterIndexRef,\n\
resolveRef,\n\
processDeferredUpdates,\n\
\n\
\n\
// internal utils\n\
splitKeypath,\n\
toString,\n\
isArray,\n\
isObject,\n\
isNumeric,\n\
isEqual,\n\
getEl,\n\
insertHtml,\n\
reassignFragments,\n\
executeTransition,\n\
getPartialDescriptor,\n\
getComponentConstructor,\n\
isStringFragmentSimple,\n\
makeTransitionManager,\n\
requestAnimationFrame,\n\
defineProperty,\n\
defineProperties,\n\
create,\n\
createFromNull,\n\
hasOwn = {}.hasOwnProperty,\n\
noop = function () {},\n\
\n\
\n\
// internally used caches\n\
keypathCache = {},\n\
\n\
\n\
// internally used constructors\n\
DomFragment,\n\
DomElement,\n\
DomAttribute,\n\
DomPartial,\n\
DomComponent,\n\
DomInterpolator,\n\
DomTriple,\n\
DomSection,\n\
DomText,\n\
\n\
StringFragment,\n\
StringPartial,\n\
StringInterpolator,\n\
StringSection,\n\
StringText,\n\
\n\
ExpressionResolver,\n\
Evaluator,\n\
Animation,\n\
\n\
\n\
// internally used regexes\n\
leadingWhitespace = /^\\s+/,\n\
trailingWhitespace = /\\s+$/,\n\
\n\
\n\
// other bits and pieces\n\
render,\n\
\n\
initMustache,\n\
updateMustache,\n\
resolveMustache,\n\
evaluateMustache,\n\
\n\
initFragment,\n\
updateSection,\n\
\n\
animationCollection,\n\
\n\
\n\
// array modification\n\
registerKeypathToArray,\n\
unregisterKeypathFromArray,\n\
\n\
\n\
// parser and tokenizer\n\
getFragmentStubFromTokens,\n\
getToken,\n\
tokenize,\n\
stripCommentTokens,\n\
stripHtmlComments,\n\
stripStandalones,\n\
\n\
\n\
// error messages\n\
missingParser = 'Missing Ractive.parse - cannot parse template. Either preparse or use the version that includes the parser',\n\
\n\
\n\
// constants\n\
TEXT              = 1,\n\
INTERPOLATOR      = 2,\n\
TRIPLE            = 3,\n\
SECTION           = 4,\n\
INVERTED          = 5,\n\
CLOSING           = 6,\n\
ELEMENT           = 7,\n\
PARTIAL           = 8,\n\
COMMENT           = 9,\n\
DELIMCHANGE       = 10,\n\
MUSTACHE          = 11,\n\
TAG               = 12,\n\
ATTR_VALUE_TOKEN  = 13,\n\
EXPRESSION        = 14,\n\
COMPONENT         = 15,\n\
\n\
NUMBER_LITERAL    = 20,\n\
STRING_LITERAL    = 21,\n\
ARRAY_LITERAL     = 22,\n\
OBJECT_LITERAL    = 23,\n\
BOOLEAN_LITERAL   = 24,\n\
LITERAL           = 25,\n\
GLOBAL            = 26,\n\
KEY_VALUE_PAIR    = 27,\n\
\n\
\n\
REFERENCE         = 30,\n\
REFINEMENT        = 31,\n\
MEMBER            = 32,\n\
PREFIX_OPERATOR   = 33,\n\
BRACKETED         = 34,\n\
CONDITIONAL       = 35,\n\
INFIX_OPERATOR    = 36,\n\
\n\
INVOCATION        = 40,\n\
\n\
UNSET             = { unset: true },\n\
\n\
testDiv = ( doc ? doc.createElement( 'div' ) : null ),\n\
\n\
\n\
// namespaces\n\
namespaces = {\n\
\thtml:   'http://www.w3.org/1999/xhtml',\n\
\tmathml: 'http://www.w3.org/1998/Math/MathML',\n\
\tsvg:    'http://www.w3.org/2000/svg',\n\
\txlink:  'http://www.w3.org/1999/xlink',\n\
\txml:    'http://www.w3.org/XML/1998/namespace',\n\
\txmlns:  'http://www.w3.org/2000/xmlns/'\n\
};\n\
\n\
\n\
\n\
// we're creating a defineProperty function here - we don't want to add\n\
// this to _legacy.js since it's not a polyfill. It won't allow us to set\n\
// non-enumerable properties. That shouldn't be a problem, unless you're\n\
// using for...in on a (modified) array, in which case you deserve what's\n\
// coming anyway\n\
try {\n\
\tObject.defineProperty({}, 'test', { value: 0 });\n\
\tObject.defineProperties({}, { test: { value: 0 } });\n\
\n\
\tif ( doc ) {\n\
\t\tObject.defineProperty( testDiv, 'test', { value: 0 });\n\
\t\tObject.defineProperties( testDiv, { test: { value: 0 } });\n\
\t}\n\
\n\
\tdefineProperty = Object.defineProperty;\n\
\tdefineProperties = Object.defineProperties;\n\
} catch ( err ) {\n\
\t// Object.defineProperty doesn't exist, or we're in IE8 where you can\n\
\t// only use it with DOM objects (what the fuck were you smoking, MSFT?)\n\
\tdefineProperty = function ( obj, prop, desc ) {\n\
\t\tobj[ prop ] = desc.value;\n\
\t};\n\
\n\
\tdefineProperties = function ( obj, props ) {\n\
\t\tvar prop;\n\
\n\
\t\tfor ( prop in props ) {\n\
\t\t\tif ( props.hasOwnProperty( prop ) ) {\n\
\t\t\t\tdefineProperty( obj, prop, props[ prop ] );\n\
\t\t\t}\n\
\t\t}\n\
\t};\n\
}\n\
\n\
\n\
try {\n\
\tObject.create( null );\n\
\n\
\tcreate = Object.create;\n\
\n\
\tcreateFromNull = function () {\n\
\t\treturn Object.create( null );\n\
\t};\n\
} catch ( err ) {\n\
\t// sigh\n\
\tcreate = (function () {\n\
\t\tvar F = function () {};\n\
\n\
\t\treturn function ( proto, props ) {\n\
\t\t\tvar obj;\n\
\n\
\t\t\tF.prototype = proto;\n\
\t\t\tobj = new F();\n\
\n\
\t\t\tif ( props ) {\n\
\t\t\t\tObject.defineProperties( obj, props );\n\
\t\t\t}\n\
\n\
\t\t\treturn obj;\n\
\t\t};\n\
\t}());\n\
\n\
\tcreateFromNull = function () {\n\
\t\treturn {}; // hope you're not modifying the Object prototype\n\
\t};\n\
}\n\
\n\
\n\
\n\
var hyphenate = function ( str ) {\n\
\treturn str.replace( /[A-Z]/g, function ( match ) {\n\
\t\treturn '-' + match.toLowerCase();\n\
\t});\n\
};\n\
\n\
// determine some facts about our environment\n\
var cssTransitionsEnabled, transition, transitionend;\n\
\n\
(function () {\n\
\n\
\tif ( !doc ) {\n\
\t\treturn;\n\
\t}\n\
\n\
\tif ( testDiv.style.transition !== undefined ) {\n\
\t\ttransition = 'transition';\n\
\t\ttransitionend = 'transitionend';\n\
\t\tcssTransitionsEnabled = true;\n\
\t} else if ( testDiv.style.webkitTransition !== undefined ) {\n\
\t\ttransition = 'webkitTransition';\n\
\t\ttransitionend = 'webkitTransitionEnd';\n\
\t\tcssTransitionsEnabled = true;\n\
\t} else {\n\
\t\tcssTransitionsEnabled = false;\n\
\t}\n\
\n\
}());\n\
executeTransition = function ( descriptor, root, owner, contextStack, isIntro ) {\n\
\tvar transitionName, transitionParams, fragment, transitionManager, transition;\n\
\n\
\tif ( !root.transitionsEnabled ) {\n\
\t\treturn;\n\
\t}\n\
\n\
\tif ( typeof descriptor === 'string' ) {\n\
\t\ttransitionName = descriptor;\n\
\t} else {\n\
\t\ttransitionName = descriptor.n;\n\
\n\
\t\tif ( descriptor.a ) {\n\
\t\t\ttransitionParams = descriptor.a;\n\
\t\t} else if ( descriptor.d ) {\n\
\t\t\tfragment = new TextFragment({\n\
\t\t\t\tdescriptor:   descriptor.d,\n\
\t\t\t\troot:         root,\n\
\t\t\t\towner:        owner,\n\
\t\t\t\tcontextStack: parentFragment.contextStack\n\
\t\t\t});\n\
\n\
\t\t\ttransitionParams = fragment.toJson();\n\
\t\t\tfragment.teardown();\n\
\t\t}\n\
\t}\n\
\n\
\ttransition = root.transitions[ transitionName ] || Ractive.transitions[ transitionName ];\n\
\n\
\tif ( transition ) {\n\
\t\ttransitionManager = root._transitionManager;\n\
\n\
\t\ttransitionManager.push( owner.node );\n\
\t\ttransition.call( root, owner.node, function () {\n\
\t\t\ttransitionManager.pop( owner.node );\n\
\t\t}, transitionParams, isIntro );\n\
\t}\n\
};\n\
getComponentConstructor = function ( root, name ) {\n\
\t// TODO... write this properly!\n\
\treturn root.components[ name ];\n\
};\n\
insertHtml = function ( html, docFrag ) {\n\
\tvar div, nodes = [];\n\
\n\
\tdiv = doc.createElement( 'div' );\n\
\tdiv.innerHTML = html;\n\
\n\
\twhile ( div.firstChild ) {\n\
\t\tnodes[ nodes.length ] = div.firstChild;\n\
\t\tdocFrag.appendChild( div.firstChild );\n\
\t}\n\
\n\
\treturn nodes;\n\
};\n\
(function () {\n\
\n\
\tvar reassignFragment, reassignElement, reassignMustache;\n\
\n\
\treassignFragments = function ( root, section, start, end, by ) {\n\
\t\tvar fragmentsToReassign, i, fragment, indexRef, oldIndex, newIndex, oldKeypath, newKeypath;\n\
\n\
\t\tindexRef = section.descriptor.i;\n\
\n\
\t\tfor ( i=start; i<end; i+=1 ) {\n\
\t\t\tfragment = section.fragments[i];\n\
\n\
\t\t\toldIndex = i - by;\n\
\t\t\tnewIndex = i;\n\
\n\
\t\t\toldKeypath = section.keypath + '.' + ( i - by );\n\
\t\t\tnewKeypath = section.keypath + '.' + i;\n\
\n\
\t\t\t// change the fragment index\n\
\t\t\tfragment.index += by;\n\
\n\
\t\t\treassignFragment( fragment, indexRef, oldIndex, newIndex, by, oldKeypath, newKeypath );\n\
\t\t}\n\
\n\
\t\tprocessDeferredUpdates( root );\n\
\t};\n\
\n\
\treassignFragment = function ( fragment, indexRef, oldIndex, newIndex, by, oldKeypath, newKeypath ) {\n\
\t\tvar i, j, item, context;\n\
\n\
\t\tif ( fragment.indexRefs && fragment.indexRefs[ indexRef ] !== undefined ) {\n\
\t\t\tfragment.indexRefs[ indexRef ] = newIndex;\n\
\t\t}\n\
\n\
\t\t// fix context stack\n\
\t\ti = fragment.contextStack.length;\n\
\t\twhile ( i-- ) {\n\
\t\t\tcontext = fragment.contextStack[i];\n\
\t\t\tif ( context.substr( 0, oldKeypath.length ) === oldKeypath ) {\n\
\t\t\t\tfragment.contextStack[i] = context.replace( oldKeypath, newKeypath );\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\ti = fragment.items.length;\n\
\t\twhile ( i-- ) {\n\
\t\t\titem = fragment.items[i];\n\
\n\
\t\t\tswitch ( item.type ) {\n\
\t\t\t\tcase ELEMENT:\n\
\t\t\t\treassignElement( item, indexRef, oldIndex, newIndex, by, oldKeypath, newKeypath );\n\
\t\t\t\tbreak;\n\
\n\
\t\t\t\tcase PARTIAL:\n\
\t\t\t\treassignFragment( item.fragment, indexRef, oldIndex, newIndex, by, oldKeypath, newKeypath );\n\
\t\t\t\tbreak;\n\
\n\
\t\t\t\tcase SECTION:\n\
\t\t\t\tcase INTERPOLATOR:\n\
\t\t\t\tcase TRIPLE:\n\
\t\t\t\treassignMustache( item, indexRef, oldIndex, newIndex, by, oldKeypath, newKeypath );\n\
\t\t\t\tbreak;\n\
\t\t\t}\n\
\t\t}\n\
\t};\n\
\n\
\treassignElement = function ( element, indexRef, oldIndex, newIndex, by, oldKeypath, newKeypath ) {\n\
\t\tvar i, attribute;\n\
\n\
\t\ti = element.attributes.length;\n\
\t\twhile ( i-- ) {\n\
\t\t\tattribute = element.attributes[i];\n\
\n\
\t\t\tif ( attribute.fragment ) {\n\
\t\t\t\treassignFragment( attribute.fragment, indexRef, oldIndex, newIndex, by, oldKeypath, newKeypath );\n\
\n\
\t\t\t\tif ( attribute.twoway ) {\n\
\t\t\t\t\tattribute.updateBindings();\n\
\t\t\t\t}\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\t// reassign proxy argument fragments TODO and intro/outro param fragments\n\
\t\tif ( element.proxyFrags ) {\n\
\t\t\ti = element.proxyFrags.length;\n\
\t\t\twhile ( i-- ) {\n\
\t\t\t\treassignFragment( element.proxyFrags[i], indexRef, oldIndex, newIndex, by, oldKeypath, newKeypath );\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\tif ( element.node._ractive ) {\n\
\t\t\tif ( element.node._ractive.keypath.substr( 0, oldKeypath.length ) === oldKeypath ) {\n\
\t\t\t\telement.node._ractive.keypath = element.node._ractive.keypath.replace( oldKeypath, newKeypath );\n\
\t\t\t}\n\
\n\
\t\t\telement.node._ractive.index[ indexRef ] = newIndex;\n\
\t\t}\n\
\n\
\t\t// reassign children\n\
\t\tif ( element.fragment ) {\n\
\t\t\treassignFragment( element.fragment, indexRef, oldIndex, newIndex, by, oldKeypath, newKeypath );\n\
\t\t}\n\
\t};\n\
\n\
\treassignMustache = function ( mustache, indexRef, oldIndex, newIndex, by, oldKeypath, newKeypath ) {\n\
\t\tvar i;\n\
\n\
\t\t// expression mustache?\n\
\t\tif ( mustache.descriptor.x ) {\n\
\t\t\tif ( mustache.keypath ) {\n\
\t\t\t\tunregisterDependant( mustache );\n\
\t\t\t}\n\
\t\t\t\n\
\t\t\tif ( mustache.expressionResolver ) {\n\
\t\t\t\tmustache.expressionResolver.teardown();\n\
\t\t\t}\n\
\n\
\t\t\tmustache.expressionResolver = new ExpressionResolver( mustache );\n\
\t\t}\n\
\n\
\t\t// normal keypath mustache?\n\
\t\tif ( mustache.keypath ) {\n\
\t\t\tif ( mustache.keypath.substr( 0, oldKeypath.length ) === oldKeypath ) {\n\
\t\t\t\tunregisterDependant( mustache );\n\
\n\
\t\t\t\tmustache.keypath = mustache.keypath.replace( oldKeypath, newKeypath );\n\
\t\t\t\tregisterDependant( mustache );\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\t// index ref mustache?\n\
\t\telse if ( mustache.indexRef === indexRef ) {\n\
\t\t\tmustache.value = newIndex;\n\
\t\t\tmustache.render( newIndex );\n\
\t\t}\n\
\n\
\t\t// otherwise, it's an unresolved reference. the context stack has been updated\n\
\t\t// so it will take care of itself\n\
\n\
\t\t// if it's a section mustache, we need to go through any children\n\
\t\tif ( mustache.fragments ) {\n\
\t\t\ti = mustache.fragments.length;\n\
\t\t\twhile ( i-- ) {\n\
\t\t\t\treassignFragment( mustache.fragments[i], indexRef, oldIndex, newIndex, by, oldKeypath, newKeypath );\n\
\t\t\t}\n\
\t\t}\n\
\t};\n\
\n\
}());\n\
(function ( cache ) {\n\
\n\
\tvar Reference, getFunctionFromString;\n\
\n\
\tEvaluator = function ( root, keypath, functionStr, args, priority ) {\n\
\t\tvar i, arg;\n\
\n\
\t\tthis.root = root;\n\
\t\tthis.keypath = keypath;\n\
\n\
\t\tthis.fn = getFunctionFromString( functionStr, args.length );\n\
\t\tthis.values = [];\n\
\t\tthis.refs = [];\n\
\n\
\t\ti = args.length;\n\
\t\twhile ( i-- ) {\n\
\t\t\targ = args[i];\n\
\n\
\t\t\tif ( arg[0] ) {\n\
\t\t\t\t// this is an index ref... we don't need to register a dependant\n\
\t\t\t\tthis.values[i] = arg[1];\n\
\t\t\t}\n\
\n\
\t\t\telse {\n\
\t\t\t\tthis.refs[ this.refs.length ] = new Reference( root, arg[1], this, i, priority );\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\tthis.selfUpdating = ( this.refs.length <= 1 );\n\
\n\
\t\tthis.update();\n\
\t};\n\
\n\
\tEvaluator.prototype = {\n\
\t\tbubble: function () {\n\
\t\t\t// If we only have one reference, we can update immediately...\n\
\t\t\tif ( this.selfUpdating ) {\n\
\t\t\t\tthis.update();\n\
\t\t\t}\n\
\n\
\t\t\t// ...otherwise we want to register it as a deferred item, to be\n\
\t\t\t// updated once all the information is in, to prevent unnecessary\n\
\t\t\t// cascading. Only if we're already resolved, obviously\n\
\t\t\telse if ( !this.deferred ) {\n\
\t\t\t\tthis.root._defEvals[ this.root._defEvals.length ] = this;\n\
\t\t\t\tthis.deferred = true;\n\
\t\t\t}\n\
\t\t},\n\
\n\
\t\tupdate: function () {\n\
\t\t\tvar value;\n\
\n\
\t\t\ttry {\n\
\t\t\t\tvalue = this.fn.apply( null, this.values );\n\
\t\t\t} catch ( err ) {\n\
\t\t\t\tif ( this.root.debug ) {\n\
\t\t\t\t\tthrow err;\n\
\t\t\t\t} else {\n\
\t\t\t\t\tvalue = undefined;\n\
\t\t\t\t}\n\
\t\t\t}\n\
\n\
\t\t\tif ( !isEqual( value, this.value ) ) {\n\
\t\t\t\tclearCache( this.root, this.keypath );\n\
\t\t\t\tthis.root._cache[ this.keypath ] = value;\n\
\t\t\t\tnotifyDependants( this.root, this.keypath );\n\
\n\
\t\t\t\tthis.value = value;\n\
\t\t\t}\n\
\n\
\t\t\treturn this;\n\
\t\t},\n\
\n\
\t\t// TODO should evaluators ever get torn down?\n\
\t\tteardown: function () {\n\
\t\t\twhile ( this.refs.length ) {\n\
\t\t\t\tthis.refs.pop().teardown();\n\
\t\t\t}\n\
\n\
\t\t\tclearCache( this.root, this.keypath );\n\
\t\t\tthis.root._evaluators[ this.keypath ] = null;\n\
\t\t},\n\
\n\
\t\t// This method forces the evaluator to sync with the current model\n\
\t\t// in the case of a smart update\n\
\t\trefresh: function () {\n\
\t\t\tif ( !this.selfUpdating ) {\n\
\t\t\t\tthis.deferred = true;\n\
\t\t\t}\n\
\n\
\t\t\tvar i = this.refs.length;\n\
\t\t\twhile ( i-- ) {\n\
\t\t\t\tthis.refs[i].update();\n\
\t\t\t}\n\
\n\
\t\t\tif ( this.deferred ) {\n\
\t\t\t\tthis.update();\n\
\t\t\t\tthis.deferred = false;\n\
\t\t\t}\n\
\t\t}\n\
\t};\n\
\n\
\n\
\tReference = function ( root, keypath, evaluator, argNum, priority ) {\n\
\t\tthis.evaluator = evaluator;\n\
\t\tthis.keypath = keypath;\n\
\t\tthis.root = root;\n\
\t\tthis.argNum = argNum;\n\
\t\tthis.type = REFERENCE;\n\
\t\tthis.priority = priority;\n\
\n\
\t\tthis.value = evaluator.values[ argNum ] = root.get( keypath );\n\
\n\
\t\tregisterDependant( this );\n\
\t};\n\
\n\
\tReference.prototype = {\n\
\t\tupdate: function () {\n\
\t\t\tvar value = this.root.get( this.keypath );\n\
\n\
\t\t\tif ( !isEqual( value, this.value ) ) {\n\
\t\t\t\tthis.evaluator.values[ this.argNum ] = value;\n\
\t\t\t\tthis.evaluator.bubble();\n\
\n\
\t\t\t\tthis.value = value;\n\
\t\t\t}\n\
\t\t},\n\
\n\
\t\tteardown: function () {\n\
\t\t\tunregisterDependant( this );\n\
\t\t}\n\
\t};\n\
\n\
\n\
\tgetFunctionFromString = function ( str, i ) {\n\
\t\tvar fn, args;\n\
\n\
\t\tstr = str.replace( /\\$\\{([0-9]+)\\}/g, '_$1' );\n\
\n\
\t\tif ( cache[ str ] ) {\n\
\t\t\treturn cache[ str ];\n\
\t\t}\n\
\n\
\t\targs = [];\n\
\t\twhile ( i-- ) {\n\
\t\t\targs[i] = '_' + i;\n\
\t\t}\n\
\n\
\t\tfn = new Function( args.join( ',' ), 'return(' + str + ')' );\n\
\n\
\t\tcache[ str ] = fn;\n\
\t\treturn fn;\n\
\t};\n\
\n\
\n\
\n\
}({}));\n\
(function () {\n\
\n\
\tvar ReferenceScout, getKeypath;\n\
\n\
\tExpressionResolver = function ( mustache ) {\n\
\n\
\t\tvar expression, i, len, ref, indexRefs, args;\n\
\n\
\t\tthis.root = mustache.root;\n\
\t\tthis.mustache = mustache;\n\
\t\tthis.args = [];\n\
\t\tthis.scouts = [];\n\
\n\
\t\texpression = mustache.descriptor.x;\n\
\t\tindexRefs = mustache.parentFragment.indexRefs;\n\
\n\
\t\tthis.str = expression.s;\n\
\n\
\t\t// send out scouts for each reference\n\
\t\tlen = this.unresolved = ( expression.r ? expression.r.length : 0 );\n\
\n\
\t\tif ( !len ) {\n\
\t\t\tthis.init(); // some expressions don't have references. edge case, but, yeah.\n\
\t\t}\n\
\n\
\t\tfor ( i=0; i<len; i+=1 ) {\n\
\t\t\tref = expression.r[i];\n\
\t\t\t\n\
\t\t\t// is this an index ref?\n\
\t\t\tif ( indexRefs && indexRefs[ ref ] !== undefined ) {\n\
\t\t\t\tthis.resolveRef( i, true, indexRefs[ ref ] );\n\
\t\t\t}\n\
\n\
\t\t\telse {\n\
\t\t\t\tthis.scouts[ this.scouts.length ] = new ReferenceScout( this, ref, mustache.contextStack, i );\n\
\t\t\t}\n\
\t\t}\n\
\t};\n\
\n\
\tExpressionResolver.prototype = {\n\
\t\tinit: function () {\n\
\t\t\tthis.keypath = getKeypath( this.str, this.args );\n\
\t\t\tthis.createEvaluator();\n\
\n\
\t\t\tthis.mustache.resolve( this.keypath );\n\
\t\t},\n\
\n\
\t\tteardown: function () {\n\
\t\t\twhile ( this.scouts.length ) {\n\
\t\t\t\tthis.scouts.pop().teardown();\n\
\t\t\t}\n\
\t\t},\n\
\n\
\t\tresolveRef: function ( argNum, isIndexRef, value ) {\n\
\t\t\tthis.args[ argNum ] = [ isIndexRef, value ];\n\
\n\
\t\t\t// can we initialise yet?\n\
\t\t\tif ( --this.unresolved ) {\n\
\t\t\t\t// no;\n\
\t\t\t\treturn;\n\
\t\t\t}\n\
\n\
\t\t\tthis.init();\n\
\t\t},\n\
\n\
\t\tcreateEvaluator: function () {\n\
\t\t\t// only if it doesn't exist yet!\n\
\t\t\tif ( !this.root._evaluators[ this.keypath ] ) {\n\
\t\t\t\tthis.root._evaluators[ this.keypath ] = new Evaluator( this.root, this.keypath, this.str, this.args, this.mustache.priority );\n\
\t\t\t}\n\
\n\
\t\t\telse {\n\
\t\t\t\t// we need to trigger a refresh of the evaluator, since it\n\
\t\t\t\t// will have become de-synced from the model if we're in a\n\
\t\t\t\t// reassignment cycle\n\
\t\t\t\tthis.root._evaluators[ this.keypath ].refresh();\n\
\t\t\t}\n\
\t\t}\n\
\t};\n\
\n\
\n\
\tReferenceScout = function ( resolver, ref, contextStack, argNum ) {\n\
\t\tvar keypath, root;\n\
\n\
\t\troot = this.root = resolver.root;\n\
\n\
\t\tkeypath = resolveRef( root, ref, contextStack );\n\
\t\tif ( keypath ) {\n\
\t\t\tresolver.resolveRef( argNum, false, keypath );\n\
\t\t} else {\n\
\t\t\tthis.ref = ref;\n\
\t\t\tthis.argNum = argNum;\n\
\t\t\tthis.resolver = resolver;\n\
\t\t\tthis.contextStack = contextStack;\n\
\n\
\t\t\troot._pendingResolution[ root._pendingResolution.length ] = this;\n\
\t\t}\n\
\t};\n\
\n\
\tReferenceScout.prototype = {\n\
\t\tresolve: function ( keypath ) {\n\
\t\t\tthis.keypath = keypath;\n\
\t\t\tthis.resolver.resolveRef( this.argNum, false, keypath );\n\
\t\t},\n\
\n\
\t\tteardown: function () {\n\
\t\t\t// if we haven't found a keypath yet, we can\n\
\t\t\t// stop the search now\n\
\t\t\tif ( !this.keypath ) {\n\
\t\t\t\tteardown( this );\n\
\t\t\t}\n\
\t\t}\n\
\t};\n\
\n\
\tgetKeypath = function ( str, args ) {\n\
\t\tvar unique;\n\
\n\
\t\t// get string that is unique to this expression\n\
\t\tunique = str.replace( /\\$\\{([0-9]+)\\}/g, function ( match, $1 ) {\n\
\t\t\treturn args[ $1 ][1];\n\
\t\t});\n\
\n\
\t\t// then sanitize by removing any periods or square brackets. Otherwise\n\
\t\t// splitKeypath will go mental!\n\
\t\treturn '(' + unique.replace( /[\\.\\[\\]]/g, '-' ) + ')';\n\
\t};\n\
\n\
}());\n\
(function () {\n\
\n\
\tvar getPartialFromRegistry, unpack;\n\
\n\
\tgetPartialDescriptor = function ( root, name ) {\n\
\t\tvar el, partial;\n\
\n\
\t\t// If the partial was specified on this instance, great\n\
\t\tif ( partial = getPartialFromRegistry( root, name ) ) {\n\
\t\t\treturn partial;\n\
\t\t}\n\
\n\
\t\t// If not, is it a global partial?\n\
\t\tif ( partial = getPartialFromRegistry( Ractive, name ) ) {\n\
\t\t\treturn partial;\n\
\t\t}\n\
\n\
\t\t// Does it exist on the page as a script tag?\n\
\t\tif ( doc ) {\n\
\t\t\tel = doc.getElementById( name );\n\
\t\t\tif ( el && el.tagName === 'SCRIPT' ) {\n\
\t\t\t\tif ( !Ractive.parse ) {\n\
\t\t\t\t\tthrow new Error( missingParser );\n\
\t\t\t\t}\n\
\n\
\t\t\t\tRactive.partials[ name ] = Ractive.parse( el.innerHTML );\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\tpartial = Ractive.partials[ name ];\n\
\n\
\t\t// No match? Return an empty array\n\
\t\tif ( !partial ) {\n\
\t\t\tif ( root.debug && console && console.warn ) {\n\
\t\t\t\tconsole.warn( 'Could not find descriptor for partial \"' + name + '\"' );\n\
\t\t\t}\n\
\n\
\t\t\treturn [];\n\
\t\t}\n\
\n\
\t\treturn unpack( partial );\n\
\t};\n\
\n\
\tgetPartialFromRegistry = function ( registry, name ) {\n\
\t\tif ( registry.partials[ name ] ) {\n\
\t\t\t\n\
\t\t\t// If this was added manually to the registry, but hasn't been parsed,\n\
\t\t\t// parse it now\n\
\t\t\tif ( typeof registry.partials[ name ] === 'string' ) {\n\
\t\t\t\tif ( !Ractive.parse ) {\n\
\t\t\t\t\tthrow new Error( missingParser );\n\
\t\t\t\t}\n\
\n\
\t\t\t\tregistry.partials[ name ] = Ractive.parse( registry.partials[ name ] );\n\
\t\t\t}\n\
\n\
\t\t\treturn unpack( registry.partials[ name ] );\n\
\t\t}\n\
\t};\n\
\n\
\tunpack = function ( partial ) {\n\
\t\t// Unpack string, if necessary\n\
\t\tif ( partial.length === 1 && typeof partial[0] === 'string' ) {\n\
\t\t\treturn partial[0];\n\
\t\t}\n\
\n\
\t\treturn partial;\n\
\t};\n\
\n\
}());\n\
initFragment = function ( fragment, options ) {\n\
\n\
\tvar numItems, i, parentFragment, parentRefs, ref;\n\
\n\
\t// The item that owns this fragment - an element, section, partial, or attribute\n\
\tfragment.owner = options.owner;\n\
\tparentFragment = fragment.owner.parentFragment;\n\
\n\
\t// inherited properties\n\
\tfragment.root = options.root;\n\
\tfragment.parentNode = options.parentNode;\n\
\tfragment.contextStack = options.contextStack || [];\n\
\n\
\t// If parent item is a section, this may not be the only fragment\n\
\t// that belongs to it - we need to make a note of the index\n\
\tif ( fragment.owner.type === SECTION ) {\n\
\t\tfragment.index = options.index;\n\
\t}\n\
\n\
\t// index references (the 'i' in {{#section:i}}<!-- -->{{/section}}) need to cascade\n\
\t// down the tree\n\
\tif ( parentFragment ) {\n\
\t\tparentRefs = parentFragment.indexRefs;\n\
\n\
\t\tif ( parentRefs ) {\n\
\t\t\tfragment.indexRefs = createFromNull(); // avoids need for hasOwnProperty\n\
\n\
\t\t\tfor ( ref in parentRefs ) {\n\
\t\t\t\tfragment.indexRefs[ ref ] = parentRefs[ ref ];\n\
\t\t\t}\n\
\t\t}\n\
\t}\n\
\n\
\t// inherit priority\n\
\tfragment.priority = ( parentFragment ? parentFragment.priority + 1 : 0 );\n\
\n\
\tif ( options.indexRef ) {\n\
\t\tif ( !fragment.indexRefs ) {\n\
\t\t\tfragment.indexRefs = {};\n\
\t\t}\n\
\n\
\t\tfragment.indexRefs[ options.indexRef ] = options.index;\n\
\t}\n\
\n\
\t// Time to create this fragment's child items;\n\
\tfragment.items = [];\n\
\n\
\tnumItems = ( options.descriptor ? options.descriptor.length : 0 );\n\
\tfor ( i=0; i<numItems; i+=1 ) {\n\
\t\tfragment.items[ fragment.items.length ] = fragment.createItem({\n\
\t\t\tparentFragment: fragment,\n\
\t\t\tdescriptor: options.descriptor[i],\n\
\t\t\tindex: i\n\
\t\t});\n\
\t}\n\
\n\
};\n\
isStringFragmentSimple = function ( fragment ) {\n\
\tvar i, item, containsInterpolator;\n\
\n\
\ti = fragment.items.length;\n\
\twhile ( i-- ) {\n\
\t\titem = fragment.items[i];\n\
\t\tif ( item.type === TEXT ) {\n\
\t\t\tcontinue;\n\
\t\t}\n\
\n\
\t\t// we can only have one interpolator and still be self-updating\n\
\t\tif ( item.type === INTERPOLATOR ) {\n\
\t\t\tif ( containsInterpolator ) {\n\
\t\t\t\treturn false;\n\
\t\t\t} else {\n\
\t\t\t\tcontainsInterpolator = true;\n\
\t\t\t\tcontinue;\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\t// anything that isn't text or an interpolator (i.e. a section)\n\
\t\t// and we can't self-update\n\
\t\treturn false;\n\
\t}\n\
\n\
\treturn true;\n\
};\n\
initMustache = function ( mustache, options ) {\n\
\n\
\tvar keypath, index, indexRef, parentFragment;\n\
\n\
\tparentFragment = mustache.parentFragment = options.parentFragment;\n\
\n\
\tmustache.root           = parentFragment.root;\n\
\tmustache.contextStack   = parentFragment.contextStack;\n\
\t\n\
\tmustache.descriptor     = options.descriptor;\n\
\tmustache.index          = options.index || 0;\n\
\tmustache.priority       = parentFragment.priority;\n\
\n\
\t// DOM only\n\
\tif ( parentFragment.parentNode ) {\n\
\t\tmustache.parentNode = parentFragment.parentNode;\n\
\t}\n\
\n\
\tmustache.type = options.descriptor.t;\n\
\n\
\n\
\t// if this is a simple mustache, with a reference, we just need to resolve\n\
\t// the reference to a keypath\n\
\tif ( options.descriptor.r ) {\n\
\t\tif ( parentFragment.indexRefs && parentFragment.indexRefs[ options.descriptor.r ] !== undefined ) {\n\
\t\t\tindexRef = parentFragment.indexRefs[ options.descriptor.r ];\n\
\n\
\t\t\tmustache.indexRef = options.descriptor.r;\n\
\t\t\tmustache.value = indexRef;\n\
\t\t\tmustache.render( mustache.value );\n\
\t\t}\n\
\n\
\t\telse {\n\
\t\t\tkeypath = resolveRef( mustache.root, options.descriptor.r, mustache.contextStack );\n\
\t\t\tif ( keypath ) {\n\
\t\t\t\tmustache.resolve( keypath );\n\
\t\t\t} else {\n\
\t\t\t\tmustache.ref = options.descriptor.r;\n\
\t\t\t\tmustache.root._pendingResolution[ mustache.root._pendingResolution.length ] = mustache;\n\
\n\
\t\t\t\t// inverted section? initialise\n\
\t\t\t\tif ( mustache.descriptor.n ) {\n\
\t\t\t\t\tmustache.render( false );\n\
\t\t\t\t}\n\
\t\t\t}\n\
\t\t}\n\
\t}\n\
\n\
\t// if it's an expression, we have a bit more work to do\n\
\tif ( options.descriptor.x ) {\n\
\t\tmustache.expressionResolver = new ExpressionResolver( mustache );\n\
\t}\n\
\n\
};\n\
\n\
\n\
// methods to add to individual mustache prototypes\n\
updateMustache = function () {\n\
\tvar value;\n\
\n\
\tvalue = this.root.get( this.keypath, true );\n\
\n\
\tif ( !isEqual( value, this.value ) ) {\n\
\t\tthis.render( value );\n\
\t\tthis.value = value;\n\
\t}\n\
};\n\
\n\
resolveMustache = function ( keypath ) {\n\
\tthis.keypath = keypath;\n\
\n\
\tregisterDependant( this );\n\
\t\n\
\tthis.update();\n\
\n\
\tif ( this.expressionResolver ) {\n\
\t\tthis.expressionResolver = null;\n\
\t}\n\
};\n\
(function () {\n\
\n\
\tvar updateInvertedSection, updateListSection, updateContextSection, updateConditionalSection;\n\
\n\
\tupdateSection = function ( section, value ) {\n\
\t\tvar fragmentOptions;\n\
\n\
\t\tfragmentOptions = {\n\
\t\t\tdescriptor: section.descriptor.f,\n\
\t\t\troot:       section.root,\n\
\t\t\tparentNode: section.parentNode,\n\
\t\t\towner:      section\n\
\t\t};\n\
\n\
\t\t// if section is inverted, only check for truthiness/falsiness\n\
\t\tif ( section.descriptor.n ) {\n\
\t\t\tupdateConditionalSection( section, value, true, fragmentOptions );\n\
\t\t\treturn;\n\
\t\t}\n\
\n\
\t\t// otherwise we need to work out what sort of section we're dealing with\n\
\n\
\t\t// if value is an array, iterate through\n\
\t\tif ( isArray( value ) ) {\n\
\t\t\tupdateListSection( section, value, fragmentOptions );\n\
\t\t}\n\
\n\
\n\
\t\t// if value is a hash...\n\
\t\telse if ( isObject( value ) ) {\n\
\t\t\tupdateContextSection( section, fragmentOptions );\n\
\t\t}\n\
\n\
\n\
\t\t// otherwise render if value is truthy, unrender if falsy\n\
\t\telse {\n\
\t\t\tupdateConditionalSection( section, value, false, fragmentOptions );\n\
\t\t}\n\
\t};\n\
\n\
\tupdateListSection = function ( section, value, fragmentOptions ) {\n\
\t\tvar i, fragmentsToRemove;\n\
\n\
\t\t// if the array is shorter than it was previously, remove items\n\
\t\tif ( value.length < section.length ) {\n\
\t\t\tfragmentsToRemove = section.fragments.splice( value.length, section.length - value.length );\n\
\n\
\t\t\twhile ( fragmentsToRemove.length ) {\n\
\t\t\t\tfragmentsToRemove.pop().teardown( true );\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\t// otherwise...\n\
\t\telse {\n\
\n\
\t\t\tif ( value.length > section.length ) {\n\
\t\t\t\t// add any new ones\n\
\t\t\t\tfor ( i=section.length; i<value.length; i+=1 ) {\n\
\t\t\t\t\t// append list item to context stack\n\
\t\t\t\t\tfragmentOptions.contextStack = section.contextStack.concat( section.keypath + '.' + i );\n\
\t\t\t\t\tfragmentOptions.index = i;\n\
\n\
\t\t\t\t\tif ( section.descriptor.i ) {\n\
\t\t\t\t\t\tfragmentOptions.indexRef = section.descriptor.i;\n\
\t\t\t\t\t}\n\
\n\
\t\t\t\t\tsection.fragments[i] = section.createFragment( fragmentOptions );\n\
\t\t\t\t}\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\tsection.length = value.length;\n\
\t};\n\
\n\
\tupdateContextSection = function ( section, fragmentOptions ) {\n\
\t\t// ...then if it isn't rendered, render it, adding section.keypath to the context stack\n\
\t\t// (if it is already rendered, then any children dependent on the context stack\n\
\t\t// will update themselves without any prompting)\n\
\t\tif ( !section.length ) {\n\
\t\t\t// append this section to the context stack\n\
\t\t\tfragmentOptions.contextStack = section.contextStack.concat( section.keypath );\n\
\t\t\tfragmentOptions.index = 0;\n\
\n\
\t\t\tsection.fragments[0] = section.createFragment( fragmentOptions );\n\
\t\t\tsection.length = 1;\n\
\t\t}\n\
\t};\n\
\n\
\tupdateConditionalSection = function ( section, value, inverted, fragmentOptions ) {\n\
\t\tvar doRender, emptyArray, fragmentsToRemove;\n\
\n\
\t\temptyArray = ( isArray( value ) && value.length === 0 );\n\
\n\
\t\tif ( inverted ) {\n\
\t\t\tdoRender = emptyArray || !value;\n\
\t\t} else {\n\
\t\t\tdoRender = value && !emptyArray;\n\
\t\t}\n\
\n\
\t\tif ( doRender ) {\n\
\t\t\tif ( !section.length ) {\n\
\t\t\t\t// no change to context stack\n\
\t\t\t\tfragmentOptions.contextStack = section.contextStack;\n\
\t\t\t\tfragmentOptions.index = 0;\n\
\n\
\t\t\t\tsection.fragments[0] = section.createFragment( fragmentOptions );\n\
\t\t\t\tsection.length = 1;\n\
\t\t\t}\n\
\n\
\t\t\tif ( section.length > 1 ) {\n\
\t\t\t\tfragmentsToRemove = section.fragments.splice( 1 );\n\
\t\t\t\t\n\
\t\t\t\twhile ( fragmentsToRemove.length ) {\n\
\t\t\t\t\tfragmentsToRemove.pop().teardown( true );\n\
\t\t\t\t}\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\telse if ( section.length ) {\n\
\t\t\tsection.teardownFragments( true );\n\
\t\t\tsection.length = 0;\n\
\t\t}\n\
\t};\n\
\n\
}());\n\
stripCommentTokens = function ( tokens ) {\n\
\tvar i, current, previous, next;\n\
\n\
\tfor ( i=0; i<tokens.length; i+=1 ) {\n\
\t\tcurrent = tokens[i];\n\
\t\tprevious = tokens[i-1];\n\
\t\tnext = tokens[i+1];\n\
\n\
\t\t// if the current token is a comment or a delimiter change, remove it...\n\
\t\tif ( current.mustacheType === COMMENT || current.mustacheType === DELIMCHANGE ) {\n\
\t\t\t\n\
\t\t\ttokens.splice( i, 1 ); // remove comment token\n\
\n\
\t\t\t// ... and see if it has text nodes either side, in which case\n\
\t\t\t// they can be concatenated\n\
\t\t\tif ( previous && next ) {\n\
\t\t\t\tif ( previous.type === TEXT && next.type === TEXT ) {\n\
\t\t\t\t\tprevious.value += next.value;\n\
\t\t\t\t\t\n\
\t\t\t\t\ttokens.splice( i, 1 ); // remove next token\n\
\t\t\t\t}\n\
\t\t\t}\n\
\n\
\t\t\ti -= 1; // decrement i to account for the splice(s)\n\
\t\t}\n\
\t}\n\
\n\
\treturn tokens;\n\
};\n\
stripHtmlComments = function ( html ) {\n\
\tvar commentStart, commentEnd, processed;\n\
\n\
\tprocessed = '';\n\
\n\
\twhile ( html.length ) {\n\
\t\tcommentStart = html.indexOf( '<!--' );\n\
\t\tcommentEnd = html.indexOf( '-->' );\n\
\n\
\t\t// no comments? great\n\
\t\tif ( commentStart === -1 && commentEnd === -1 ) {\n\
\t\t\tprocessed += html;\n\
\t\t\tbreak;\n\
\t\t}\n\
\n\
\t\t// comment start but no comment end\n\
\t\tif ( commentStart !== -1 && commentEnd === -1 ) {\n\
\t\t\tthrow 'Illegal HTML - expected closing comment sequence (\\'-->\\')';\n\
\t\t}\n\
\n\
\t\t// comment end but no comment start, or comment end before comment start\n\
\t\tif ( ( commentEnd !== -1 && commentStart === -1 ) || ( commentEnd < commentStart ) ) {\n\
\t\t\tthrow 'Illegal HTML - unexpected closing comment sequence (\\'-->\\')';\n\
\t\t}\n\
\n\
\t\tprocessed += html.substr( 0, commentStart );\n\
\t\thtml = html.substring( commentEnd + 3 );\n\
\t}\n\
\n\
\treturn processed;\n\
};\n\
stripStandalones = function ( tokens ) {\n\
\tvar i, current, backOne, backTwo, leadingLinebreak, trailingLinebreak;\n\
\n\
\tleadingLinebreak = /^\\s*\\r?\\n\
/;\n\
\ttrailingLinebreak = /\\r?\\n\
\\s*$/;\n\
\n\
\tfor ( i=2; i<tokens.length; i+=1 ) {\n\
\t\tcurrent = tokens[i];\n\
\t\tbackOne = tokens[i-1];\n\
\t\tbackTwo = tokens[i-2];\n\
\n\
\t\t// if we're at the end of a [text][mustache][text] sequence...\n\
\t\tif ( current.type === TEXT && ( backOne.type === MUSTACHE ) && backTwo.type === TEXT ) {\n\
\n\
\t\t\t// ... and the mustache is a standalone (i.e. line breaks either side)...\n\
\t\t\tif ( trailingLinebreak.test( backTwo.value ) && leadingLinebreak.test( current.value ) ) {\n\
\n\
\t\t\t\t// ... then we want to remove the whitespace after the first line break\n\
\t\t\t\t// if the mustache wasn't a triple or interpolator or partial\n\
\t\t\t\tif ( backOne.mustacheType !== INTERPOLATOR && backOne.mustacheType !== TRIPLE ) {\n\
\t\t\t\t\tbackTwo.value = backTwo.value.replace( trailingLinebreak, '\\n\
' );\n\
\t\t\t\t}\n\
\n\
\t\t\t\t// and the leading line break of the second text token\n\
\t\t\t\tcurrent.value = current.value.replace( leadingLinebreak, '' );\n\
\n\
\t\t\t\t// if that means the current token is now empty, we should remove it\n\
\t\t\t\tif ( current.value === '' ) {\n\
\t\t\t\t\ttokens.splice( i--, 1 ); // splice and decrement\n\
\t\t\t\t}\n\
\t\t\t}\n\
\t\t}\n\
\t}\n\
\n\
\treturn tokens;\n\
};\n\
(function ( proto ) {\n\
\n\
\tvar add = function ( root, keypath, d ) {\n\
\t\tvar value;\n\
\n\
\t\tif ( typeof keypath !== 'string' || !isNumeric( d ) ) {\n\
\t\t\tif ( root.debug ) {\n\
\t\t\t\tthrow new Error( 'Bad arguments' );\n\
\t\t\t}\n\
\t\t\treturn;\n\
\t\t}\n\
\n\
\t\tvalue = root.get( keypath );\n\
\n\
\t\tif ( value === undefined ) {\n\
\t\t\tvalue = 0;\n\
\t\t}\n\
\n\
\t\tif ( !isNumeric( value ) ) {\n\
\t\t\tif ( root.debug ) {\n\
\t\t\t\tthrow new Error( 'Cannot add to a non-numeric value' );\n\
\t\t\t}\n\
\t\t\treturn;\n\
\t\t}\n\
\n\
\t\troot.set( keypath, value + d );\n\
\t};\n\
\n\
\tproto.add = function ( keypath, d ) {\n\
\t\tadd( this, keypath, ( d === undefined ? 1 : d ) );\n\
\t};\n\
\n\
\tproto.subtract = function ( keypath, d ) {\n\
\t\tadd( this, keypath, ( d === undefined ? -1 : -d ) );\n\
\t};\n\
\n\
\tproto.toggle = function ( keypath ) {\n\
\t\tvar value;\n\
\n\
\t\tif ( typeof keypath !== 'string' ) {\n\
\t\t\tif ( this.debug ) {\n\
\t\t\t\tthrow new Error( 'Bad arguments' );\n\
\t\t\t}\n\
\t\t\treturn;\n\
\t\t}\n\
\n\
\t\tvalue = this.get( keypath );\n\
\t\tthis.set( keypath, !value );\n\
\t};\n\
\n\
}( proto ));\n\
(function ( proto ) {\n\
\n\
\tvar animate, noAnimation;\n\
\n\
\tproto.animate = function ( keypath, to, options ) {\n\
\t\t\n\
\t\tvar k, animation, animations;\n\
\n\
\t\t// animate multiple keypaths\n\
\t\tif ( typeof keypath === 'object' ) {\n\
\t\t\toptions = to || {};\n\
\t\t\tanimations = [];\n\
\n\
\t\t\tfor ( k in keypath ) {\n\
\t\t\t\tif ( hasOwn.call( keypath, k ) ) {\n\
\t\t\t\t\tanimations[ animations.length ] = animate( this, k, keypath[k], options );\n\
\t\t\t\t}\n\
\t\t\t}\n\
\n\
\t\t\treturn {\n\
\t\t\t\tstop: function () {\n\
\t\t\t\t\twhile ( animations.length ) {\n\
\t\t\t\t\t\tanimations.pop().stop();\n\
\t\t\t\t\t}\n\
\t\t\t\t}\n\
\t\t\t};\n\
\t\t}\n\
\n\
\t\t// animate a single keypath\n\
\t\toptions = options || {};\n\
\n\
\t\tanimation = animate( this, keypath, to, options );\n\
\n\
\t\treturn {\n\
\t\t\tstop: function () {\n\
\t\t\t\tanimation.stop();\n\
\t\t\t}\n\
\t\t};\n\
\t};\n\
\n\
\tnoAnimation = {\n\
\t\tstop: noop\n\
\t};\n\
\n\
\tanimate = function ( root, keypath, to, options ) {\n\
\t\tvar easing, duration, animation, i, keys, from;\n\
\n\
\t\tfrom = root.get( keypath );\n\
\t\t\n\
\t\t// cancel any existing animation\n\
\t\t// TODO what about upstream/downstream keypaths?\n\
\t\ti = animationCollection.animations.length;\n\
\t\twhile ( i-- ) {\n\
\t\t\tanimation = animationCollection.animations[i];\n\
\n\
\t\t\tif ( animation.root === root && animation.keypath === keypath ) {\n\
\t\t\t\tanimation.stop();\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\t// don't bother animating values that stay the same\n\
\t\tif ( isEqual( from, to ) ) {\n\
\t\t\tif ( options.complete ) {\n\
\t\t\t\toptions.complete( 1, options.to );\n\
\t\t\t}\n\
\n\
\t\t\treturn noAnimation;\n\
\t\t}\n\
\n\
\t\t// easing function\n\
\t\tif ( options.easing ) {\n\
\t\t\tif ( typeof options.easing === 'function' ) {\n\
\t\t\t\teasing = options.easing;\n\
\t\t\t}\n\
\n\
\t\t\telse {\n\
\t\t\t\tif ( root.easing && root.easing[ options.easing ] ) {\n\
\t\t\t\t\t// use instance easing function first\n\
\t\t\t\t\teasing = root.easing[ options.easing ];\n\
\t\t\t\t} else {\n\
\t\t\t\t\t// fallback to global easing functions\n\
\t\t\t\t\teasing = Ractive.easing[ options.easing ];\n\
\t\t\t\t}\n\
\t\t\t}\n\
\n\
\t\t\tif ( typeof easing !== 'function' ) {\n\
\t\t\t\teasing = null;\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\t// duration\n\
\t\tduration = ( options.duration === undefined ? 400 : options.duration );\n\
\n\
\t\t// TODO store keys, use an internal set method\n\
\t\t//keys = splitKeypath( keypath );\n\
\n\
\t\tanimation = new Animation({\n\
\t\t\tkeypath: keypath,\n\
\t\t\tfrom: from,\n\
\t\t\tto: to,\n\
\t\t\troot: root,\n\
\t\t\tduration: duration,\n\
\t\t\teasing: easing,\n\
\t\t\tstep: options.step,\n\
\t\t\tcomplete: options.complete\n\
\t\t});\n\
\n\
\t\tanimationCollection.push( animation );\n\
\t\troot._animations[ root._animations.length ] = animation;\n\
\n\
\t\treturn animation;\n\
\t};\n\
\n\
}( proto ));\n\
proto.bind = function ( adaptor ) {\n\
\tvar bound = this._bound;\n\
\n\
\tif ( bound.indexOf( adaptor ) === -1 ) {\n\
\t\tbound[ bound.length ] = adaptor;\n\
\t\tadaptor.init( this );\n\
\t}\n\
};\n\
proto.cancelFullscreen = function () {\n\
\tRactive.cancelFullscreen( this.el );\n\
};\n\
proto.find = function ( selector ) {\n\
\tif ( !this.el ) {\n\
\t\treturn null;\n\
\t}\n\
\n\
\treturn this.el.querySelector( selector );\n\
};\n\
proto.findAll = function ( selector ) {\n\
\tif ( !this.el ) {\n\
\t\treturn [];\n\
\t}\n\
\n\
\treturn this.el.querySelectorAll( selector );\n\
};\n\
proto.fire = function ( eventName ) {\n\
\tvar args, i, len, subscribers = this._subs[ eventName ];\n\
\n\
\tif ( !subscribers ) {\n\
\t\treturn;\n\
\t}\n\
\n\
\targs = Array.prototype.slice.call( arguments, 1 );\n\
\n\
\tfor ( i=0, len=subscribers.length; i<len; i+=1 ) {\n\
\t\tsubscribers[i].apply( this, args );\n\
\t}\n\
};\n\
// TODO use dontNormalise\n\
// TODO refactor this shitball\n\
\n\
proto.get = function ( keypath, dontNormalise ) {\n\
\tvar cache, cacheMap, keys, normalised, key, parentKeypath, parentValue, value, ignoreUndefined;\n\
\n\
\tif ( !keypath ) {\n\
\t\treturn this.data;\n\
\t}\n\
\n\
\tcache = this._cache;\n\
\n\
\tif ( isArray( keypath ) ) {\n\
\t\tif ( !keypath.length ) {\n\
\t\t\treturn this.data;\n\
\t\t}\n\
\n\
\t\tkeys = keypath.slice(); // clone\n\
\t\tnormalised = keys.join( '.' );\n\
\n\
\t\tignoreUndefined = true; // because this should be a branch, sod the cache\n\
\t}\n\
\n\
\telse {\n\
\t\t// cache hit? great\n\
\t\tif ( hasOwn.call( cache, keypath ) && cache[ keypath ] !== UNSET ) {\n\
\t\t\treturn cache[ keypath ];\n\
\t\t}\n\
\n\
\t\tkeys = splitKeypath( keypath );\n\
\t\tnormalised = keys.join( '.' );\n\
\t}\n\
\n\
\t// we may have a cache hit now that it's been normalised\n\
\tif ( hasOwn.call( cache, normalised ) && cache[ normalised ] !== UNSET ) {\n\
\t\tif ( cache[ normalised ] === undefined && ignoreUndefined ) {\n\
\t\t\t// continue\n\
\t\t} else {\n\
\t\t\treturn cache[ normalised ];\n\
\t\t}\n\
\t}\n\
\n\
\t// is this an uncached evaluator value?\n\
\tif ( this._evaluators[ normalised ] ) {\n\
\t\tvalue = this._evaluators[ normalised ].value;\n\
\t\tcache[ normalised ] = value;\n\
\t\treturn value;\n\
\t}\n\
\n\
\t// otherwise it looks like we need to do some work\n\
\tkey = keys.pop();\n\
\tparentKeypath = keys.join( '.' );\n\
\tparentValue = ( keys.length ? this.get( keys ) : this.data );\n\
\n\
\tif ( parentValue === null || typeof parentValue !== 'object' || parentValue === UNSET ) {\n\
\t\treturn;\n\
\t}\n\
\n\
\t// update cache map\n\
\tif ( !( cacheMap = this._cacheMap[ parentKeypath ] ) ) {\n\
\t\tthis._cacheMap[ parentKeypath ] = [ normalised ];\n\
\t} else {\n\
\t\tif ( cacheMap.indexOf( normalised ) === -1 ) {\n\
\t\t\tcacheMap[ cacheMap.length ] = normalised;\n\
\t\t}\n\
\t}\n\
\n\
\tvalue = parentValue[ key ];\n\
\n\
\t// Is this an array that needs to be wrapped?\n\
\tif ( this.modifyArrays ) {\n\
\t\t// if it's not an expression, is an array, and we're not here because it sent us here, wrap it\n\
\t\tif ( ( normalised.charAt( 0 ) !== '(' ) && isArray( value ) && ( !value._ractive || !value._ractive.setting ) ) {\n\
\t\t\tregisterKeypathToArray( value, normalised, this );\n\
\t\t}\n\
\t}\n\
\n\
\t// Update cache\n\
\tcache[ normalised ] = value;\n\
\n\
\treturn value;\n\
};\n\
clearCache = function ( ractive, keypath ) {\n\
\tvar value, len, kp, cacheMap;\n\
\n\
\t// is this a modified array, which shouldn't fire set events on this keypath anymore?\n\
\tif ( ractive.modifyArrays ) {\n\
\t\tif ( keypath.charAt( 0 ) !== '(' ) { // expressions (and their children) don't get wrapped\n\
\t\t\tvalue = ractive._cache[ keypath ];\n\
\t\t\tif ( isArray( value ) && !value._ractive.setting ) {\n\
\t\t\t\tunregisterKeypathFromArray( value, keypath, ractive );\n\
\t\t\t}\n\
\t\t}\n\
\t}\n\
\t\n\
\tractive._cache[ keypath ] = UNSET;\n\
\n\
\tif ( cacheMap = ractive._cacheMap[ keypath ] ) {\n\
\t\twhile ( cacheMap.length ) {\n\
\t\t\tclearCache( ractive, cacheMap.pop() );\n\
\t\t}\n\
\t}\n\
};\n\
notifyDependants = function ( ractive, keypath, onlyDirect ) {\n\
\tvar i;\n\
\n\
\tfor ( i=0; i<ractive._deps.length; i+=1 ) { // can't cache ractive._deps.length, it may change\n\
\t\tnotifyDependantsByPriority( ractive, keypath, i, onlyDirect );\n\
\t}\n\
};\n\
notifyDependantsByPriority = function ( ractive, keypath, priority, onlyDirect ) {\n\
\tvar depsByKeypath, deps, i, len, childDeps;\n\
\n\
\tdepsByKeypath = ractive._deps[ priority ];\n\
\n\
\tif ( !depsByKeypath ) {\n\
\t\treturn;\n\
\t}\n\
\n\
\tdeps = depsByKeypath[ keypath ];\n\
\n\
\tif ( deps ) {\n\
\t\ti = deps.length;\n\
\t\twhile ( i-- ) {\n\
\t\t\tdeps[i].update();\n\
\t\t}\n\
\t}\n\
\n\
\t// If we're only notifying direct dependants, not dependants\n\
\t// of downstream keypaths, then YOU SHALL NOT PASS\n\
\tif ( onlyDirect ) {\n\
\t\treturn;\n\
\t}\n\
\t\n\
\n\
\t// cascade\n\
\tchildDeps = ractive._depsMap[ keypath ];\n\
\t\n\
\tif ( childDeps ) {\n\
\t\ti = childDeps.length;\n\
\t\twhile ( i-- ) {\n\
\t\t\tnotifyDependantsByPriority( ractive, childDeps[i], priority );\n\
\t\t}\n\
\t}\n\
};\n\
notifyMultipleDependants = function ( ractive, keypaths, onlyDirect ) {\n\
\tvar  i, j, len;\n\
\n\
\tlen = keypaths.length;\n\
\n\
\tfor ( i=0; i<ractive._deps.length; i+=1 ) {\n\
\t\tif ( ractive._deps[i] ) {\n\
\t\t\tj = len;\n\
\t\t\twhile ( j-- ) {\n\
\t\t\t\tnotifyDependantsByPriority( ractive, keypaths[j], i, onlyDirect );\n\
\t\t\t}\n\
\t\t}\n\
\t}\n\
};\n\
processDeferredUpdates = function ( ractive ) {\n\
\tvar evaluator, attribute;\n\
\n\
\twhile ( ractive._defEvals.length ) {\n\
\t\t evaluator = ractive._defEvals.pop();\n\
\t\t evaluator.update().deferred = false;\n\
\t}\n\
\n\
\twhile ( ractive._defAttrs.length ) {\n\
\t\tattribute = ractive._defAttrs.pop();\n\
\t\tattribute.update().deferred = false;\n\
\t}\n\
\n\
\twhile ( ractive._defSelectValues.length ) {\n\
\t\tattribute = ractive._defSelectValues.pop();\n\
\n\
\t\tattribute.parentNode.value = attribute.value;\n\
\n\
\t\t// value may not be what we think it should be, if the relevant <option>\n\
\t\t// element doesn't exist!\n\
\t\tattribute.value = attribute.parentNode.value;\n\
\t}\n\
};\n\
registerDependant = function ( dependant ) {\n\
\tvar depsByKeypath, deps, keys, parentKeypath, map, ractive, keypath, priority;\n\
\n\
\tractive = dependant.root;\n\
\tkeypath = dependant.keypath;\n\
\tpriority = dependant.priority;\n\
\n\
\tdepsByKeypath = ractive._deps[ priority ] || ( ractive._deps[ priority ] = {} );\n\
\tdeps = depsByKeypath[ keypath ] || ( depsByKeypath[ keypath ] = [] );\n\
\n\
\tdeps[ deps.length ] = dependant;\n\
\n\
\t// update dependants map\n\
\tkeys = splitKeypath( keypath );\n\
\t\n\
\twhile ( keys.length ) {\n\
\t\tkeys.pop();\n\
\t\tparentKeypath = keys.join( '.' );\n\
\t\n\
\t\tmap = ractive._depsMap[ parentKeypath ] || ( ractive._depsMap[ parentKeypath ] = [] );\n\
\n\
\t\tif ( map[ keypath ] === undefined ) {\n\
\t\t\tmap[ keypath ] = 0;\n\
\t\t\tmap[ map.length ] = keypath;\n\
\t\t}\n\
\n\
\t\tmap[ keypath ] += 1;\n\
\n\
\t\tkeypath = parentKeypath;\n\
\t}\n\
};\n\
// Render instance to element specified here or at initialization\n\
render = function ( ractive, options ) {\n\
\tvar el, transitionManager;\n\
\n\
\tel = ( options.el ? getEl( options.el ) : ractive.el );\n\
\n\
\t// Clear the element, unless `append` is `true`\n\
\tif ( el && !options.append ) {\n\
\t\tel.innerHTML = '';\n\
\t}\n\
\n\
\tractive._transitionManager = transitionManager = makeTransitionManager( ractive, options.complete );\n\
\n\
\t// Render our *root fragment*\n\
\tractive.fragment = new DomFragment({\n\
\t\tdescriptor: ractive.template,\n\
\t\troot: ractive,\n\
\t\towner: ractive, // saves doing `if ( ractive.parent ) { /*...*/ }` later on\n\
\t\tparentNode: el\n\
\t});\n\
\n\
\tprocessDeferredUpdates( ractive );\n\
\n\
\tif ( el ) {\n\
\t\tel.appendChild( ractive.fragment.docFrag );\n\
\t}\n\
\n\
\t// transition manager has finished its work\n\
\tractive._transitionManager = null;\n\
\ttransitionManager.ready();\n\
};\n\
// Resolve a full keypath from `ref` within the given `contextStack` (e.g.\n\
// `'bar.baz'` within the context stack `['foo']` might resolve to `'foo.bar.baz'`\n\
resolveRef = function ( ractive, ref, contextStack ) {\n\
\n\
\tvar keys, lastKey, innerMostContext, contextKeys, parentValue, keypath;\n\
\n\
\t// Implicit iterators - i.e. {{.}} - are a special case\n\
\tif ( ref === '.' ) {\n\
\t\treturn contextStack[ contextStack.length - 1 ];\n\
\t}\n\
\n\
\t// References prepended with '.' are another special case\n\
\tif ( ref.charAt( 0 ) === '.' ) {\n\
\t\treturn contextStack[ contextStack.length - 1 ] + ref;\n\
\t}\n\
\n\
\tkeys = splitKeypath( ref );\n\
\tlastKey = keys.pop();\n\
\n\
\t// Clone the context stack, so we don't mutate the original\n\
\tcontextStack = contextStack.concat();\n\
\n\
\t// Take each context from the stack, working backwards from the innermost context\n\
\twhile ( contextStack.length ) {\n\
\n\
\t\tinnerMostContext = contextStack.pop();\n\
\t\tcontextKeys = splitKeypath( innerMostContext );\n\
\n\
\t\tparentValue = ractive.get( contextKeys.concat( keys ) );\n\
\n\
\t\tif ( typeof parentValue === 'object' && parentValue !== null && hasOwn.call( parentValue, lastKey ) ) {\n\
\t\t\tkeypath = innerMostContext + '.' + ref;\n\
\t\t\tbreak;\n\
\t\t}\n\
\t}\n\
\n\
\tif ( !keypath && ractive.get( ref ) !== undefined ) {\n\
\t\tkeypath = ref;\n\
\t}\n\
\n\
\treturn keypath;\n\
};\n\
teardown = function ( thing ) {\n\
\tif ( !thing.keypath ) {\n\
\t\t// this was on the 'unresolved' list, we need to remove it\n\
\t\tvar index = thing.root._pendingResolution.indexOf( thing );\n\
\n\
\t\tif ( index !== -1 ) {\n\
\t\t\tthing.root._pendingResolution.splice( index, 1 );\n\
\t\t}\n\
\n\
\t} else {\n\
\t\t// this was registered as a dependant\n\
\t\tunregisterDependant( thing );\n\
\t}\n\
};\n\
unregisterDependant = function ( dependant ) {\n\
\tvar deps, i, keep, keys, parentKeypath, map, evaluator, ractive, keypath, priority;\n\
\n\
\tractive = dependant.root;\n\
\tkeypath = dependant.keypath;\n\
\tpriority = dependant.priority;\n\
\n\
\tdeps = ractive._deps[ priority ][ keypath ];\n\
\tdeps.splice( deps.indexOf( dependant ), 1 );\n\
\n\
\t// update dependants map\n\
\tkeys = splitKeypath( keypath );\n\
\t\n\
\twhile ( keys.length ) {\n\
\t\tkeys.pop();\n\
\t\tparentKeypath = keys.join( '.' );\n\
\t\n\
\t\tmap = ractive._depsMap[ parentKeypath ];\n\
\n\
\t\tmap[ keypath ] -= 1;\n\
\n\
\t\tif ( !map[ keypath ] ) {\n\
\t\t\t// remove from parent deps map\n\
\t\t\tmap.splice( map.indexOf( keypath ), 1 );\n\
\t\t\tmap[ keypath ] = undefined;\n\
\t\t}\n\
\n\
\t\tkeypath = parentKeypath;\n\
\t}\n\
};\n\
proto.link = function ( keypath ) {\n\
\tvar self = this;\n\
\n\
\treturn function ( value ) {\n\
\t\tself.set( keypath, value );\n\
\t};\n\
};\n\
(function ( proto ) {\n\
\n\
\tvar observe, Observer, updateObserver;\n\
\n\
\tproto.observe = function ( keypath, callback, options ) {\n\
\n\
\t\tvar observers = [], k;\n\
\n\
\t\tif ( typeof keypath === 'object' ) {\n\
\t\t\toptions = callback;\n\
\n\
\t\t\tfor ( k in keypath ) {\n\
\t\t\t\tif ( hasOwn.call( keypath, k ) ) {\n\
\t\t\t\t\tcallback = keypath[k];\n\
\t\t\t\t\tobservers[ observers.length ] = observe( this, k, callback, options );\n\
\t\t\t\t}\n\
\t\t\t}\n\
\n\
\t\t\treturn {\n\
\t\t\t\tcancel: function () {\n\
\t\t\t\t\twhile ( observers.length ) {\n\
\t\t\t\t\t\tobservers.pop().cancel();\n\
\t\t\t\t\t}\n\
\t\t\t\t}\n\
\t\t\t};\n\
\t\t}\n\
\n\
\t\treturn observe( this, keypath, callback, options );\n\
\t};\n\
\n\
\tobserve = function ( root, keypath, callback, options ) {\n\
\t\tvar observer;\n\
\n\
\t\tobserver = new Observer( root, keypath, callback, options );\n\
\n\
\t\tif ( !options || options.init !== false ) {\n\
\t\t\tobserver.update( true );\n\
\t\t}\n\
\n\
\t\tregisterDependant( observer );\n\
\n\
\t\treturn {\n\
\t\t\tcancel: function () {\n\
\t\t\t\tunregisterDependant( observer );\n\
\t\t\t}\n\
\t\t};\n\
\t};\n\
\n\
\tObserver = function ( root, keypath, callback, options ) {\n\
\t\tthis.root = root;\n\
\t\tthis.keypath = keypath;\n\
\t\tthis.callback = callback;\n\
\t\tthis.priority = 0; // observers get top priority\n\
\n\
\t\t// default to root as context, but allow it to be overridden\n\
\t\tthis.context = ( options && options.context ? options.context : root );\n\
\t};\n\
\n\
\tObserver.prototype = {\n\
\t\tupdate: function ( init ) {\n\
\t\t\tvar value;\n\
\n\
\t\t\t// TODO create, and use, an internal get method instead - we can skip checks\n\
\t\t\tvalue = this.root.get( this.keypath, true );\n\
\n\
\t\t\tif ( !isEqual( value, this.value ) || init ) {\n\
\t\t\t\t// wrap the callback in a try-catch block, and only throw error in\n\
\t\t\t\t// debug mode\n\
\t\t\t\ttry {\n\
\t\t\t\t\tthis.callback.call( this.context, value, this.value );\n\
\t\t\t\t} catch ( err ) {\n\
\t\t\t\t\tif ( this.root.debug ) {\n\
\t\t\t\t\t\tthrow err;\n\
\t\t\t\t\t}\n\
\t\t\t\t}\n\
\t\t\t\tthis.value = value;\n\
\t\t\t}\n\
\t\t}\n\
\t};\n\
\n\
}( proto ));\n\
\n\
\n\
proto.off = function ( eventName, callback ) {\n\
\tvar subscribers, index;\n\
\n\
\t// if no callback specified, remove all callbacks\n\
\tif ( !callback ) {\n\
\t\t// if no event name specified, remove all callbacks for all events\n\
\t\tif ( !eventName ) {\n\
\t\t\tthis._subs = {};\n\
\t\t} else {\n\
\t\t\tthis._subs[ eventName ] = [];\n\
\t\t}\n\
\t}\n\
\n\
\tsubscribers = this._subs[ eventName ];\n\
\n\
\tif ( subscribers ) {\n\
\t\tindex = subscribers.indexOf( callback );\n\
\t\tif ( index !== -1 ) {\n\
\t\t\tsubscribers.splice( index, 1 );\n\
\t\t}\n\
\t}\n\
};\n\
proto.on = function ( eventName, callback ) {\n\
\tvar self = this, listeners, n;\n\
\n\
\t// allow mutliple listeners to be bound in one go\n\
\tif ( typeof eventName === 'object' ) {\n\
\t\tlisteners = [];\n\
\n\
\t\tfor ( n in eventName ) {\n\
\t\t\tif ( hasOwn.call( eventName, n ) ) {\n\
\t\t\t\tlisteners[ listeners.length ] = this.on( n, eventName[ n ] );\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\treturn {\n\
\t\t\tcancel: function () {\n\
\t\t\t\twhile ( listeners.length ) {\n\
\t\t\t\t\tlisteners.pop().cancel();\n\
\t\t\t\t}\n\
\t\t\t}\n\
\t\t};\n\
\t}\n\
\n\
\tif ( !this._subs[ eventName ] ) {\n\
\t\tthis._subs[ eventName ] = [ callback ];\n\
\t} else {\n\
\t\tthis._subs[ eventName ].push( callback );\n\
\t}\n\
\n\
\treturn {\n\
\t\tcancel: function () {\n\
\t\t\tself.off( eventName, callback );\n\
\t\t}\n\
\t};\n\
};\n\
proto.renderHTML = function () {\n\
\treturn this.fragment.toString();\n\
};\n\
proto.requestFullscreen = function () {\n\
\tRactive.requestFullscreen( this.el );\n\
};\n\
(function ( proto ) {\n\
\n\
\tvar set, attemptKeypathResolution;\n\
\n\
\tproto.set = function ( keypath, value, complete ) {\n\
\t\tvar notificationQueue, upstreamQueue, k, normalised, keys, previous, previousTransitionManager, transitionManager;\n\
\n\
\t\tupstreamQueue = [ '' ]; // empty string will always be an upstream keypath\n\
\t\tnotificationQueue = [];\n\
\n\
\t\tif ( isObject( keypath ) ) {\n\
\t\t\tcomplete = value;\n\
\t\t}\n\
\n\
\t\t// manage transitions\n\
\t\tpreviousTransitionManager = this._transitionManager;\n\
\t\tthis._transitionManager = transitionManager = makeTransitionManager( this, complete );\n\
\n\
\t\t// setting multiple values in one go\n\
\t\tif ( isObject( keypath ) ) {\n\
\t\t\tfor ( k in keypath ) {\n\
\t\t\t\tif ( hasOwn.call( keypath, k ) ) {\n\
\t\t\t\t\tkeys = splitKeypath( k );\n\
\t\t\t\t\tnormalised = keys.join( '.' );\n\
\t\t\t\t\tvalue = keypath[k];\n\
\n\
\t\t\t\t\tset( this, normalised, keys, value, notificationQueue, upstreamQueue );\n\
\t\t\t\t}\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\t// setting a single value\n\
\t\telse {\n\
\t\t\tkeys = splitKeypath( keypath );\n\
\t\t\tnormalised = keys.join( '.' );\n\
\n\
\t\t\tset( this, normalised, keys, value, notificationQueue, upstreamQueue );\n\
\t\t}\n\
\n\
\t\t// if anything has changed, attempt to resolve any unresolved keypaths...\n\
\t\tif ( notificationQueue.length && this._pendingResolution.length ) {\n\
\t\t\tattemptKeypathResolution( this );\n\
\t\t}\n\
\n\
\t\t// ...and notify dependants\n\
\t\tif ( upstreamQueue.length ) {\n\
\t\t\tnotifyMultipleDependants( this, upstreamQueue, true );\n\
\t\t}\n\
\n\
\t\tif ( notificationQueue.length ) {\n\
\t\t\tnotifyMultipleDependants( this, notificationQueue );\n\
\t\t}\n\
\n\
\t\t// Attributes don't reflect changes automatically if there is a possibility\n\
\t\t// that they will need to change again before the .set() cycle is complete\n\
\t\t// - they defer their updates until all values have been set\n\
\t\tprocessDeferredUpdates( this );\n\
\n\
\t\t// transition manager has finished its work\n\
\t\tthis._transitionManager = previousTransitionManager;\n\
\t\ttransitionManager.ready();\n\
\n\
\t\t// fire event\n\
\t\tif ( !this.setting ) {\n\
\t\t\tthis.setting = true; // short-circuit any potential infinite loops\n\
\t\t\t\n\
\t\t\tif ( typeof keypath === 'object' ) {\n\
\t\t\t\tthis.fire( 'set', keypath );\n\
\t\t\t} else {\n\
\t\t\t\tthis.fire( 'set', keypath, value );\n\
\t\t\t}\n\
\n\
\t\t\tthis.setting = false;\n\
\t\t}\n\
\n\
\t\treturn this;\n\
\t};\n\
\n\
\n\
\tset = function ( root, keypath, keys, value, queue, upstreamQueue ) {\n\
\t\tvar previous, key, obj, keysClone, accumulated, keypathToClear;\n\
\n\
\t\tkeysClone = keys.slice();\n\
\t\taccumulated = [];\n\
\n\
\t\tprevious = root.get( keypath );\n\
\n\
\t\t// update the model, if necessary\n\
\t\tif ( previous !== value ) {\n\
\t\t\t// update data\n\
\t\t\tobj = root.data;\n\
\t\t\twhile ( keys.length > 1 ) {\n\
\t\t\t\tkey = accumulated[ accumulated.length ] = keys.shift();\n\
\n\
\t\t\t\t// If this branch doesn't exist yet, create a new one - if the next\n\
\t\t\t\t// key matches /^\\s*[0-9]+\\s*$/, assume we want an array branch rather\n\
\t\t\t\t// than an object\n\
\t\t\t\tif ( !obj[ key ] ) {\n\
\t\t\t\t\t\n\
\t\t\t\t\t// if we're creating a new branch, we may need to clear the upstream\n\
\t\t\t\t\t// keypath\n\
\t\t\t\t\tif ( !keypathToClear ) {\n\
\t\t\t\t\t\tkeypathToClear = accumulated.join( '.' );\n\
\t\t\t\t\t}\n\
\n\
\t\t\t\t\tobj[ key ] = ( /^\\s*[0-9]+\\s*$/.test( keys[0] ) ? [] : {} );\n\
\t\t\t\t}\n\
\n\
\t\t\t\tobj = obj[ key ];\n\
\t\t\t}\n\
\n\
\t\t\tkey = keys[0];\n\
\n\
\t\t\tobj[ key ] = value;\n\
\t\t}\n\
\n\
\t\telse {\n\
\t\t\t// if value is a primitive, we don't need to do anything else\n\
\t\t\tif ( typeof value !== 'object' ) {\n\
\t\t\t\treturn;\n\
\t\t\t}\n\
\t\t}\n\
\n\
\n\
\t\t// Clear cache\n\
\t\tclearCache( root, keypathToClear || keypath );\n\
\n\
\t\t// add this keypath to the notification queue\n\
\t\tqueue[ queue.length ] = keypath;\n\
\n\
\n\
\t\t// add upstream keypaths to the upstream notification queue\n\
\t\twhile ( keysClone.length > 1 ) {\n\
\t\t\tkeysClone.pop();\n\
\t\t\tkeypath = keysClone.join( '.' );\n\
\n\
\t\t\tif ( upstreamQueue.indexOf( keypath ) === -1 ) {\n\
\t\t\t\tupstreamQueue[ upstreamQueue.length ] = keypath;\n\
\t\t\t}\n\
\t\t}\n\
\t\t\n\
\t};\n\
\n\
\tattemptKeypathResolution = function ( root ) {\n\
\t\tvar i, unresolved, keypath;\n\
\n\
\t\t// See if we can resolve any of the unresolved keypaths (if such there be)\n\
\t\ti = root._pendingResolution.length;\n\
\t\twhile ( i-- ) { // Work backwards, so we don't go in circles!\n\
\t\t\tunresolved = root._pendingResolution.splice( i, 1 )[0];\n\
\n\
\t\t\tif ( keypath = resolveRef( root, unresolved.ref, unresolved.contextStack ) ) {\n\
\t\t\t\t// If we've resolved the keypath, we can initialise this item\n\
\t\t\t\tunresolved.resolve( keypath );\n\
\n\
\t\t\t} else {\n\
\t\t\t\t// If we can't resolve the reference, add to the back of\n\
\t\t\t\t// the queue (this is why we're working backwards)\n\
\t\t\t\troot._pendingResolution[ root._pendingResolution.length ] = unresolved;\n\
\t\t\t}\n\
\t\t}\n\
\t};\n\
\n\
}( proto ));\n\
// Teardown. This goes through the root fragment and all its children, removing observers\n\
// and generally cleaning up after itself\n\
proto.teardown = function ( complete ) {\n\
\tvar keypath, transitionManager, previousTransitionManager;\n\
\n\
\tthis.fire( 'teardown' );\n\
\n\
\tpreviousTransitionManager = this._transitionManager;\n\
\tthis._transitionManager = transitionManager = makeTransitionManager( this, complete );\n\
\n\
\tthis.fragment.teardown( true );\n\
\n\
\t// Cancel any animations in progress\n\
\twhile ( this._animations[0] ) {\n\
\t\tthis._animations[0].stop(); // it will remove itself from the index\n\
\t}\n\
\n\
\t// Clear cache - this has the side-effect of unregistering keypaths from modified arrays.\n\
\tfor ( keypath in this._cache ) {\n\
\t\tclearCache( this, keypath );\n\
\t}\n\
\n\
\t// Teardown any bindings\n\
\twhile ( this._bound.length ) {\n\
\t\tthis.unbind( this._bound.pop() );\n\
\t}\n\
\n\
\t// transition manager has finished its work\n\
\tthis._transitionManager = previousTransitionManager;\n\
\ttransitionManager.ready();\n\
};\n\
proto.toggleFullscreen = function () {\n\
\tif ( Ractive.isFullscreen( this.el ) ) {\n\
\t\tthis.cancelFullscreen();\n\
\t} else {\n\
\t\tthis.requestFullscreen();\n\
\t}\n\
};\n\
proto.unbind = function ( adaptor ) {\n\
\tvar bound = this._bound, index;\n\
\n\
\tindex = bound.indexOf( adaptor );\n\
\n\
\tif ( index !== -1 ) {\n\
\t\tbound.splice( index, 1 );\n\
\t\tadaptor.teardown( this );\n\
\t}\n\
};\n\
proto.update = function ( keypath, complete ) {\n\
\tvar transitionManager, previousTransitionManager;\n\
\n\
\tif ( typeof keypath === 'function' ) {\n\
\t\tcomplete = keypath;\n\
\t}\n\
\n\
\t// manage transitions\n\
\tpreviousTransitionManager = this._transitionManager;\n\
\tthis._transitionManager = transitionManager = makeTransitionManager( this, complete );\n\
\n\
\tclearCache( this, keypath || '' );\n\
\tnotifyDependants( this, keypath || '' );\n\
\n\
\tprocessDeferredUpdates( this );\n\
\n\
\t// transition manager has finished its work\n\
\tthis._transitionManager = previousTransitionManager;\n\
\ttransitionManager.ready();\n\
\n\
\tif ( typeof keypath === 'string' ) {\n\
\t\tthis.fire( 'update', keypath );\n\
\t} else {\n\
\t\tthis.fire( 'update' );\n\
\t}\n\
\n\
\treturn this;\n\
};\n\
adaptors.backbone = function ( model, path ) {\n\
\tvar settingModel, settingView, setModel, setView, pathMatcher, pathLength, prefix;\n\
\n\
\tif ( path ) {\n\
\t\tpath += '.';\n\
\t\tpathMatcher = new RegExp( '^' + path.replace( /\\./g, '\\\\.' ) );\n\
\t\tpathLength = path.length;\n\
\t}\n\
\n\
\n\
\treturn {\n\
\t\tinit: function ( view ) {\n\
\t\t\t\n\
\t\t\t// if no path specified...\n\
\t\t\tif ( !path ) {\n\
\t\t\t\tsetView = function ( model ) {\n\
\t\t\t\t\tif ( !settingModel ) {\n\
\t\t\t\t\t\tsettingView = true;\n\
\t\t\t\t\t\tview.set( model.changed );\n\
\t\t\t\t\t\tsettingView = false;\n\
\t\t\t\t\t}\n\
\t\t\t\t};\n\
\n\
\t\t\t\tsetModel = function ( keypath, value ) {\n\
\t\t\t\t\tif ( !settingView ) {\n\
\t\t\t\t\t\tsettingModel = true;\n\
\t\t\t\t\t\tmodel.set( keypath, value );\n\
\t\t\t\t\t\tsettingModel = false;\n\
\t\t\t\t\t}\n\
\t\t\t\t};\n\
\t\t\t}\n\
\n\
\t\t\telse {\n\
\t\t\t\tprefix = function ( attrs ) {\n\
\t\t\t\t\tvar attr, result;\n\
\n\
\t\t\t\t\tresult = {};\n\
\n\
\t\t\t\t\tfor ( attr in attrs ) {\n\
\t\t\t\t\t\tif ( hasOwn.call( attrs, attr ) ) {\n\
\t\t\t\t\t\t\tresult[ path + attr ] = attrs[ attr ];\n\
\t\t\t\t\t\t}\n\
\t\t\t\t\t}\n\
\n\
\t\t\t\t\treturn result;\n\
\t\t\t\t};\n\
\n\
\t\t\t\tsetView = function ( model ) {\n\
\t\t\t\t\tif ( !settingModel ) {\n\
\t\t\t\t\t\tsettingView = true;\n\
\t\t\t\t\t\tview.set( prefix( model.changed ) );\n\
\t\t\t\t\t\tsettingView = false;\n\
\t\t\t\t\t}\n\
\t\t\t\t};\n\
\n\
\t\t\t\tsetModel = function ( keypath, value ) {\n\
\t\t\t\t\tif ( !settingView ) {\n\
\t\t\t\t\t\tif ( pathMatcher.test( keypath ) ) {\n\
\t\t\t\t\t\t\tsettingModel = true;\n\
\t\t\t\t\t\t\tmodel.set( keypath.substring( pathLength ), value );\n\
\t\t\t\t\t\t\tsettingModel = false;\n\
\t\t\t\t\t\t}\n\
\t\t\t\t\t}\n\
\t\t\t\t};\n\
\t\t\t}\n\
\n\
\t\t\tmodel.on( 'change', setView );\n\
\t\t\tview.on( 'set', setModel );\n\
\t\t\t\n\
\t\t\t// initialise\n\
\t\t\tview.set( path ? prefix( model.attributes ) : model.attributes );\n\
\t\t},\n\
\n\
\t\tteardown: function ( view ) {\n\
\t\t\tmodel.off( 'change', setView );\n\
\t\t\tview.off( 'set', setModel );\n\
\t\t}\n\
\t};\n\
};\n\
adaptors.statesman = function ( model, path ) {\n\
\tvar settingModel, settingView, setModel, setView, pathMatcher, pathLength, prefix;\n\
\n\
\tif ( path ) {\n\
\t\tpath += '.';\n\
\t\tpathMatcher = new RegExp( '^' + path.replace( /\\./g, '\\\\.' ) );\n\
\t\tpathLength = path.length;\n\
\n\
\t\tprefix = function ( attrs ) {\n\
\t\t\tvar attr, result;\n\
\n\
\t\t\tif ( !attrs ) {\n\
\t\t\t\treturn;\n\
\t\t\t}\n\
\n\
\t\t\tresult = {};\n\
\n\
\t\t\tfor ( attr in attrs ) {\n\
\t\t\t\tif ( hasOwn.call( attrs, attr ) ) {\n\
\t\t\t\t\tresult[ path + attr ] = attrs[ attr ];\n\
\t\t\t\t}\n\
\t\t\t}\n\
\n\
\t\t\treturn result;\n\
\t\t};\n\
\t}\n\
\n\
\n\
\treturn {\n\
\t\tinit: function ( view ) {\n\
\t\t\t\n\
\t\t\tvar data;\n\
\n\
\t\t\t// if no path specified...\n\
\t\t\tif ( !path ) {\n\
\t\t\t\tsetView = function ( change ) {\n\
\t\t\t\t\tif ( !settingModel ) {\n\
\t\t\t\t\t\tsettingView = true;\n\
\t\t\t\t\t\t\n\
\t\t\t\t\t\tview.set( change );\n\
\t\t\t\t\t\t\n\
\t\t\t\t\t\tsettingView = false;\n\
\t\t\t\t\t}\n\
\t\t\t\t};\n\
\n\
\t\t\t\tif ( view.twoway ) {\n\
\t\t\t\t\tsetModel = function ( keypath, value ) {\n\
\t\t\t\t\t\tif ( !settingView ) {\n\
\t\t\t\t\t\t\tsettingModel = true;\n\
\t\t\t\t\t\t\tmodel.set( keypath, value );\n\
\t\t\t\t\t\t\tsettingModel = false;\n\
\t\t\t\t\t\t}\n\
\t\t\t\t\t};\n\
\t\t\t\t}\n\
\t\t\t}\n\
\n\
\t\t\telse {\n\
\t\t\t\tsetView = function ( change ) {\n\
\t\t\t\t\tif ( !settingModel ) {\n\
\t\t\t\t\t\tsettingView = true;\n\
\t\t\t\t\t\t\n\
\t\t\t\t\t\tchange = prefix( change );\n\
\t\t\t\t\t\tview.set( change );\n\
\t\t\t\t\t\t\n\
\t\t\t\t\t\tsettingView = false;\n\
\t\t\t\t\t}\n\
\t\t\t\t};\n\
\n\
\t\t\t\tif ( view.twoway ) {\n\
\t\t\t\t\tsetModel = function ( keypath, value ) {\n\
\t\t\t\t\t\tif ( !settingView ) {\n\
\t\t\t\t\t\t\tif ( pathMatcher.test( keypath ) ) {\n\
\t\t\t\t\t\t\t\tsettingModel = true;\n\
\t\t\t\t\t\t\t\tmodel.set( keypath.substring( pathLength ), value );\n\
\t\t\t\t\t\t\t\tsettingModel = false;\n\
\t\t\t\t\t\t\t}\n\
\t\t\t\t\t\t}\n\
\t\t\t\t\t};\n\
\t\t\t\t}\n\
\t\t\t}\n\
\n\
\t\t\tmodel.on( 'change', setView );\n\
\t\n\
\t\t\tif ( view.twoway ) {\n\
\t\t\t\tview.on( 'set', setModel );\n\
\t\t\t}\n\
\t\t\t\n\
\t\t\t// initialise\n\
\t\t\tdata = ( path ? prefix( model.get() ) : model.get() );\n\
\n\
\t\t\tif ( data ) {\n\
\t\t\t\tview.set( path ? prefix( model.get() ) : model.get() );\n\
\t\t\t}\n\
\t\t},\n\
\n\
\t\tteardown: function ( view ) {\n\
\t\t\tmodel.off( 'change', setView );\n\
\t\t\tview.off( 'set', setModel );\n\
\t\t}\n\
\t};\n\
};\n\
// These are a subset of the easing equations found at\n\
// https://raw.github.com/danro/easing-js - license info\n\
// follows:\n\
\n\
// --------------------------------------------------\n\
// easing.js v0.5.4\n\
// Generic set of easing functions with AMD support\n\
// https://github.com/danro/easing-js\n\
// This code may be freely distributed under the MIT license\n\
// http://danro.mit-license.org/\n\
// --------------------------------------------------\n\
// All functions adapted from Thomas Fuchs & Jeremy Kahn\n\
// Easing Equations (c) 2003 Robert Penner, BSD license\n\
// https://raw.github.com/danro/easing-js/master/LICENSE\n\
// --------------------------------------------------\n\
\n\
// In that library, the functions named easeIn, easeOut, and\n\
// easeInOut below are named easeInCubic, easeOutCubic, and\n\
// (you guessed it) easeInOutCubic.\n\
//\n\
// You can add additional easing functions to this list, and they\n\
// will be globally available.\n\
\n\
easing = {\n\
\tlinear: function ( pos ) { return pos; },\n\
\teaseIn: function ( pos ) { return Math.pow( pos, 3 ); },\n\
\teaseOut: function ( pos ) { return ( Math.pow( ( pos - 1 ), 3 ) + 1 ); },\n\
\teaseInOut: function ( pos ) {\n\
\t\tif ( ( pos /= 0.5 ) < 1 ) { return ( 0.5 * Math.pow( pos, 3 ) ); }\n\
\t\treturn ( 0.5 * ( Math.pow( ( pos - 2 ), 3 ) + 2 ) );\n\
\t}\n\
};\n\
eventDefinitions.hover = function ( node, fire ) {\n\
\tvar mouseoverHandler, mouseoutHandler;\n\
\n\
\tmouseoverHandler = function ( event ) {\n\
\t\tfire({\n\
\t\t\tnode: node,\n\
\t\t\toriginal: event,\n\
\t\t\thover: true\n\
\t\t});\n\
\t};\n\
\n\
\tmouseoutHandler = function ( event ) {\n\
\t\tfire({\n\
\t\t\tnode: node,\n\
\t\t\toriginal: event,\n\
\t\t\thover: false\n\
\t\t});\n\
\t};\n\
\n\
\tnode.addEventListener( 'mouseover', mouseoverHandler, false );\n\
\tnode.addEventListener( 'mouseout', mouseoutHandler, false );\n\
\n\
\treturn {\n\
\t\tteardown: function () {\n\
\t\t\tnode.removeEventListener( 'mouseover', mouseoverHandler, false );\n\
\t\t\tnode.removeEventListener( 'mouseout', mouseoutHandler, false );\n\
\t\t}\n\
\t};\n\
};\n\
(function () {\n\
\n\
\tvar makeKeyDefinition = function ( code ) {\n\
\t\treturn function ( node, fire ) {\n\
\t\t\tvar keydownHandler;\n\
\n\
\t\t\tnode.addEventListener( 'keydown', keydownHandler = function ( event ) {\n\
\t\t\t\tvar which = event.which || event.keyCode;\n\
\n\
\t\t\t\tif ( which === code ) {\n\
\t\t\t\t\tevent.preventDefault();\n\
\n\
\t\t\t\t\tfire({\n\
\t\t\t\t\t\tnode: node,\n\
\t\t\t\t\t\toriginal: event\n\
\t\t\t\t\t});\n\
\t\t\t\t}\n\
\t\t\t}, false );\n\
\n\
\t\t\treturn {\n\
\t\t\t\tteardown: function () {\n\
\t\t\t\t\tnode.removeEventListener( 'keydown', keydownHandler, false );\n\
\t\t\t\t}\n\
\t\t\t};\n\
\t\t};\n\
\t};\n\
\n\
\teventDefinitions.enter = makeKeyDefinition( 13 );\n\
\teventDefinitions.tab = makeKeyDefinition( 9 );\n\
\teventDefinitions.escape = makeKeyDefinition( 27 );\n\
\teventDefinitions.space = makeKeyDefinition( 32 );\n\
\n\
}());\n\
eventDefinitions.tap = function ( node, fire ) {\n\
\tvar mousedown, touchstart, distanceThreshold, timeThreshold;\n\
\n\
\tdistanceThreshold = 5; // maximum pixels pointer can move before cancel\n\
\ttimeThreshold = 400;   // maximum milliseconds between down and up before cancel\n\
\n\
\tmousedown = function ( event ) {\n\
\t\tvar currentTarget, x, y, up, move, cancel;\n\
\n\
\t\tif ( event.which != 1) {\n\
\t\t\treturn;\n\
\t\t}\n\
\n\
\t\tx = event.clientX;\n\
\t\ty = event.clientY;\n\
\t\tcurrentTarget = this;\n\
\n\
\t\tup = function ( event ) {\n\
\t\t\tfire({\n\
\t\t\t\tnode: currentTarget,\n\
\t\t\t\toriginal: event\n\
\t\t\t});\n\
\n\
\t\t\tcancel();\n\
\t\t};\n\
\n\
\t\tmove = function ( event ) {\n\
\t\t\tif ( ( Math.abs( event.clientX - x ) >= distanceThreshold ) || ( Math.abs( event.clientY - y ) >= distanceThreshold ) ) {\n\
\t\t\t\tcancel();\n\
\t\t\t}\n\
\t\t};\n\
\n\
\t\tcancel = function () {\n\
\t\t\tnode.removeEventListener( 'click', up, false );\n\
\t\t\tdoc.removeEventListener( 'mousemove', move, false );\n\
\t\t};\n\
\n\
\t\tnode.addEventListener( 'click', up, false );\n\
\t\tdoc.addEventListener( 'mousemove', move, false );\n\
\n\
\t\tsetTimeout( cancel, timeThreshold );\n\
\t};\n\
\n\
\tnode.addEventListener( 'mousedown', mousedown, false );\n\
\n\
\n\
\ttouchstart = function ( event ) {\n\
\t\tvar currentTarget, x, y, touch, finger, move, up, cancel;\n\
\n\
\t\tif ( event.touches.length !== 1 ) {\n\
\t\t\treturn;\n\
\t\t}\n\
\n\
\t\ttouch = event.touches[0];\n\
\n\
\t\tx = touch.clientX;\n\
\t\ty = touch.clientY;\n\
\t\tcurrentTarget = this;\n\
\n\
\t\tfinger = touch.identifier;\n\
\n\
\t\tup = function ( event ) {\n\
\t\t\tvar touch;\n\
\n\
\t\t\ttouch = event.changedTouches[0];\n\
\t\t\tif ( touch.identifier !== finger ) {\n\
\t\t\t\tcancel();\n\
\t\t\t}\n\
\n\
\t\t\tevent.preventDefault();  // prevent compatibility mouse event\n\
\t\t\tfire({\n\
\t\t\t\tnode: currentTarget,\n\
\t\t\t\toriginal: event\n\
\t\t\t});\n\
\t\t\t\n\
\t\t\tcancel();\n\
\t\t};\n\
\n\
\t\tmove = function ( event ) {\n\
\t\t\tvar touch;\n\
\n\
\t\t\tif ( event.touches.length !== 1 || event.touches[0].identifier !== finger ) {\n\
\t\t\t\tcancel();\n\
\t\t\t}\n\
\n\
\t\t\ttouch = event.touches[0];\n\
\t\t\tif ( ( Math.abs( touch.clientX - x ) >= distanceThreshold ) || ( Math.abs( touch.clientY - y ) >= distanceThreshold ) ) {\n\
\t\t\t\tcancel();\n\
\t\t\t}\n\
\t\t};\n\
\n\
\t\tcancel = function () {\n\
\t\t\tnode.removeEventListener( 'touchend', up, false );\n\
\t\t\twindow.removeEventListener( 'touchmove', move, false );\n\
\t\t\twindow.removeEventListener( 'touchcancel', cancel, false );\n\
\t\t};\n\
\n\
\t\tnode.addEventListener( 'touchend', up, false );\n\
\t\twindow.addEventListener( 'touchmove', move, false );\n\
\t\twindow.addEventListener( 'touchcancel', cancel, false );\n\
\n\
\t\tsetTimeout( cancel, timeThreshold );\n\
\t};\n\
\n\
\tnode.addEventListener( 'touchstart', touchstart, false );\n\
\n\
\n\
\treturn {\n\
\t\tteardown: function () {\n\
\t\t\tnode.removeEventListener( 'mousedown', mousedown, false );\n\
\t\t\tnode.removeEventListener( 'touchstart', touchstart, false );\n\
\t\t}\n\
\t};\n\
};\n\
\n\
(function () {\n\
\n\
\tvar fillGaps,\n\
\t\tclone,\n\
\t\taugment,\n\
\n\
\t\tinheritFromParent,\n\
\t\twrapMethod,\n\
\t\tinheritFromChildProps,\n\
\t\tconditionallyParseTemplate,\n\
\t\textractInlinePartials,\n\
\t\tconditionallyParsePartials,\n\
\t\tinitChildInstance,\n\
\n\
\t\textendable,\n\
\t\tinheritable,\n\
\t\tblacklist;\n\
\n\
\textend = function ( childProps ) {\n\
\n\
\t\tvar Parent, Child, key, template, partials, partial, member;\n\
\n\
\t\tParent = this;\n\
\n\
\t\t// create Child constructor\n\
\t\tChild = function ( options ) {\n\
\t\t\tinitChildInstance( this, Child, options || {});\n\
\t\t};\n\
\n\
\t\tChild.prototype = create( Parent.prototype );\n\
\n\
\t\t// inherit options from parent, if we're extending a subclass\n\
\t\tif ( Parent !== Ractive ) {\n\
\t\t\tinheritFromParent( Child, Parent );\n\
\t\t}\n\
\n\
\t\t// apply childProps\n\
\t\tinheritFromChildProps( Child, childProps );\n\
\n\
\t\t// parse template and any partials that need it\n\
\t\tconditionallyParseTemplate( Child );\n\
\t\textractInlinePartials( Child, childProps );\n\
\t\tconditionallyParsePartials( Child );\n\
\t\t\n\
\t\tChild.extend = Parent.extend;\n\
\n\
\t\treturn Child;\n\
\t};\n\
\n\
\textendable = [ 'data', 'partials', 'transitions', 'eventDefinitions', 'components' ];\n\
\tinheritable = [ 'el', 'template', 'complete', 'modifyArrays', 'twoway', 'lazy', 'append', 'preserveWhitespace', 'sanitize', 'noIntro', 'transitionsEnabled' ];\n\
\tblacklist = extendable.concat( inheritable );\n\
\n\
\tinheritFromParent = function ( Child, Parent ) {\n\
\t\textendable.forEach( function ( property ) {\n\
\t\t\tif ( Parent[ property ] ) {\n\
\t\t\t\tChild[ property ] = clone( Parent[ property ] );\n\
\t\t\t}\n\
\t\t});\n\
\n\
\t\tinheritable.forEach( function ( property ) {\n\
\t\t\tif ( Parent[ property ] !== undefined ) {\n\
\t\t\t\tChild[ property ] = Parent[ property ];\n\
\t\t\t}\n\
\t\t});\n\
\t};\n\
\n\
\twrapMethod = function ( method, superMethod ) {\n\
\t\tif ( /_super/.test( method ) ) {\n\
\t\t\treturn function () {\n\
\t\t\t\tvar _super = this._super, result;\n\
\t\t\t\tthis._super = superMethod;\n\
\n\
\t\t\t\tresult = method.apply( this, arguments );\n\
\n\
\t\t\t\tthis._super = _super;\n\
\t\t\t\treturn result;\n\
\t\t\t};\n\
\t\t}\n\
\n\
\t\telse {\n\
\t\t\treturn method;\n\
\t\t}\n\
\t};\n\
\n\
\tinheritFromChildProps = function ( Child, childProps ) {\n\
\t\tvar key, member;\n\
\n\
\t\textendable.forEach( function ( property ) {\n\
\t\t\tvar value = childProps[ property ];\n\
\n\
\t\t\tif ( value ) {\n\
\t\t\t\tif ( Child[ property ] ) {\n\
\t\t\t\t\taugment( Child[ property ], value );\n\
\t\t\t\t}\n\
\n\
\t\t\t\telse {\n\
\t\t\t\t\tChild[ property ] = value;\n\
\t\t\t\t}\n\
\t\t\t}\n\
\t\t});\n\
\n\
\t\tinheritable.forEach( function ( property ) {\n\
\t\t\tif ( childProps[ property ] !== undefined ) {\n\
\t\t\t\tChild[ property ] = childProps[ property ];\n\
\t\t\t}\n\
\t\t});\n\
\n\
\t\t// Blacklisted properties don't extend the child, as they are part of the initialisation options\n\
\t\tfor ( key in childProps ) {\n\
\t\t\tif ( hasOwn.call( childProps, key ) && !hasOwn.call( Child.prototype, key ) && blacklist.indexOf( key ) === -1 ) {\n\
\t\t\t\tmember = childProps[ key ];\n\
\n\
\t\t\t\t// if this is a method that overwrites a prototype method, we may need\n\
\t\t\t\t// to wrap it\n\
\t\t\t\tif ( typeof member === 'function' && typeof Child.prototype[ key ] === 'function' ) {\n\
\t\t\t\t\tChild.prototype[ key ] = wrapMethod( member, Child.prototype[ key ] );\n\
\t\t\t\t} else {\n\
\t\t\t\t\tChild.prototype[ key ] = member;\n\
\t\t\t\t}\n\
\t\t\t}\n\
\t\t}\n\
\t};\n\
\n\
\tconditionallyParseTemplate = function ( Child ) {\n\
\t\tvar templateEl;\n\
\n\
\t\tif ( typeof Child.template === 'string' ) {\n\
\t\t\tif ( !Ractive.parse ) {\n\
\t\t\t\tthrow new Error( missingParser );\n\
\t\t\t}\n\
\n\
\t\t\tif ( Child.template.charAt( 0 ) === '#' && doc ) {\n\
\t\t\t\ttemplateEl = doc.getElementById( Child.template.substring( 1 ) );\n\
\t\t\t\tif ( templateEl && templateEl.tagName === 'SCRIPT' ) {\n\
\t\t\t\t\tChild.template = Ractive.parse( templateEl.innerHTML, Child );\n\
\t\t\t\t} else {\n\
\t\t\t\t\tthrow new Error( 'Could not find template element (' + Child.template + ')' );\n\
\t\t\t\t}\n\
\t\t\t} else {\n\
\t\t\t\tChild.template = Ractive.parse( Child.template, Child ); // all the relevant options are on Child\n\
\t\t\t}\n\
\t\t}\n\
\t};\n\
\n\
\textractInlinePartials = function ( Child, childProps ) {\n\
\t\t// does our template contain inline partials?\n\
\t\tif ( isObject( Child.template ) ) {\n\
\t\t\tif ( !Child.partials ) {\n\
\t\t\t\tChild.partials = {};\n\
\t\t\t}\n\
\n\
\t\t\t// get those inline partials\n\
\t\t\taugment( Child.partials, Child.template.partials );\n\
\n\
\t\t\t// but we also need to ensure that any explicit partials override inline ones\n\
\t\t\tif ( childProps.partials ) {\n\
\t\t\t\taugment( Child.partials, childProps.partials );\n\
\t\t\t}\n\
\n\
\t\t\t// move template to where it belongs\n\
\t\t\tChild.template = Child.template.template;\n\
\t\t}\n\
\t};\n\
\n\
\tconditionallyParsePartials = function ( Child ) {\n\
\t\tvar key, partial;\n\
\n\
\t\t// Parse partials, if necessary\n\
\t\tif ( Child.partials ) {\n\
\t\t\tfor ( key in Child.partials ) {\n\
\t\t\t\tif ( hasOwn.call( Child.partials, key ) ) {\n\
\t\t\t\t\tif ( typeof Child.partials[ key ] === 'string' ) {\n\
\t\t\t\t\t\tif ( !Ractive.parse ) {\n\
\t\t\t\t\t\t\tthrow new Error( missingParser );\n\
\t\t\t\t\t\t}\n\
\n\
\t\t\t\t\t\tpartial = Ractive.parse( Child.partials[ key ], Child );\n\
\t\t\t\t\t} else {\n\
\t\t\t\t\t\tpartial = Child.partials[ key ];\n\
\t\t\t\t\t}\n\
\n\
\t\t\t\t\tChild.partials[ key ] = partial;\n\
\t\t\t\t}\n\
\t\t\t}\n\
\t\t}\n\
\t};\n\
\n\
\tinitChildInstance = function ( child, Child, options ) {\n\
\t\tvar key, i, optionName;\n\
\n\
\t\t// Add template to options, if necessary\n\
\t\tif ( !options.template && Child.template ) {\n\
\t\t\toptions.template = Child.template;\n\
\t\t}\n\
\n\
\t\textendable.forEach( function ( property ) {\n\
\t\t\tif ( !options[ property ] ) {\n\
\t\t\t\tif ( Child[ property ] ) {\n\
\t\t\t\t\toptions[ property ] = clone( Child[ property ] );\n\
\t\t\t\t}\n\
\t\t\t} else {\n\
\t\t\t\tfillGaps( options[ property ], Child[ property ] );\n\
\t\t\t}\n\
\t\t});\n\
\t\t\n\
\t\tinheritable.forEach( function ( property ) {\n\
\t\t\tif ( options[ property ] === undefined && Child[ property ] !== undefined ) {\n\
\t\t\t\toptions[ property ] = Child[ property ];\n\
\t\t\t}\n\
\t\t});\n\
\n\
\t\tif ( child.beforeInit ) {\n\
\t\t\tchild.beforeInit.call( child, options );\n\
\t\t}\n\
\n\
\t\tRactive.call( child, options );\n\
\n\
\t\tif ( child.init ) {\n\
\t\t\tchild.init.call( child, options );\n\
\t\t}\n\
\t};\n\
\n\
\tfillGaps = function ( target, source ) {\n\
\t\tvar key;\n\
\n\
\t\tfor ( key in source ) {\n\
\t\t\tif ( hasOwn.call( source, key ) && !hasOwn.call( target, key ) ) {\n\
\t\t\t\ttarget[ key ] = source[ key ];\n\
\t\t\t}\n\
\t\t}\n\
\t};\n\
\n\
\tclone = function ( source ) {\n\
\t\tvar target = {}, key;\n\
\n\
\t\tfor ( key in source ) {\n\
\t\t\tif ( hasOwn.call( source, key ) ) {\n\
\t\t\t\ttarget[ key ] = source[ key ];\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\treturn target;\n\
\t};\n\
\n\
\taugment = function ( target, source ) {\n\
\t\tvar key;\n\
\n\
\t\tfor ( key in source ) {\n\
\t\t\tif ( hasOwn.call( source, key ) ) {\n\
\t\t\t\ttarget[ key ] = source[ key ];\n\
\t\t\t}\n\
\t\t}\n\
\t};\n\
\n\
}());\n\
// TODO short circuit values that stay the same\n\
interpolate = function ( from, to ) {\n\
\tif ( isNumeric( from ) && isNumeric( to ) ) {\n\
\t\treturn Ractive.interpolators.number( +from, +to );\n\
\t}\n\
\n\
\tif ( isArray( from ) && isArray( to ) ) {\n\
\t\treturn Ractive.interpolators.array( from, to );\n\
\t}\n\
\n\
\tif ( isObject( from ) && isObject( to ) ) {\n\
\t\treturn Ractive.interpolators.object( from, to );\n\
\t}\n\
\n\
\treturn function () { return to; };\n\
};\n\
interpolators = {\n\
\tnumber: function ( from, to ) {\n\
\t\tvar delta = to - from;\n\
\n\
\t\tif ( !delta ) {\n\
\t\t\treturn function () { return from; };\n\
\t\t}\n\
\n\
\t\treturn function ( t ) {\n\
\t\t\treturn from + ( t * delta );\n\
\t\t};\n\
\t},\n\
\n\
\tarray: function ( from, to ) {\n\
\t\tvar intermediate, interpolators, len, i;\n\
\n\
\t\tintermediate = [];\n\
\t\tinterpolators = [];\n\
\n\
\t\ti = len = Math.min( from.length, to.length );\n\
\t\twhile ( i-- ) {\n\
\t\t\tinterpolators[i] = Ractive.interpolate( from[i], to[i] );\n\
\t\t}\n\
\n\
\t\t// surplus values - don't interpolate, but don't exclude them either\n\
\t\tfor ( i=len; i<from.length; i+=1 ) {\n\
\t\t\tintermediate[i] = from[i];\n\
\t\t}\n\
\n\
\t\tfor ( i=len; i<to.length; i+=1 ) {\n\
\t\t\tintermediate[i] = to[i];\n\
\t\t}\n\
\n\
\t\treturn function ( t ) {\n\
\t\t\tvar i = len;\n\
\n\
\t\t\twhile ( i-- ) {\n\
\t\t\t\tintermediate[i] = interpolators[i]( t );\n\
\t\t\t}\n\
\n\
\t\t\treturn intermediate;\n\
\t\t};\n\
\t},\n\
\n\
\tobject: function ( from, to ) {\n\
\t\tvar properties = [], len, interpolators, intermediate, prop;\n\
\n\
\t\tintermediate = {};\n\
\t\tinterpolators = {};\n\
\n\
\t\tfor ( prop in from ) {\n\
\t\t\tif ( hasOwn.call( from, prop ) ) {\n\
\t\t\t\tif ( hasOwn.call( to, prop ) ) {\n\
\t\t\t\t\tproperties[ properties.length ] = prop;\n\
\t\t\t\t\tinterpolators[ prop ] = Ractive.interpolate( from[ prop ], to[ prop ] );\n\
\t\t\t\t}\n\
\n\
\t\t\t\telse {\n\
\t\t\t\t\tintermediate[ prop ] = from[ prop ];\n\
\t\t\t\t}\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\tfor ( prop in to ) {\n\
\t\t\tif ( hasOwn.call( to, prop ) && !hasOwn.call( from, prop ) ) {\n\
\t\t\t\tintermediate[ prop ] = to[ prop ];\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\tlen = properties.length;\n\
\n\
\t\treturn function ( t ) {\n\
\t\t\tvar i = len, prop;\n\
\n\
\t\t\twhile ( i-- ) {\n\
\t\t\t\tprop = properties[i];\n\
\n\
\t\t\t\tintermediate[ prop ] = interpolators[ prop ]( t );\n\
\t\t\t}\n\
\n\
\t\t\treturn intermediate;\n\
\t\t};\n\
\t}\n\
};\n\
var defaultOptions = createFromNull();\n\
\n\
defineProperties( defaultOptions, {\n\
\tpreserveWhitespace: { enumerable: true, value: false },\n\
\tappend:             { enumerable: true, value: false },\n\
\ttwoway:             { enumerable: true, value: true  },\n\
\tmodifyArrays:       { enumerable: true, value: true  },\n\
\tdata:               { enumerable: true, value: {}    },\n\
\tlazy:               { enumerable: true, value: false },\n\
\tdebug:              { enumerable: true, value: false },\n\
\ttransitions:        { enumerable: true, value: {}    },\n\
\teventDefinitions:   { enumerable: true, value: {}    },\n\
\tnoIntro:            { enumerable: true, value: false },\n\
\ttransitionsEnabled: { enumerable: true, value: true  }\n\
});\n\
\n\
Ractive = function ( options ) {\n\
\n\
\tvar key, partial, i, template, templateEl, parsedTemplate;\n\
\n\
\t// Options\n\
\t// -------\n\
\tfor ( key in defaultOptions ) {\n\
\t\tif ( !hasOwn.call( options, key ) ) {\n\
\t\t\toptions[ key ] = ( typeof defaultOptions[ key ] === 'object' ? {} : defaultOptions[ key ] );\n\
\t\t}\n\
\t}\n\
\n\
\n\
\t// Initialization\n\
\t// --------------\n\
\n\
\t// We use Object.defineProperties (where possible) as these should be read-only\n\
\tdefineProperties( this, {\n\
\t\t// Generate a unique identifier, for places where you'd use a weak map if it\n\
\t\t// existed\n\
\t\t_guid: {\n\
\t\t\tvalue: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {\n\
\t\t\t\tvar r, v;\n\
\n\
\t\t\t\tr = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);\n\
\t\t\t\treturn v.toString(16);\n\
\t\t\t})\n\
\t\t},\n\
\n\
\t\t// events\n\
\t\t_subs: { value: createFromNull() },\n\
\n\
\t\t// cache\n\
\t\t_cache: { value: {} }, // we need to be able to use hasOwnProperty, so can't inherit from null\n\
\t\t_cacheMap: { value: createFromNull() },\n\
\n\
\t\t// dependency graph\n\
\t\t_deps: { value: [] },\n\
\t\t_depsMap: { value: createFromNull() },\n\
\n\
\t\t// unresolved dependants\n\
\t\t_pendingResolution: { value: [] },\n\
\n\
\t\t// Create arrays for deferred attributes and evaluators\n\
\t\t_defAttrs: { value: [] },\n\
\t\t_defEvals: { value: [] },\n\
\t\t_defSelectValues: { value: [] },\n\
\n\
\t\t// Cache proxy event handlers - allows efficient reuse\n\
\t\t_proxies: { value: createFromNull() },\n\
\t\t_customProxies: { value: createFromNull() },\n\
\n\
\t\t// Keep a list of used evaluators, so we don't duplicate them\n\
\t\t_evaluators: { value: createFromNull() },\n\
\n\
\t\t// bindings\n\
\t\t_bound: { value: [] },\n\
\n\
\t\t// transition manager\n\
\t\t_transitionManager: { value: null, writable: true },\n\
\n\
\t\t// animations (so we can stop any in progress at teardown)\n\
\t\t_animations: { value: [] },\n\
\n\
\t\t// nodes registry\n\
\t\tnodes: { value: {} }\n\
\t});\n\
\n\
\t// options\n\
\tthis.modifyArrays = options.modifyArrays;\n\
\tthis.twoway = options.twoway;\n\
\tthis.lazy = options.lazy;\n\
\tthis.debug = options.debug;\n\
\n\
\tif ( options.el ) {\n\
\t\tthis.el = getEl( options.el );\n\
\t\tif ( !this.el && this.debug ) {\n\
\t\t\tthrow new Error( 'Could not find container element' );\n\
\t\t}\n\
\t}\n\
\n\
\t// add data\n\
\tthis.data = options.data || {};\n\
\t\n\
\n\
\t// Partials registry\n\
\tthis.partials = {};\n\
\n\
\t// Components registry\n\
\tthis.components = options.components || {};\n\
\n\
\t// Transition registry\n\
\tthis.transitions = options.transitions;\n\
\n\
\t// Instance-specific event definitions registry\n\
\tthis.eventDefinitions = options.eventDefinitions;\n\
\n\
\t// Set up bindings\n\
\tif ( options.bindings ) {\n\
\t\tif ( isArray( options.bindings ) ) {\n\
\t\t\tfor ( i=0; i<options.bindings.length; i+=1 ) {\n\
\t\t\t\tthis.bind( options.bindings[i] );\n\
\t\t\t}\n\
\t\t} else {\n\
\t\t\tthis.bind( options.bindings );\n\
\t\t}\n\
\t}\n\
\n\
\n\
\t// Parse template, if necessary\n\
\ttemplate = options.template;\n\
\n\
\tif ( typeof template === 'string' ) {\n\
\t\tif ( !Ractive.parse ) {\n\
\t\t\tthrow new Error( missingParser );\n\
\t\t}\n\
\n\
\t\tif ( template.charAt( 0 ) === '#' && doc ) {\n\
\t\t\t// assume this is an ID of a <script type='text/ractive'> tag\n\
\t\t\ttemplateEl = doc.getElementById( template.substring( 1 ) );\n\
\t\t\tif ( templateEl ) {\n\
\t\t\t\tparsedTemplate = Ractive.parse( templateEl.innerHTML, options );\n\
\t\t\t}\n\
\n\
\t\t\telse {\n\
\t\t\t\tthrow new Error( 'Could not find template element (' + template + ')' );\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\telse {\n\
\t\t\tparsedTemplate = Ractive.parse( template, options );\n\
\t\t}\n\
\t} else {\n\
\t\tparsedTemplate = template;\n\
\t}\n\
\n\
\t// deal with compound template\n\
\tif ( isObject( parsedTemplate ) ) {\n\
\t\tthis.partials = parsedTemplate.partials;\n\
\t\tparsedTemplate = parsedTemplate.main;\n\
\t}\n\
\n\
\t// If the template was an array with a single string member, that means\n\
\t// we can use innerHTML - we just need to unpack it\n\
\tif ( parsedTemplate && ( parsedTemplate.length === 1 ) && ( typeof parsedTemplate[0] === 'string' ) ) {\n\
\t\tparsedTemplate = parsedTemplate[0];\n\
\t}\n\
\n\
\tthis.template = parsedTemplate;\n\
\n\
\n\
\t// If we were given unparsed partials, parse them\n\
\tif ( options.partials ) {\n\
\t\tfor ( key in options.partials ) {\n\
\t\t\tif ( hasOwn.call( options.partials, key ) ) {\n\
\t\t\t\tpartial = options.partials[ key ];\n\
\n\
\t\t\t\tif ( typeof partial === 'string' ) {\n\
\t\t\t\t\tif ( !Ractive.parse ) {\n\
\t\t\t\t\t\tthrow new Error( missingParser );\n\
\t\t\t\t\t}\n\
\n\
\t\t\t\t\tpartial = Ractive.parse( partial, options );\n\
\t\t\t\t}\n\
\n\
\t\t\t\tthis.partials[ key ] = partial;\n\
\t\t\t}\n\
\t\t}\n\
\t}\n\
\n\
\t// Unpack string-based partials, if necessary\n\
\tfor ( key in this.partials ) {\n\
\t\tif ( hasOwn.call( this.partials, key ) && this.partials[ key ].length === 1 && typeof this.partials[ key ][0] === 'string' ) {\n\
\t\t\tthis.partials[ key ] = this.partials[ key ][0];\n\
\t\t}\n\
\t}\n\
\n\
\t// temporarily disable transitions, if noIntro flag is set\n\
\tthis.transitionsEnabled = ( options.noIntro ? false : options.transitionsEnabled );\n\
\n\
\trender( this, { el: this.el, append: options.append, complete: options.complete });\n\
\n\
\t// reset transitionsEnabled\n\
\tthis.transitionsEnabled = options.transitionsEnabled;\n\
};\n\
\n\
(function () {\n\
\n\
\tvar getOriginalComputedStyles, setStyle, augment, makeTransition, transform, transformsEnabled, inside, outside;\n\
\n\
\t// no point executing this code on the server\n\
\tif ( !doc ) {\n\
\t\treturn;\n\
\t}\n\
\n\
\tgetOriginalComputedStyles = function ( computedStyle, properties ) {\n\
\t\tvar original = {}, i;\n\
\n\
\t\ti = properties.length;\n\
\t\twhile ( i-- ) {\n\
\t\t\toriginal[ properties[i] ] = computedStyle[ properties[i] ];\n\
\t\t}\n\
\n\
\t\treturn original;\n\
\t};\n\
\n\
\tsetStyle = function ( node, properties, map, params ) {\n\
\t\tvar i = properties.length, prop;\n\
\n\
\t\twhile ( i-- ) {\n\
\t\t\tprop = properties[i];\n\
\t\t\tif ( map && map[ prop ] ) {\n\
\t\t\t\tif ( typeof map[ prop ] === 'function' ) {\n\
\t\t\t\t\tnode.style[ prop ] = map[ prop ]( params );\n\
\t\t\t\t} else {\n\
\t\t\t\t\tnode.style[ prop ] = map[ prop ];\n\
\t\t\t\t}\n\
\t\t\t}\n\
\n\
\t\t\telse {\n\
\t\t\t\tnode.style[ prop ] = 0;\n\
\t\t\t}\n\
\t\t}\n\
\t};\n\
\n\
\taugment = function ( target, source ) {\n\
\t\tvar key;\n\
\n\
\t\tif ( !source ) {\n\
\t\t\treturn target;\n\
\t\t}\n\
\n\
\t\tfor ( key in source ) {\n\
\t\t\tif ( hasOwn.call( source, key ) ) {\n\
\t\t\t\ttarget[ key ] = source[ key ];\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\treturn target;\n\
\t};\n\
\n\
\tif ( cssTransitionsEnabled ) {\n\
\t\tmakeTransition = function ( properties, defaults, outside, inside ) {\n\
\t\t\tif ( typeof properties === 'string' ) {\n\
\t\t\t\tproperties = [ properties ];\n\
\t\t\t}\n\
\n\
\t\t\treturn function ( node, complete, params, isIntro ) {\n\
\t\t\t\tvar transitionEndHandler, transitionStyle, computedStyle, originalComputedStyles, startTransition, originalStyle, originalOpacity, targetOpacity, duration, delay, start, end, source, target, positionStyle, visibilityStyle, stylesToRemove;\n\
\n\
\t\t\t\tparams = parseTransitionParams( params );\n\
\t\t\t\t\n\
\t\t\t\tduration = params.duration || defaults.duration;\n\
\t\t\t\teasing = hyphenate( params.easing || defaults.easing );\n\
\t\t\t\tdelay = params.delay || 0;\n\
\n\
\t\t\t\tstart = ( isIntro ? outside : inside );\n\
\t\t\t\tend = ( isIntro ? inside : outside );\n\
\n\
\t\t\t\tcomputedStyle = window.getComputedStyle( node );\n\
\t\t\t\toriginalStyle = node.getAttribute( 'style' );\n\
\n\
\t\t\t\t// if this is an intro, we need to transition TO the original styles\n\
\t\t\t\tif ( isIntro ) {\n\
\t\t\t\t\t// hide, to avoid flashes\n\
\t\t\t\t\tpositionStyle = node.style.position;\n\
\t\t\t\t\tvisibilityStyle = node.style.visibility;\n\
\t\t\t\t\tnode.style.position = 'absolute';\n\
\t\t\t\t\tnode.style.visibility = 'hidden';\n\
\n\
\t\t\t\t\t// we need to wait a beat before we can actually get values from computedStyle.\n\
\t\t\t\t\t// Yeah, I know, WTF browsers\n\
\t\t\t\t\tsetTimeout( function () {\n\
\t\t\t\t\t\tvar i, prop;\n\
\n\
\t\t\t\t\t\toriginalComputedStyles = getOriginalComputedStyles( computedStyle, properties );\n\
\t\t\t\t\t\t\n\
\t\t\t\t\t\tstart = outside;\n\
\t\t\t\t\t\tend = augment( originalComputedStyles, inside );\n\
\n\
\t\t\t\t\t\t// starting style\n\
\t\t\t\t\t\tnode.style.position = positionStyle;\n\
\t\t\t\t\t\tnode.style.visibility = visibilityStyle;\n\
\t\t\t\t\t\t\n\
\t\t\t\t\t\tsetStyle( node, properties, start, params );\n\
\n\
\t\t\t\t\t\tsetTimeout( startTransition, 0 );\n\
\t\t\t\t\t}, delay );\n\
\t\t\t\t}\n\
\n\
\t\t\t\t// otherwise we need to transition FROM them\n\
\t\t\t\telse {\n\
\t\t\t\t\tsetTimeout( function () {\n\
\t\t\t\t\t\tvar i, prop;\n\
\n\
\t\t\t\t\t\toriginalComputedStyles = getOriginalComputedStyles( computedStyle, properties );\n\
\n\
\t\t\t\t\t\tstart = augment( originalComputedStyles, inside );\n\
\t\t\t\t\t\tend = outside;\n\
\n\
\t\t\t\t\t\t// ending style\n\
\t\t\t\t\t\tsetStyle( node, properties, start, params );\n\
\n\
\t\t\t\t\t\tsetTimeout( startTransition, 0 );\n\
\t\t\t\t\t}, delay );\n\
\t\t\t\t}\n\
\n\
\t\t\t\tstartTransition = function () {\n\
\t\t\t\t\tvar i, prop;\n\
\n\
\t\t\t\t\tnode.style[ transition + 'Duration' ] = ( duration / 1000 ) + 's';\n\
\t\t\t\t\tnode.style[ transition + 'Properties' ] = properties.map( hyphenate ).join( ',' );\n\
\t\t\t\t\tnode.style[ transition + 'TimingFunction' ] = easing;\n\
\n\
\t\t\t\t\ttransitionEndHandler = function ( event ) {\n\
\t\t\t\t\t\tnode.removeEventListener( transitionend, transitionEndHandler, false );\n\
\n\
\t\t\t\t\t\tif ( isIntro ) {\n\
\t\t\t\t\t\t\tnode.setAttribute( 'style', originalStyle || '' );\n\
\t\t\t\t\t\t}\n\
\n\
\t\t\t\t\t\tcomplete();\n\
\t\t\t\t\t};\n\
\t\t\t\t\t\n\
\t\t\t\t\tnode.addEventListener( transitionend, transitionEndHandler, false );\n\
\n\
\t\t\t\t\tsetStyle( node, properties, end, params );\n\
\t\t\t\t};\n\
\t\t\t};\n\
\t\t};\n\
\n\
\t\ttransitions.slide = makeTransition([\n\
\t\t\t'height',\n\
\t\t\t'borderTopWidth',\n\
\t\t\t'borderBottomWidth',\n\
\t\t\t'paddingTop',\n\
\t\t\t'paddingBottom',\n\
\t\t\t'overflowY'\n\
\t\t], { duration: 400, easing: 'easeInOut' }, { overflowY: 'hidden' }, { overflowY: 'hidden' });\n\
\n\
\t\ttransitions.fade = makeTransition( 'opacity', {\n\
\t\t\tduration: 300,\n\
\t\t\teasing: 'linear'\n\
\t\t});\n\
\n\
\t\ttransitions.fly = makeTransition([ 'opacity', 'left', 'position' ], {\n\
\t\t\tduration: 400, easing: 'easeOut'\n\
\t\t}, { position: 'relative', left: '-500px' }, { position: 'relative', left: 0 });\n\
\t}\n\
\n\
\t\n\
\n\
}());\n\
var parseTransitionParams = function ( params ) {\n\
\tif ( params === 'fast' ) {\n\
\t\treturn { duration: 200 };\n\
\t}\n\
\n\
\tif ( params === 'slow' ) {\n\
\t\treturn { duration: 600 };\n\
\t}\n\
\n\
\tif ( isNumeric( params ) ) {\n\
\t\treturn { duration: +params };\n\
\t}\n\
\n\
\treturn params || {};\n\
};\n\
(function ( transitions ) {\n\
\n\
\tvar typewriter, typewriteNode, typewriteTextNode;\n\
\n\
\tif ( !doc ) {\n\
\t\treturn;\n\
\t}\n\
\n\
\ttypewriteNode = function ( node, complete, interval ) {\n\
\t\tvar children, next, hide;\n\
\n\
\t\tif ( node.nodeType === 1 ) {\n\
\t\t\tnode.style.display = node._display;\n\
\t\t}\n\
\n\
\t\tif ( node.nodeType === 3 ) {\n\
\t\t\ttypewriteTextNode( node, complete, interval );\n\
\t\t\treturn;\n\
\t\t}\n\
\n\
\t\tchildren = Array.prototype.slice.call( node.childNodes );\n\
\n\
\t\tnext = function () {\n\
\t\t\tif ( !children.length ) {\n\
\t\t\t\tif ( node.nodeType === 1 ) {\n\
\t\t\t\t\tnode.setAttribute( 'style', node._style || '' );\n\
\t\t\t\t}\n\
\n\
\t\t\t\tcomplete();\n\
\t\t\t\treturn;\n\
\t\t\t}\n\
\n\
\t\t\ttypewriteNode( children.shift(), next, interval );\n\
\t\t};\n\
\n\
\t\tnext();\n\
\t};\n\
\n\
\ttypewriteTextNode = function ( node, complete, interval ) {\n\
\t\tvar str, len, loop, i;\n\
\n\
\t\t// text node\n\
\t\tstr = node._hiddenData;\n\
\t\tlen = str.length;\n\
\n\
\t\tif ( !len ) {\n\
\t\t\tcomplete();\n\
\t\t\treturn;\n\
\t\t}\n\
\n\
\t\ti = 0;\n\
\n\
\t\tloop = setInterval( function () {\n\
\t\t\tvar substr, remaining, match, remainingNonWhitespace, filler;\n\
\n\
\t\t\tsubstr = str.substr( 0, i );\n\
\t\t\tremaining = str.substring( i );\n\
\n\
\t\t\tmatch = /^\\w+/.exec( remaining );\n\
\t\t\tremainingNonWhitespace = ( match ? match[0].length : 0 );\n\
\n\
\t\t\t// add some non-breaking whitespace corresponding to the remaining length of the\n\
\t\t\t// current word (only really works with monospace fonts, but better than nothing)\n\
\t\t\tfiller = new Array( remainingNonWhitespace + 1 ).join( '\\u00a0' );\n\
\n\
\t\t\tnode.data = substr + filler;\n\
\t\t\tif ( i === len ) {\n\
\t\t\t\tclearInterval( loop );\n\
\t\t\t\tdelete node._hiddenData;\n\
\t\t\t\tcomplete();\n\
\t\t\t}\n\
\n\
\t\t\ti += 1;\n\
\t\t}, interval );\n\
\t};\n\
\n\
\ttypewriter = function ( node, complete, params, isIntro ) {\n\
\t\tvar interval, style, computedStyle, hide;\n\
\n\
\t\tparams = parseTransitionParams( params );\n\
\n\
\t\tinterval = params.interval || ( params.speed ? 1000 / params.speed : ( params.duration ? node.textContent.length / params.duration : 4 ) );\n\
\t\t\n\
\t\tstyle = node.getAttribute( 'style' );\n\
\t\tcomputedStyle = window.getComputedStyle( node );\n\
\n\
\t\tnode.style.visibility = 'hidden';\n\
\n\
\t\tsetTimeout( function () {\n\
\t\t\tvar computedHeight, computedWidth, computedVisibility;\n\
\n\
\t\t\tcomputedWidth = computedStyle.width;\n\
\t\t\tcomputedHeight = computedStyle.height;\n\
\t\t\tcomputedVisibility = computedStyle.visibility;\n\
\n\
\t\t\thide( node );\n\
\n\
\t\t\tsetTimeout( function () {\n\
\t\t\t\tnode.style.width = computedWidth;\n\
\t\t\t\tnode.style.height = computedHeight;\n\
\t\t\t\tnode.style.visibility = 'visible';\n\
\n\
\t\t\t\ttypewriteNode( node, function () {\n\
\t\t\t\t\tnode.setAttribute( 'style', style || '' );\n\
\t\t\t\t\tcomplete();\n\
\t\t\t\t}, interval );\n\
\t\t\t}, params.delay || 0 );\n\
\t\t});\n\
\n\
\t\thide = function ( node ) {\n\
\t\t\tvar children, i;\n\
\n\
\t\t\tif ( node.nodeType === 1 ) {\n\
\t\t\t\tnode._style = node.getAttribute( 'style' );\n\
\t\t\t\tnode._display = window.getComputedStyle( node ).display;\n\
\n\
\t\t\t\tnode.style.display = 'none';\n\
\t\t\t}\n\
\n\
\t\t\tif ( node.nodeType === 3 ) {\n\
\t\t\t\tnode._hiddenData = '' + node.data;\n\
\t\t\t\tnode.data = '';\n\
\t\t\t\t\n\
\t\t\t\treturn;\n\
\t\t\t}\n\
\n\
\t\t\tchildren = Array.prototype.slice.call( node.childNodes );\n\
\t\t\ti = children.length;\n\
\t\t\twhile ( i-- ) {\n\
\t\t\t\thide( children[i] );\n\
\t\t\t}\n\
\t\t};\n\
\t};\n\
\n\
\ttransitions.typewriter = typewriter;\n\
\n\
}( transitions ));\n\
(function ( Ractive ) {\n\
\n\
\tvar requestFullscreen, cancelFullscreen, fullscreenElement;\n\
\n\
\tif ( !doc ) {\n\
\t\treturn;\n\
\t}\n\
\n\
\tRactive.fullscreenEnabled = doc.fullscreenEnabled || doc.mozFullScreenEnabled || doc.webkitFullscreenEnabled;\n\
\n\
\tif ( !Ractive.fullscreenEnabled ) {\n\
\t\tRactive.requestFullscreen = Ractive.cancelFullscreen = noop;\n\
\t\treturn;\n\
\t}\n\
\n\
\t// get prefixed name of requestFullscreen method\n\
\tif ( testDiv.requestFullscreen ) {\n\
\t\trequestFullscreen = 'requestFullscreen';\n\
\t} else if ( testDiv.mozRequestFullScreen ) {\n\
\t\trequestFullscreen = 'mozRequestFullScreen';\n\
\t} else if ( testDiv.webkitRequestFullscreen ) {\n\
\t\trequestFullscreen = 'webkitRequestFullscreen';\n\
\t}\n\
\n\
\tRactive.requestFullscreen = function ( el ) {\n\
\t\tif ( el[ requestFullscreen ] ) {\n\
\t\t\tel[ requestFullscreen ]();\n\
\t\t}\n\
\t};\n\
\n\
\t// get prefixed name of cancelFullscreen method\n\
\tif ( doc.cancelFullscreen ) {\n\
\t\tcancelFullscreen = 'cancelFullscreen';\n\
\t} else if ( doc.mozCancelFullScreen ) {\n\
\t\tcancelFullscreen = 'mozCancelFullScreen';\n\
\t} else if ( doc.webkitCancelFullScreen ) {\n\
\t\tcancelFullscreen = 'webkitCancelFullScreen';\n\
\t}\n\
\n\
\tRactive.cancelFullscreen = function () {\n\
\t\tdoc[ cancelFullscreen ]();\n\
\t};\n\
\n\
\t// get prefixed name of fullscreenElement property\n\
\tif ( doc.fullscreenElement !== undefined ) {\n\
\t\tfullscreenElement = 'fullscreenElement';\n\
\t} else if ( doc.mozFullScreenElement !== undefined ) {\n\
\t\tfullscreenElement = 'mozFullScreenElement';\n\
\t} else if ( doc.webkitFullscreenElement !== undefined ) {\n\
\t\tfullscreenElement = 'webkitFullscreenElement';\n\
\t}\n\
\n\
\tRactive.isFullscreen = function ( el ) {\n\
\t\treturn el === doc[ fullscreenElement ];\n\
\t};\n\
\n\
}( Ractive ));\n\
Animation = function ( options ) {\n\
\tvar key;\n\
\n\
\tthis.startTime = Date.now();\n\
\n\
\t// from and to\n\
\tfor ( key in options ) {\n\
\t\tif ( hasOwn.call( options, key ) ) {\n\
\t\t\tthis[ key ] = options[ key ];\n\
\t\t}\n\
\t}\n\
\n\
\tthis.interpolator = Ractive.interpolate( this.from, this.to );\n\
\tthis.running = true;\n\
};\n\
\n\
Animation.prototype = {\n\
\ttick: function () {\n\
\t\tvar elapsed, t, value, timeNow, index;\n\
\n\
\t\tif ( this.running ) {\n\
\t\t\ttimeNow = Date.now();\n\
\t\t\telapsed = timeNow - this.startTime;\n\
\n\
\t\t\tif ( elapsed >= this.duration ) {\n\
\t\t\t\tthis.root.set( this.keypath, this.to );\n\
\n\
\t\t\t\tif ( this.step ) {\n\
\t\t\t\t\tthis.step( 1, this.to );\n\
\t\t\t\t}\n\
\n\
\t\t\t\tif ( this.complete ) {\n\
\t\t\t\t\tthis.complete( 1, this.to );\n\
\t\t\t\t}\n\
\n\
\t\t\t\tindex = this.root._animations.indexOf( this );\n\
\n\
\t\t\t\t// TODO remove this check, once we're satisifed this never happens!\n\
\t\t\t\tif ( index === -1 && console && console.warn ) {\n\
\t\t\t\t\tconsole.warn( 'Animation was not found' );\n\
\t\t\t\t}\n\
\n\
\t\t\t\tthis.root._animations.splice( index, 1 );\n\
\n\
\t\t\t\tthis.running = false;\n\
\t\t\t\treturn false;\n\
\t\t\t}\n\
\n\
\t\t\tt = this.easing ? this.easing ( elapsed / this.duration ) : ( elapsed / this.duration );\n\
\t\t\tvalue = this.interpolator( t );\n\
\n\
\t\t\tthis.root.set( this.keypath, value );\n\
\n\
\t\t\tif ( this.step ) {\n\
\t\t\t\tthis.step( t, value );\n\
\t\t\t}\n\
\n\
\t\t\treturn true;\n\
\t\t}\n\
\n\
\t\treturn false;\n\
\t},\n\
\n\
\tstop: function () {\n\
\t\tvar index;\n\
\n\
\t\tthis.running = false;\n\
\n\
\t\tindex = this.root._animations.indexOf( this );\n\
\n\
\t\t// TODO remove this check, once we're satisifed this never happens!\n\
\t\tif ( index === -1 && console && console.warn ) {\n\
\t\t\tconsole.warn( 'Animation was not found' );\n\
\t\t}\n\
\n\
\t\tthis.root._animations.splice( index, 1 );\n\
\t}\n\
};\n\
animationCollection = {\n\
\tanimations: [],\n\
\n\
\ttick: function () {\n\
\t\tvar i, animation;\n\
\n\
\t\tfor ( i=0; i<this.animations.length; i+=1 ) {\n\
\t\t\tanimation = this.animations[i];\n\
\n\
\t\t\tif ( !animation.tick() ) {\n\
\t\t\t\t// animation is complete, remove it from the stack, and decrement i so we don't miss one\n\
\t\t\t\tthis.animations.splice( i--, 1 );\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\tif ( this.animations.length ) {\n\
\t\t\trequestAnimationFrame( this.boundTick );\n\
\t\t} else {\n\
\t\t\tthis.running = false;\n\
\t\t}\n\
\t},\n\
\n\
\t// bind method to animationCollection\n\
\tboundTick: function () {\n\
\t\tanimationCollection.tick();\n\
\t},\n\
\n\
\tpush: function ( animation ) {\n\
\t\tthis.animations[ this.animations.length ] = animation;\n\
\n\
\t\tif ( !this.running ) {\n\
\t\t\tthis.running = true;\n\
\t\t\tthis.tick();\n\
\t\t}\n\
\t}\n\
};\n\
// https://gist.github.com/paulirish/1579671\n\
(function( vendors, lastTime, global ) {\n\
\t\n\
\tvar x, setTimeout;\n\
\n\
\tif ( global.requestAnimationFrame ) {\n\
\t\trequestAnimationFrame = global.requestAnimationFrame;\n\
\t\treturn;\n\
\t}\n\
\n\
\tfor ( x = 0; x < vendors.length && !requestAnimationFrame; ++x ) {\n\
\t\trequestAnimationFrame = global[vendors[x]+'RequestAnimationFrame'];\n\
\t}\n\
\n\
\tif ( !requestAnimationFrame ) {\n\
\t\tsetTimeout = global.setTimeout;\n\
\n\
\t\trequestAnimationFrame = function(callback) {\n\
\t\t\tvar currTime, timeToCall, id;\n\
\t\t\t\n\
\t\t\tcurrTime = Date.now();\n\
\t\t\ttimeToCall = Math.max( 0, 16 - (currTime - lastTime ) );\n\
\t\t\tid = setTimeout( function() { callback(currTime + timeToCall); }, timeToCall );\n\
\t\t\t\n\
\t\t\tlastTime = currTime + timeToCall;\n\
\t\t\treturn id;\n\
\t\t};\n\
\t}\n\
\t\n\
}( ['ms', 'moz', 'webkit', 'o'], 0, global ));\n\
(function () {\n\
\n\
\tvar notifyArrayDependants,\n\
\n\
\t\twrapArray,\n\
\t\tunwrapArray,\n\
\t\tWrappedArrayProto,\n\
\t\ttestObj,\n\
\t\tmutatorMethods;\n\
\n\
\n\
\t// Register a keypath to this array. When any of this array's mutator methods are called,\n\
\t// it will `set` that keypath on the given Ractive instance\n\
\tregisterKeypathToArray = function ( array, keypath, root ) {\n\
\t\tvar roots, keypathsByGuid, rootIndex, keypaths;\n\
\n\
\t\t// If this array hasn't been wrapped, we need to wrap it\n\
\t\tif ( !array._ractive ) {\n\
\t\t\tdefineProperty( array, '_ractive', {\n\
\t\t\t\tvalue: {\n\
\t\t\t\t\troots: [ root ], // there may be more than one Ractive instance depending on this\n\
\t\t\t\t\tkeypathsByGuid: {}\n\
\t\t\t\t},\n\
\t\t\t\tconfigurable: true\n\
\t\t\t});\n\
\n\
\t\t\tarray._ractive.keypathsByGuid[ root._guid ] = [ keypath ];\n\
\n\
\t\t\twrapArray( array );\n\
\t\t}\n\
\n\
\t\telse {\n\
\t\t\troots = array._ractive.roots;\n\
\t\t\tkeypathsByGuid = array._ractive.keypathsByGuid;\n\
\n\
\t\t\t// Does this Ractive instance currently depend on this array?\n\
\t\t\t// If not, associate them\n\
\t\t\tif ( !keypathsByGuid[ root._guid ] ) {\n\
\t\t\t\troots[ roots.length ] = root;\n\
\t\t\t\tkeypathsByGuid[ root._guid ] = [];\n\
\t\t\t}\n\
\n\
\t\t\tkeypaths = keypathsByGuid[ root._guid ];\n\
\n\
\t\t\t// If the current keypath isn't among them, add it\n\
\t\t\tif ( keypaths.indexOf( keypath ) === -1 ) {\n\
\t\t\t\tkeypaths[ keypaths.length ] = keypath;\n\
\t\t\t}\n\
\t\t}\n\
\t};\n\
\n\
\n\
\t// Unregister keypath from array\n\
\tunregisterKeypathFromArray = function ( array, keypath, root ) {\n\
\t\tvar roots, keypathsByGuid, rootIndex, keypaths, keypathIndex;\n\
\n\
\t\tif ( !array._ractive ) {\n\
\t\t\tthrow new Error( 'Attempted to remove keypath from non-wrapped array. This error is unexpected - please send a bug report to @rich_harris' );\n\
\t\t}\n\
\n\
\t\troots = array._ractive.roots;\n\
\t\tkeypathsByGuid = array._ractive.keypathsByGuid;\n\
\n\
\t\tif ( !keypathsByGuid[ root._guid ] ) {\n\
\t\t\tthrow new Error( 'Ractive instance was not listed as a dependent of this array. This error is unexpected - please send a bug report to @rich_harris' );\n\
\t\t}\n\
\n\
\t\tkeypaths = keypathsByGuid[ root._guid ];\n\
\t\tkeypathIndex = keypaths.indexOf( keypath );\n\
\n\
\t\tif ( keypathIndex === -1 ) {\n\
\t\t\tthrow new Error( 'Attempted to unlink non-linked keypath from array. This error is unexpected - please send a bug report to @rich_harris' );\n\
\t\t}\n\
\n\
\t\tkeypaths.splice( keypathIndex, 1 );\n\
\n\
\t\tif ( !keypaths.length ) {\n\
\t\t\troots.splice( roots.indexOf( root ), 1 );\n\
\t\t\tkeypathsByGuid[ root._guid ] = null;\n\
\t\t}\n\
\n\
\t\tif ( !roots.length ) {\n\
\t\t\tunwrapArray( array ); // It's good to clean up after ourselves\n\
\t\t}\n\
\t};\n\
\n\
\n\
\tnotifyArrayDependants = function ( array, methodName, args ) {\n\
\t\tvar processRoots,\n\
\t\t\tprocessRoot,\n\
\t\t\tprocessKeypaths,\n\
\t\t\tprocessKeypath,\n\
\t\t\tqueueAllDependants,\n\
\t\t\tqueueDependants,\n\
\t\t\tkeypathsByGuid;\n\
\n\
\t\tkeypathsByGuid = array._ractive.keypathsByGuid;\n\
\n\
\t\tprocessRoots = function ( roots ) {\n\
\t\t\tvar i = roots.length;\n\
\t\t\twhile ( i-- ) {\n\
\t\t\t\tprocessRoot( roots[i] );\n\
\t\t\t}\n\
\t\t};\n\
\n\
\t\tprocessRoot = function ( root ) {\n\
\t\t\tvar previousTransitionManager = root._transitionManager, transitionManager;\n\
\n\
\t\t\troot._transitionManager = transitionManager = makeTransitionManager( root, noop );\n\
\t\t\tprocessKeypaths( root, keypathsByGuid[ root._guid ] );\n\
\t\t\troot._transitionManager = previousTransitionManager;\n\
\n\
\t\t\ttransitionManager.ready();\n\
\t\t};\n\
\n\
\t\tprocessKeypaths = function ( root, keypaths ) {\n\
\t\t\tvar i = keypaths.length;\n\
\t\t\twhile ( i-- ) {\n\
\t\t\t\tprocessKeypath( root, keypaths[i] );\n\
\t\t\t}\n\
\t\t};\n\
\n\
\t\tprocessKeypath = function ( root, keypath ) {\n\
\t\t\tvar depsByKeypath, deps, keys, upstreamQueue, smartUpdateQueue, dumbUpdateQueue, i, j, item;\n\
\n\
\t\t\t// If this is a sort or reverse, we just do root.set()...\n\
\t\t\tif ( methodName === 'sort' || methodName === 'reverse' ) {\n\
\t\t\t\troot.set( keypath, array );\n\
\t\t\t\treturn;\n\
\t\t\t}\n\
\n\
\t\t\t// otherwise we do a smart update whereby elements are added/removed\n\
\t\t\t// in the right place. But we do need to clear the cache\n\
\t\t\tclearCache( root, keypath );\n\
\n\
\t\t\t// find dependants. If any are DOM sections, we do a smart update\n\
\t\t\t// rather than a ractive.set() blunderbuss\n\
\t\t\tsmartUpdateQueue = [];\n\
\t\t\tdumbUpdateQueue = [];\n\
\n\
\t\t\tfor ( i=0; i<root._deps.length; i+=1 ) { // we can't cache root._deps.length as it may change!\n\
\t\t\t\tdepsByKeypath = root._deps[i];\n\
\n\
\t\t\t\tif ( !depsByKeypath ) {\n\
\t\t\t\t\tcontinue;\n\
\t\t\t\t}\n\
\n\
\t\t\t\tdeps = depsByKeypath[ keypath ];\n\
\t\t\t\t\n\
\t\t\t\tif ( deps ) {\n\
\t\t\t\t\tqueueDependants( root, keypath, deps, smartUpdateQueue, dumbUpdateQueue );\n\
\n\
\t\t\t\t\t// we may have some deferred evaluators to process\n\
\t\t\t\t\tprocessDeferredUpdates( root );\n\
\t\t\t\t\t\n\
\t\t\t\t\twhile ( smartUpdateQueue.length ) {\n\
\t\t\t\t\t\tsmartUpdateQueue.pop().smartUpdate( methodName, args );\n\
\t\t\t\t\t}\n\
\n\
\t\t\t\t\twhile ( dumbUpdateQueue.length ) {\n\
\t\t\t\t\t\tdumbUpdateQueue.pop().update();\n\
\t\t\t\t\t}\n\
\t\t\t\t}\n\
\t\t\t}\n\
\n\
\t\t\t// we may have some deferred attributes to process\n\
\t\t\tprocessDeferredUpdates( root );\n\
\n\
\t\t\t// Finally, notify direct dependants of upstream keypaths...\n\
\t\t\tupstreamQueue = [];\n\
\n\
\t\t\tkeys = splitKeypath( keypath );\n\
\t\t\twhile ( keys.length ) {\n\
\t\t\t\tkeys.pop();\n\
\t\t\t\tupstreamQueue[ upstreamQueue.length ] = keys.join( '.' );\n\
\t\t\t}\n\
\n\
\t\t\tnotifyMultipleDependants( root, upstreamQueue, true );\n\
\n\
\t\t\t// length property has changed - notify dependants\n\
\t\t\t// TODO in some cases (e.g. todo list example, when marking all as complete, then\n\
\t\t\t// adding a new item (which should deactivate the 'all complete' checkbox\n\
\t\t\t// but doesn't) this needs to happen before other updates. But doing so causes\n\
\t\t\t// other mental problems. not sure what's going on...\n\
\t\t\tnotifyDependants( root, keypath + '.length', true );\n\
\t\t};\n\
\n\
\t\t// TODO can we get rid of this whole queueing nonsense?\n\
\t\tqueueDependants = function ( root, keypath, deps, smartUpdateQueue, dumbUpdateQueue ) {\n\
\t\t\tvar k, dependant;\n\
\n\
\t\t\tk = deps.length;\n\
\t\t\twhile ( k-- ) {\n\
\t\t\t\tdependant = deps[k];\n\
\n\
\t\t\t\t// references need to get processed before mustaches\n\
\t\t\t\tif ( dependant.type === REFERENCE ) {\n\
\t\t\t\t\tdependant.update();\n\
\t\t\t\t\t//dumbUpdateQueue[ dumbUpdateQueue.length ] = dependant;\n\
\t\t\t\t}\n\
\n\
\t\t\t\t// is this a DOM section?\n\
\t\t\t\telse if ( dependant.keypath === keypath && dependant.type === SECTION /*&& dependant.parentNode*/ ) {\n\
\t\t\t\t\tsmartUpdateQueue[ smartUpdateQueue.length ] = dependant;\n\
\n\
\t\t\t\t} else {\n\
\t\t\t\t\tdumbUpdateQueue[ dumbUpdateQueue.length ] = dependant;\n\
\t\t\t\t}\n\
\t\t\t}\n\
\t\t};\n\
\n\
\t\tprocessRoots( array._ractive.roots );\n\
\t};\n\
\n\
\n\
\n\
\n\
\n\
\t\t\n\
\tWrappedArrayProto = [];\n\
\tmutatorMethods = [ 'pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift' ];\n\
\n\
\tmutatorMethods.forEach( function ( methodName ) {\n\
\t\tvar method = function () {\n\
\t\t\tvar result = Array.prototype[ methodName ].apply( this, arguments );\n\
\n\
\t\t\tthis._ractive.setting = true;\n\
\t\t\tnotifyArrayDependants( this, methodName, arguments );\n\
\t\t\tthis._ractive.setting = false;\n\
\n\
\t\t\treturn result;\n\
\t\t};\n\
\n\
\t\tdefineProperty( WrappedArrayProto, methodName, {\n\
\t\t\tvalue: method\n\
\t\t});\n\
\t});\n\
\n\
\t\n\
\t// can we use prototype chain injection?\n\
\t// http://perfectionkills.com/how-ecmascript-5-still-does-not-allow-to-subclass-an-array/#wrappers_prototype_chain_injection\n\
\ttestObj = {};\n\
\tif ( testObj.__proto__ ) {\n\
\t\t// yes, we can\n\
\t\twrapArray = function ( array ) {\n\
\t\t\tarray.__proto__ = WrappedArrayProto;\n\
\t\t};\n\
\n\
\t\tunwrapArray = function ( array ) {\n\
\t\t\tdelete array._ractive;\n\
\t\t\tarray.__proto__ = Array.prototype;\n\
\t\t};\n\
\t}\n\
\n\
\telse {\n\
\t\t// no, we can't\n\
\t\twrapArray = function ( array ) {\n\
\t\t\tvar i, methodName;\n\
\n\
\t\t\ti = mutatorMethods.length;\n\
\t\t\twhile ( i-- ) {\n\
\t\t\t\tmethodName = mutatorMethods[i];\n\
\t\t\t\tdefineProperty( array, methodName, {\n\
\t\t\t\t\tvalue: WrappedArrayProto[ methodName ],\n\
\t\t\t\t\tconfigurable: true\n\
\t\t\t\t});\n\
\t\t\t}\n\
\t\t};\n\
\n\
\t\tunwrapArray = function ( array ) {\n\
\t\t\tvar i;\n\
\n\
\t\t\ti = mutatorMethods.length;\n\
\t\t\twhile ( i-- ) {\n\
\t\t\t\tdelete array[ mutatorMethods[i] ];\n\
\t\t\t}\n\
\n\
\t\t\tdelete array._ractive;\n\
\t\t};\n\
\t}\n\
\n\
}());\n\
(function () {\n\
\n\
\tvar propertyNames, determineNameAndNamespace, setStaticAttribute, determinePropertyName, isAttributeBindable;\n\
\n\
\t// the property name equivalents for element attributes, where they differ\n\
\t// from the lowercased attribute name\n\
\tpropertyNames = {\n\
\t\t'accept-charset': 'acceptCharset',\n\
\t\taccesskey: 'accessKey',\n\
\t\tbgcolor: 'bgColor',\n\
\t\t'class': 'className',\n\
\t\tcodebase: 'codeBase',\n\
\t\tcolspan: 'colSpan',\n\
\t\tcontenteditable: 'contentEditable',\n\
\t\tdatetime: 'dateTime',\n\
\t\tdirname: 'dirName',\n\
\t\t'for': 'htmlFor',\n\
\t\t'http-equiv': 'httpEquiv',\n\
\t\tismap: 'isMap',\n\
\t\tmaxlength: 'maxLength',\n\
\t\tnovalidate: 'noValidate',\n\
\t\tpubdate: 'pubDate',\n\
\t\treadonly: 'readOnly',\n\
\t\trowspan: 'rowSpan',\n\
\t\ttabindex: 'tabIndex',\n\
\t\tusemap: 'useMap'\n\
\t};\n\
\n\
\t// Attribute\n\
\tDomAttribute = function ( options ) {\n\
\n\
\t\tdetermineNameAndNamespace( this, options.name );\n\
\n\
\t\t// if it's an empty attribute, or just a straight key-value pair, with no\n\
\t\t// mustache shenanigans, set the attribute accordingly and go home\n\
\t\tif ( options.value === null || typeof options.value === 'string' ) {\n\
\t\t\tsetStaticAttribute( this, options );\n\
\t\t\treturn;\n\
\t\t}\n\
\n\
\t\t// otherwise we need to do some work\n\
\t\tthis.root = options.root;\n\
\t\tthis.element = options.element;\n\
\t\tthis.parentNode = options.parentNode;\n\
\t\tthis.lcName = this.name.toLowerCase();\n\
\n\
\t\t// share parentFragment with parent element\n\
\t\tthis.parentFragment = this.element.parentFragment;\n\
\n\
\t\tthis.fragment = new StringFragment({\n\
\t\t\tdescriptor:   options.value,\n\
\t\t\troot:         this.root,\n\
\t\t\towner:        this,\n\
\t\t\tcontextStack: options.contextStack\n\
\t\t});\n\
\n\
\n\
\t\t// if we're not rendering (i.e. we're just stringifying), we can stop here\n\
\t\tif ( !this.parentNode ) {\n\
\t\t\treturn;\n\
\t\t}\n\
\n\
\n\
\t\t// can we establish this attribute's property name equivalent?\n\
\t\tdeterminePropertyName( this, options );\n\
\t\t\n\
\t\t// determine whether this attribute can be marked as self-updating\n\
\t\tthis.selfUpdating = isStringFragmentSimple( this.fragment );\n\
\n\
\t\t// if two-way binding is enabled, and we've got a dynamic `value` attribute, and this is an input or textarea, set up two-way binding\n\
\t\tthis.isBindable = isAttributeBindable( this );\n\
\n\
\t\t// mark as ready\n\
\t\tthis.ready = true;\n\
\t};\n\
\n\
\tDomAttribute.prototype = {\n\
\t\tbind: function ( lazy ) {\n\
\t\t\tvar self = this, node = this.parentNode, interpolator, keypath, index, options, option, i, len;\n\
\n\
\t\t\tif ( !this.fragment ) {\n\
\t\t\t\treturn false; // report failure\n\
\t\t\t}\n\
\n\
\t\t\t// TODO refactor this? Couldn't the interpolator have got a keypath via an expression?\n\
\t\t\t// Check this is a suitable candidate for two-way binding - i.e. it is\n\
\t\t\t// a single interpolator, which isn't an expression\n\
\t\t\tif (\n\
\t\t\t\tthis.fragment.items.length !== 1 ||\n\
\t\t\t\tthis.fragment.items[0].type !== INTERPOLATOR ||\n\
\t\t\t\t( !this.fragment.items[0].keypath && !this.fragment.items[0].ref )\n\
\t\t\t) {\n\
\t\t\t\tif ( this.root.debug ) {\n\
\t\t\t\t\tif ( console && console.warn ) {\n\
\t\t\t\t\t\tconsole.warn( 'Not a valid two-way data binding candidate - must be a single interpolator:', this.fragment.items );\n\
\t\t\t\t\t}\n\
\t\t\t\t}\n\
\t\t\t\treturn false; // report failure\n\
\t\t\t}\n\
\n\
\t\t\tthis.interpolator = this.fragment.items[0];\n\
\n\
\t\t\t// Hmmm. Not sure if this is the best way to handle this ambiguity...\n\
\t\t\t//\n\
\t\t\t// Let's say we were given `value=\"{{bar}}\"`. If the context stack was\n\
\t\t\t// context stack was `[\"foo\"]`, and `foo.bar` *wasn't* `undefined`, the\n\
\t\t\t// keypath would be `foo.bar`. Then, any user input would result in\n\
\t\t\t// `foo.bar` being updated.\n\
\t\t\t//\n\
\t\t\t// If, however, `foo.bar` *was* undefined, and so was `bar`, we would be\n\
\t\t\t// left with an unresolved partial keypath - so we are forced to make an\n\
\t\t\t// assumption. That assumption is that the input in question should\n\
\t\t\t// be forced to resolve to `bar`, and any user input would affect `bar`\n\
\t\t\t// and not `foo.bar`.\n\
\t\t\t//\n\
\t\t\t// Did that make any sense? No? Oh. Sorry. Well the moral of the story is\n\
\t\t\t// be explicit when using two-way data-binding about what keypath you're\n\
\t\t\t// updating. Using it in lists is probably a recipe for confusion...\n\
\t\t\tthis.keypath = this.interpolator.keypath || this.interpolator.descriptor.r;\n\
\t\t\t\n\
\t\t\t\n\
\t\t\t// select\n\
\t\t\tif ( node.tagName === 'SELECT' && this.propertyName === 'value' ) {\n\
\t\t\t\t// We need to know if one of the options was selected, so we\n\
\t\t\t\t// can initialise the viewmodel. To do that we need to jump\n\
\t\t\t\t// through a couple of hoops\n\
\t\t\t\toptions = node.getElementsByTagName( 'option' );\n\
\n\
\t\t\t\tlen = options.length;\n\
\t\t\t\tfor ( i=0; i<len; i+=1 ) {\n\
\t\t\t\t\toption = options[i];\n\
\t\t\t\t\tif ( option.hasAttribute( 'selected' ) ) { // not option.selected - won't work here\n\
\t\t\t\t\t\tthis.root.set( this.keypath, option.value );\n\
\t\t\t\t\t\tbreak;\n\
\t\t\t\t\t}\n\
\t\t\t\t}\n\
\n\
\t\t\t\tthis.isMultipleSelect = node.multiple;\n\
\t\t\t}\n\
\n\
\t\t\t// checkboxes and radio buttons\n\
\t\t\tif ( node.type === 'checkbox' || node.type === 'radio' ) {\n\
\t\t\t\t// We might have a situation like this: \n\
\t\t\t\t//\n\
\t\t\t\t//     <input type='radio' name='{{colour}}' value='red'>\n\
\t\t\t\t//     <input type='radio' name='{{colour}}' value='blue'>\n\
\t\t\t\t//     <input type='radio' name='{{colour}}' value='green'>\n\
\t\t\t\t//\n\
\t\t\t\t// In this case we want to set `colour` to the value of whichever option\n\
\t\t\t\t// is checked. (We assume that a value attribute has been supplied.)\n\
\n\
\t\t\t\tif ( this.propertyName === 'name' ) {\n\
\t\t\t\t\t// replace actual name attribute\n\
\t\t\t\t\tnode.name = '{{' + this.keypath + '}}';\n\
\n\
\t\t\t\t\tthis.updateViewModel = function () {\n\
\t\t\t\t\t\tif ( node.checked ) {\n\
\t\t\t\t\t\t\tself.root.set( self.keypath, node.value );\n\
\t\t\t\t\t\t}\n\
\t\t\t\t\t};\n\
\t\t\t\t}\n\
\n\
\n\
\t\t\t\t// Or, we might have a situation like this:\n\
\t\t\t\t//\n\
\t\t\t\t//     <input type='checkbox' checked='{{active}}'>\n\
\t\t\t\t//\n\
\t\t\t\t// Here, we want to set `active` to true or false depending on whether\n\
\t\t\t\t// the input is checked.\n\
\n\
\t\t\t\telse if ( this.propertyName === 'checked' ) {\n\
\t\t\t\t\tthis.updateViewModel = function () {\n\
\t\t\t\t\t\tself.root.set( self.keypath, node.checked );\n\
\t\t\t\t\t};\n\
\t\t\t\t}\n\
\t\t\t}\n\
\n\
\t\t\telse {\n\
\t\t\t\tif ( this.isMultipleSelect ) {\n\
\t\t\t\t\tthis.updateViewModel = function ( event ) {\n\
\t\t\t\t\t\tvar value, selectedOptions, i, previousValue, changed;\n\
\n\
\t\t\t\t\t\twindow.attr = self;\n\
\t\t\t\t\t\tpreviousValue = self.value || [];\n\
\n\
\t\t\t\t\t\tvalue = [];\n\
\t\t\t\t\t\tselectedOptions = node.querySelectorAll( 'option:checked' );\n\
\t\t\t\t\t\tlen = selectedOptions.length;\n\
\n\
\t\t\t\t\t\tfor ( i=0; i<len; i+=1 ) {\n\
\t\t\t\t\t\t\tvalue[ value.length ] = selectedOptions[i].value;\n\
\t\t\t\t\t\t}\n\
\n\
\t\t\t\t\t\t// has the selection changed?\n\
\t\t\t\t\t\tchanged = ( len !== previousValue.length );\n\
\t\t\t\t\t\ti = value.length;\n\
\t\t\t\t\t\twhile ( i-- ) {\n\
\t\t\t\t\t\t\tif ( value[i] !== previousValue[i] ) {\n\
\t\t\t\t\t\t\t\tchanged = true;\n\
\t\t\t\t\t\t\t}\n\
\t\t\t\t\t\t}\n\
\n\
\t\t\t\t\t\tif ( changed = true ) {\n\
\t\t\t\t\t\t\tself.value = value;\n\
\t\t\t\t\t\t\tself.root.set( self.keypath, value );\n\
\t\t\t\t\t\t}\n\
\t\t\t\t\t};\n\
\t\t\t\t}\n\
\n\
\t\t\t\t// Otherwise we've probably got a situation like this:\n\
\t\t\t\t//\n\
\t\t\t\t//     <input value='{{name}}'>\n\
\t\t\t\t//\n\
\t\t\t\t// in which case we just want to set `name` whenever the user enters text.\n\
\t\t\t\t// The same applies to selects and textareas \n\
\t\t\t\telse {\n\
\t\t\t\t\tthis.updateViewModel = function () {\n\
\t\t\t\t\t\tvar value;\n\
\n\
\t\t\t\t\t\tvalue = node.value;\n\
\n\
\t\t\t\t\t\t// special cases\n\
\t\t\t\t\t\tif ( value === '0' ) {\n\
\t\t\t\t\t\t\tvalue = 0;\n\
\t\t\t\t\t\t}\n\
\n\
\t\t\t\t\t\telse if ( value !== '' ) {\n\
\t\t\t\t\t\t\tvalue = +value || value;\n\
\t\t\t\t\t\t}\n\
\n\
\t\t\t\t\t\tself.root.set( self.keypath, value );\n\
\t\t\t\t\t};\n\
\t\t\t\t}\n\
\t\t\t}\n\
\t\t\t\n\
\n\
\t\t\t// if we figured out how to bind changes to the viewmodel, add the event listeners\n\
\t\t\tif ( this.updateViewModel ) {\n\
\t\t\t\tthis.twoway = true;\n\
\n\
\t\t\t\tthis.boundEvents = [ 'change' ];\n\
\n\
\t\t\t\tif ( !lazy ) {\n\
\t\t\t\t\tthis.boundEvents.push( 'input' );\n\
\n\
\t\t\t\t\t// this is a hack to see if we're in IE - if so, we probably need to add\n\
\t\t\t\t\t// a keyup listener as well, since in IE8 the input event doesn't fire,\n\
\t\t\t\t\t// and in IE9 it doesn't fire when text is deleted\n\
\t\t\t\t\tif ( node.attachEvent ) {\n\
\t\t\t\t\t\tthis.boundEvents.push( 'keyup' );\n\
\t\t\t\t\t}\n\
\t\t\t\t}\n\
\n\
\t\t\t\t// Another IE fix, this time with checkboxes that don't fire change events\n\
\t\t\t\t// until they blur\n\
\t\t\t\tif ( node.attachEvent && node.type === 'checkbox' ) {\n\
\t\t\t\t\tthis.boundEvents.push( 'click' );\n\
\t\t\t\t}\n\
\n\
\t\t\t\ti = this.boundEvents.length;\n\
\t\t\t\twhile ( i-- ) {\n\
\t\t\t\t\tnode.addEventListener( this.boundEvents[i], this.updateViewModel, false );\n\
\t\t\t\t}\n\
\t\t\t}\n\
\t\t},\n\
\n\
\t\tupdateBindings: function () {\n\
\t\t\t// if the fragment this attribute belongs to gets reassigned (as a result of\n\
\t\t\t// as section being updated via an array shift, unshift or splice), this\n\
\t\t\t// attribute needs to recognise that its keypath has changed\n\
\t\t\tthis.keypath = this.interpolator.keypath || this.interpolator.r;\n\
\n\
\t\t\t// if we encounter the special case described above, update the name attribute\n\
\t\t\tif ( this.propertyName === 'name' ) {\n\
\t\t\t\t// replace actual name attribute\n\
\t\t\t\tthis.parentNode.name = '{{' + this.keypath + '}}';\n\
\t\t\t}\n\
\t\t},\n\
\n\
\t\tteardown: function () {\n\
\t\t\tvar i;\n\
\n\
\t\t\tif ( this.boundEvents ) {\n\
\t\t\t\ti = this.boundEvents.length;\n\
\n\
\t\t\t\twhile ( i-- ) {\n\
\t\t\t\t\tthis.parentNode.removeEventListener( this.boundEvents[i], this.updateViewModel, false );\n\
\t\t\t\t}\n\
\t\t\t}\n\
\n\
\t\t\t// ignore non-dynamic attributes\n\
\t\t\tif ( this.fragment ) {\n\
\t\t\t\tthis.fragment.teardown();\n\
\t\t\t}\n\
\t\t},\n\
\n\
\t\tbubble: function () {\n\
\t\t\t// If an attribute's text fragment contains a single item, we can\n\
\t\t\t// update the DOM immediately...\n\
\t\t\tif ( this.selfUpdating ) {\n\
\t\t\t\tthis.update();\n\
\t\t\t}\n\
\n\
\t\t\t// otherwise we want to register it as a deferred attribute, to be\n\
\t\t\t// updated once all the information is in, to prevent unnecessary\n\
\t\t\t// DOM manipulation\n\
\t\t\telse if ( !this.deferred && this.ready ) {\n\
\t\t\t\tthis.root._defAttrs[ this.root._defAttrs.length ] = this;\n\
\t\t\t\tthis.deferred = true;\n\
\t\t\t}\n\
\t\t},\n\
\n\
\t\tupdate: function () {\n\
\t\t\tvar value, lowerCaseName, options, i;\n\
\n\
\t\t\tif ( !this.ready ) {\n\
\t\t\t\treturn this; // avoid items bubbling to the surface when we're still initialising\n\
\t\t\t}\n\
\n\
\t\t\t// special case - <select multiple>\n\
\t\t\tif ( this.isMultipleSelect ) {\n\
\t\t\t\tvalue = this.fragment.getValue();\n\
\n\
\t\t\t\tif ( typeof value === 'string' ) {\n\
\t\t\t\t\tvalue = [ value ];\n\
\t\t\t\t}\n\
\t\t\t\t\n\
\t\t\t\tif ( isArray( value ) ) {\n\
\t\t\t\t\toptions = this.parentNode.querySelectorAll( 'option' );\n\
\t\t\t\t\ti = options.length;\n\
\n\
\t\t\t\t\twhile ( i-- ) {\n\
\t\t\t\t\t\toptions[i].selected = ( value.indexOf( options[i].value ) !== -1 );\n\
\t\t\t\t\t}\n\
\t\t\t\t}\n\
\n\
\t\t\t\tthis.value = value;\n\
\n\
\t\t\t\treturn this;\n\
\t\t\t}\n\
\n\
\t\t\tif ( this.twoway ) {\n\
\t\t\t\t// TODO compare against previous?\n\
\n\
\t\t\t\tlowerCaseName = this.lcName;\n\
\t\t\t\tvalue = this.interpolator.value;\n\
\n\
\t\t\t\t// special case - if we have an element like this:\n\
\t\t\t\t//\n\
\t\t\t\t//     <input type='radio' name='{{colour}}' value='red'>\n\
\t\t\t\t//\n\
\t\t\t\t// and `colour` has been set to 'red', we don't want to change the name attribute\n\
\t\t\t\t// to red, we want to indicate that this is the selected option, by setting\n\
\t\t\t\t// input.checked = true\n\
\t\t\t\tif ( lowerCaseName === 'name' && ( this.parentNode.type === 'checkbox' || this.parentNode.type === 'radio' ) ) {\n\
\t\t\t\t\tif ( value === this.parentNode.value ) {\n\
\t\t\t\t\t\tthis.parentNode.checked = true;\n\
\t\t\t\t\t} else {\n\
\t\t\t\t\t\tthis.parentNode.checked = false;\n\
\t\t\t\t\t}\n\
\n\
\t\t\t\t\treturn this; \n\
\t\t\t\t}\n\
\t\t\t}\n\
\n\
\t\t\tvalue = this.fragment.getValue();\n\
\n\
\t\t\tif ( value === undefined ) {\n\
\t\t\t\tvalue = '';\n\
\t\t\t}\n\
\n\
\t\t\tif ( value !== this.value ) {\n\
\t\t\t\tif ( this.useProperty ) {\n\
\t\t\t\t\t\n\
\t\t\t\t\t// Special case - <select> element value attributes. If its value is set at the same\n\
\t\t\t\t\t// time as data which causes options to be added, removed, or changed, things can go\n\
\t\t\t\t\t// awry. For that reason, this attribute needs to get updated after everything else\n\
\t\t\t\t\tif ( this.element.descriptor.e === 'select' && this.propertyName === 'value' ) {\n\
\t\t\t\t\t\tthis.value = value;\n\
\t\t\t\t\t\tthis.root._defSelectValues.push( this );\n\
\t\t\t\t\t\t\n\
\t\t\t\t\t\treturn this;\n\
\t\t\t\t\t}\n\
\n\
\t\t\t\t\tthis.parentNode[ this.propertyName ] = value;\n\
\t\t\t\t\tthis.value = value;\n\
\n\
\t\t\t\t\treturn this;\n\
\t\t\t\t}\n\
\n\
\t\t\t\tif ( this.namespace ) {\n\
\t\t\t\t\tthis.parentNode.setAttributeNS( this.namespace, this.name, value );\n\
\t\t\t\t\tthis.value = value;\n\
\n\
\t\t\t\t\treturn this;\n\
\t\t\t\t}\n\
\n\
\t\t\t\tif ( this.lcName === 'id' ) {\n\
\t\t\t\t\tif ( this.value !== undefined ) {\n\
\t\t\t\t\t\tthis.root.nodes[ this.value ] = undefined;\n\
\t\t\t\t\t}\n\
\n\
\t\t\t\t\tthis.root.nodes[ value ] = this.parentNode;\n\
\t\t\t\t}\n\
\n\
\t\t\t\tthis.parentNode.setAttribute( this.name, value );\n\
\n\
\t\t\t\tthis.value = value;\n\
\t\t\t}\n\
\n\
\t\t\treturn this;\n\
\t\t},\n\
\n\
\t\ttoString: function () {\n\
\t\t\tvar str;\n\
\n\
\t\t\tif ( this.value === null ) {\n\
\t\t\t\treturn this.name;\n\
\t\t\t}\n\
\n\
\t\t\t// TODO don't use JSON.stringify?\n\
\n\
\t\t\tif ( !this.fragment ) {\n\
\t\t\t\treturn this.name + '=' + JSON.stringify( this.value );\n\
\t\t\t}\n\
\n\
\t\t\t// TODO deal with boolean attributes correctly\n\
\t\t\tstr = this.fragment.toString();\n\
\t\t\t\n\
\t\t\treturn this.name + '=' + JSON.stringify( str );\n\
\t\t}\n\
\t};\n\
\n\
\n\
\t// Helper functions\n\
\tdetermineNameAndNamespace = function ( attribute, name ) {\n\
\t\tvar colonIndex, namespacePrefix;\n\
\n\
\t\t// are we dealing with a namespaced attribute, e.g. xlink:href?\n\
\t\tcolonIndex = name.indexOf( ':' );\n\
\t\tif ( colonIndex !== -1 ) {\n\
\n\
\t\t\t// looks like we are, yes...\n\
\t\t\tnamespacePrefix = name.substr( 0, colonIndex );\n\
\n\
\t\t\t// ...unless it's a namespace *declaration*, which we ignore (on the assumption\n\
\t\t\t// that only valid namespaces will be used)\n\
\t\t\tif ( namespacePrefix !== 'xmlns' ) {\n\
\t\t\t\tname = name.substring( colonIndex + 1 );\n\
\n\
\t\t\t\tattribute.name = name;\n\
\t\t\t\tattribute.namespace = namespaces[ namespacePrefix ];\n\
\n\
\t\t\t\tif ( !attribute.namespace ) {\n\
\t\t\t\t\tthrow 'Unknown namespace (\"' + namespacePrefix + '\")';\n\
\t\t\t\t}\n\
\n\
\t\t\t\treturn;\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\tattribute.name = name;\n\
\t};\n\
\n\
\tsetStaticAttribute = function ( attribute, options ) {\n\
\t\tif ( options.parentNode ) {\n\
\t\t\tif ( attribute.namespace ) {\n\
\t\t\t\toptions.parentNode.setAttributeNS( attribute.namespace, options.name, options.value );\n\
\t\t\t} else {\n\
\t\t\t\toptions.parentNode.setAttribute( options.name, options.value );\n\
\t\t\t}\n\
\n\
\t\t\tif ( options.name.toLowerCase() === 'id' ) {\n\
\t\t\t\toptions.root.nodes[ options.value ] = options.parentNode;\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\tattribute.value = options.value;\n\
\t};\n\
\n\
\tdeterminePropertyName = function ( attribute, options ) {\n\
\t\tvar lowerCaseName, propertyName;\n\
\n\
\t\tif ( attribute.parentNode && !attribute.namespace && ( !options.parentNode.namespaceURI || options.parentNode.namespaceURI === namespaces.html ) ) {\n\
\t\t\tlowerCaseName = attribute.lcName;\n\
\t\t\tpropertyName = propertyNames[ lowerCaseName ] || lowerCaseName;\n\
\n\
\t\t\tif ( options.parentNode[ propertyName ] !== undefined ) {\n\
\t\t\t\tattribute.propertyName = propertyName;\n\
\t\t\t}\n\
\n\
\t\t\t// is attribute a boolean attribute or 'value'? If so we're better off doing e.g.\n\
\t\t\t// node.selected = true rather than node.setAttribute( 'selected', '' )\n\
\t\t\tif ( typeof options.parentNode[ propertyName ] === 'boolean' || propertyName === 'value' ) {\n\
\t\t\t\tattribute.useProperty = true;\n\
\t\t\t}\n\
\t\t}\n\
\t};\n\
\n\
\tisAttributeBindable = function ( attribute ) {\n\
\t\tvar tagName, propertyName;\n\
\n\
\t\tif ( !attribute.root.twoway ) {\n\
\t\t\treturn false;\n\
\t\t}\n\
\n\
\t\ttagName = attribute.element.descriptor.e.toLowerCase();\n\
\t\tpropertyName = attribute.propertyName;\n\
\n\
\t\treturn (\n\
\t\t\t( propertyName === 'name' || propertyName === 'value' || propertyName === 'checked' ) &&\n\
\t\t\t( tagName === 'input' || tagName === 'textarea' || tagName === 'select' )\n\
\t\t);\n\
\t};\n\
\n\
}());\n\
(function () {\n\
\n\
\tvar ComponentParameter;\n\
\n\
\tDomComponent = function ( options, docFrag ) {\n\
\t\tvar self = this,\n\
\t\t\tparentFragment = this.parentFragment = options.parentFragment,\n\
\t\t\troot,\n\
\t\t\tComponent,\n\
\t\t\ttwoway,\n\
\t\t\tpartials,\n\
\t\t\tinstance,\n\
\t\t\tkeypath,\n\
\t\t\tdata,\n\
\t\t\tmappings,\n\
\t\t\ti,\n\
\t\t\tpair,\n\
\t\t\tobserveParent,\n\
\t\t\tobserveChild,\n\
\t\t\tsettingParent,\n\
\t\t\tsettingChild,\n\
\t\t\tkey,\n\
\t\t\tinitFalse,\n\
\t\t\tprocessKeyValuePair,\n\
\t\t\teventName,\n\
\t\t\tpropagateEvent;\n\
\n\
\t\troot = parentFragment.root;\n\
\n\
\t\tthis.type = COMPONENT;\n\
\t\tthis.name = options.descriptor.r;\n\
\n\
\t\tComponent = getComponentConstructor( parentFragment.root, options.descriptor.e );\n\
\t\ttwoway = ( Component.twoway !== false );\n\
\n\
\t\tdata = {};\n\
\t\tmappings = [];\n\
\n\
\t\tthis.complexParameters = [];\n\
\n\
\t\tprocessKeyValuePair = function ( key, value ) {\n\
\t\t\tvar fragment, parameter;\n\
\n\
\t\t\t// if this is a static value, great\n\
\t\t\tif ( typeof value === 'string' ) {\n\
\t\t\t\ttry {\n\
\t\t\t\t\tdata[ key ] = JSON.parse( value );\n\
\t\t\t\t} catch ( err ) {\n\
\t\t\t\t\tdata[ key ] = value;\n\
\t\t\t\t}\n\
\t\t\t\treturn;\n\
\t\t\t}\n\
\n\
\t\t\t// if null, we treat is as a boolean attribute (i.e. true)\n\
\t\t\tif ( value === null ) {\n\
\t\t\t\tdata[ key ] = true;\n\
\t\t\t\treturn;\n\
\t\t\t}\n\
\n\
\t\t\t// if a regular interpolator, we bind to it\n\
\t\t\tif ( value.length === 1 && value[0].t === INTERPOLATOR && value[0].r ) {\n\
\t\t\t\t\n\
\t\t\t\t// is it an index reference?\n\
\t\t\t\tif ( parentFragment.indexRefs && parentFragment.indexRefs[ value[0].r ] !== undefined ) {\n\
\t\t\t\t\tdata[ key ] = parentFragment.indexRefs[ value[0].r ];\n\
\t\t\t\t\treturn;\n\
\t\t\t\t}\n\
\n\
\t\t\t\tkeypath = resolveRef( root, value[0].r, parentFragment.contextStack ) || value[0].r;\n\
\n\
\t\t\t\tdata[ key ] = root.get( keypath );\n\
\t\t\t\tmappings[ mappings.length ] = [ key, keypath ];\n\
\t\t\t\treturn;\n\
\t\t\t}\n\
\n\
\t\t\tparameter = new ComponentParameter( root, self, key, value, parentFragment.contextStack );\n\
\t\t\tself.complexParameters[ self.complexParameters.length ] = parameter;\n\
\n\
\t\t\tdata[ key ] = parameter.value;\n\
\t\t};\n\
\n\
\t\tif ( options.descriptor.a ) {\n\
\t\t\tfor ( key in options.descriptor.a ) {\n\
\t\t\t\tif ( options.descriptor.a.hasOwnProperty( key ) ) {\n\
\t\t\t\t\tprocessKeyValuePair( key, options.descriptor.a[ key ] );\n\
\t\t\t\t}\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\tpartials = {};\n\
\t\tif ( options.descriptor.f ) {\n\
\t\t\tpartials.content = options.descriptor.f;\n\
\t\t}\n\
\n\
\t\tinstance = this.instance = new Component({\n\
\t\t\tappend: true,\n\
\t\t\tel: parentFragment.parentNode,\n\
\t\t\tdata: data,\n\
\t\t\tpartials: partials\n\
\t\t});\n\
\n\
\t\tself.observers = [];\n\
\t\tinitFalse = { init: false };\n\
\n\
\t\tobserveParent = function ( pair ) {\n\
\t\t\tvar observer = root.observe( pair[1], function ( value ) {\n\
\t\t\t\tif ( !settingParent ) {\n\
\t\t\t\t\tsettingChild = true;\n\
\t\t\t\t\tinstance.set( pair[0], value );\n\
\t\t\t\t\tsettingChild = false;\n\
\t\t\t\t}\n\
\t\t\t}, initFalse );\n\
\n\
\t\t\tself.observers[ self.observers.length ] = observer;\n\
\t\t};\n\
\n\
\t\tif ( twoway ) {\n\
\t\t\tobserveChild = function ( pair ) {\n\
\t\t\t\tvar observer = instance.observe( pair[0], function ( value ) {\n\
\t\t\t\t\tif ( !settingChild ) {\n\
\t\t\t\t\t\tsettingParent = true;\n\
\t\t\t\t\t\troot.set( pair[1], value );\n\
\t\t\t\t\t\tsettingParent = false;\n\
\t\t\t\t\t}\n\
\t\t\t\t}, initFalse );\n\
\n\
\t\t\t\tself.observers[ self.observers.length ] = observer;\n\
\t\t\t};\n\
\t\t}\n\
\t\t\n\
\n\
\t\ti = mappings.length;\n\
\t\twhile ( i-- ) {\n\
\t\t\tpair = mappings[i];\n\
\n\
\t\t\tobserveParent( pair );\n\
\n\
\t\t\tif ( twoway ) {\n\
\t\t\t\tobserveChild( pair );\n\
\t\t\t}\n\
\t\t}\n\
\n\
\n\
\t\t// proxy events\n\
\t\tpropagateEvent = function ( eventName, proxy ) {\n\
\t\t\tinstance.on( eventName, function () {\n\
\t\t\t\tvar args = Array.prototype.slice.call( arguments );\n\
\t\t\t\targs.unshift( proxy );\n\
\n\
\t\t\t\troot.fire.apply( root, args );\n\
\t\t\t});\n\
\t\t};\n\
\n\
\t\tif ( options.descriptor.v ) {\n\
\t\t\tfor ( eventName in options.descriptor.v ) {\n\
\t\t\t\tif ( options.descriptor.v.hasOwnProperty( eventName ) ) {\n\
\t\t\t\t\tpropagateEvent( eventName, options.descriptor.v[ eventName ] );\n\
\t\t\t\t}\n\
\t\t\t}\n\
\t\t}\n\
\t};\n\
\n\
\tDomComponent.prototype = {\n\
\t\tfirstNode: function () {\n\
\t\t\treturn this.instance.fragment.firstNode();\n\
\t\t},\n\
\n\
\t\tfindNextNode: function () {\n\
\t\t\treturn this.parentFragment.findNextNode( this );\n\
\t\t},\n\
\n\
\t\tteardown: function ( detach ) {\n\
\t\t\twhile ( this.complexParameters.length ) {\n\
\t\t\t\tthis.complexParameters.pop().teardown();\n\
\t\t\t}\n\
\n\
\t\t\twhile ( this.observers.length ) {\n\
\t\t\t\tthis.observers.pop().cancel();\n\
\t\t\t}\n\
\t\t\t\n\
\t\t\tthis.instance.teardown();\n\
\t\t},\n\
\n\
\t\ttoString: function () {\n\
\t\t\treturn this.instance.fragment.toString();\n\
\t\t}\n\
\t};\n\
\n\
\n\
\tComponentParameter = function ( root, component, key, value, contextStack ) {\n\
\t\t\n\
\t\tthis.parentFragment = component.parentFragment;\n\
\t\tthis.component = component;\n\
\t\tthis.key = key;\n\
\n\
\t\tthis.fragment = new StringFragment({\n\
\t\t\tdescriptor:   value,\n\
\t\t\troot:         root,\n\
\t\t\towner:        this,\n\
\t\t\tcontextStack: contextStack\n\
\t\t});\n\
\n\
\t\tthis.selfUpdating = isStringFragmentSimple( this.fragment );\n\
\t\tthis.value = this.fragment.getValue();\n\
\t};\n\
\n\
\tComponentParameter.prototype = {\n\
\t\tbubble: function () {\n\
\t\t\t// If there's a single item, we can update the component immediately...\n\
\t\t\tif ( this.selfUpdating ) {\n\
\t\t\t\tthis.update();\n\
\t\t\t}\n\
\n\
\t\t\t// otherwise we want to register it as a deferred component, to be\n\
\t\t\t// updated once all the information is in, to prevent unnecessary\n\
\t\t\t// DOM manipulation\n\
\t\t\telse if ( !this.deferred && this.ready ) {\n\
\t\t\t\tthis.root._defAttrs[ this.root._defAttrs.length ] = this;\n\
\t\t\t\tthis.deferred = true;\n\
\t\t\t}\n\
\t\t},\n\
\n\
\t\tupdate: function () {\n\
\t\t\tvar value = this.fragment.getValue();\n\
\n\
\t\t\tthis.component.set( this.key, value );\n\
\t\t\tthis.value = value;\n\
\t\t}\n\
\t};\n\
\n\
\n\
}());\n\
// Element\n\
DomElement = function ( options, docFrag ) {\n\
\n\
\tvar parentFragment,\n\
\t\tdescriptor,\n\
\t\tnamespace,\n\
\t\teventName,\n\
\t\teventNames,\n\
\t\ti,\n\
\t\tattr,\n\
\t\tattrName,\n\
\t\tlcName,\n\
\t\tattrValue,\n\
\t\tbindable,\n\
\t\ttwowayNameAttr,\n\
\t\tparentNode,\n\
\t\troot,\n\
\t\ttransition,\n\
\t\ttransitionName,\n\
\t\ttransitionParams,\n\
\t\ttransitionManager,\n\
\t\tintro;\n\
\n\
\tthis.type = ELEMENT;\n\
\n\
\t// stuff we'll need later\n\
\tparentFragment = this.parentFragment = options.parentFragment;\n\
\tdescriptor = this.descriptor = options.descriptor;\n\
\n\
\tthis.root = root = parentFragment.root;\n\
\tthis.parentNode = parentFragment.parentNode;\n\
\tthis.index = options.index;\n\
\n\
\tthis.eventListeners = [];\n\
\tthis.customEventListeners = [];\n\
\n\
\t// get namespace, if we're actually rendering (not server-side stringifying)\n\
\tif ( this.parentNode ) {\n\
\t\tif ( descriptor.a && descriptor.a.xmlns ) {\n\
\t\t\tnamespace = descriptor.a.xmlns;\n\
\n\
\t\t\t// check it's a string!\n\
\t\t\tif ( typeof namespace !== 'string' ) {\n\
\t\t\t\tthrow new Error( 'Namespace attribute cannot contain mustaches' );\n\
\t\t\t}\n\
\t\t} else {\n\
\t\t\tnamespace = ( descriptor.e.toLowerCase() === 'svg' ? namespaces.svg : this.parentNode.namespaceURI );\n\
\t\t}\n\
\t\t\n\
\n\
\t\t// create the DOM node\n\
\t\tthis.node = doc.createElementNS( namespace, descriptor.e );\n\
\t}\n\
\n\
\n\
\t// append children, if there are any\n\
\tif ( descriptor.f ) {\n\
\t\tif ( typeof descriptor.f === 'string' && ( !this.node || ( !this.node.namespaceURI || this.node.namespaceURI === namespaces.html ) ) ) {\n\
\t\t\t// great! we can use innerHTML\n\
\t\t\tthis.html = descriptor.f;\n\
\n\
\t\t\tif ( docFrag ) {\n\
\t\t\t\tthis.node.innerHTML = this.html;\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\telse {\n\
\t\t\t// once again, everyone has to suffer because of IE bloody 8\n\
\t\t\tif ( descriptor.e === 'style' && this.node.styleSheet !== undefined ) {\n\
\t\t\t\tthis.fragment = new StringFragment({\n\
\t\t\t\t\tdescriptor:   descriptor.f,\n\
\t\t\t\t\troot:         root,\n\
\t\t\t\t\tcontextStack: parentFragment.contextStack,\n\
\t\t\t\t\towner:        this\n\
\t\t\t\t});\n\
\n\
\t\t\t\tif ( docFrag ) {\n\
\t\t\t\t\tthis.bubble = function () {\n\
\t\t\t\t\t\tthis.node.styleSheet.cssText = this.fragment.toString();\n\
\t\t\t\t\t};\n\
\t\t\t\t}\n\
\t\t\t}\n\
\n\
\t\t\telse {\n\
\t\t\t\tthis.fragment = new DomFragment({\n\
\t\t\t\t\tdescriptor:   descriptor.f,\n\
\t\t\t\t\troot:         root,\n\
\t\t\t\t\tparentNode:   this.node,\n\
\t\t\t\t\tcontextStack: parentFragment.contextStack,\n\
\t\t\t\t\towner:        this\n\
\t\t\t\t});\n\
\n\
\t\t\t\tif ( docFrag ) {\n\
\t\t\t\t\tthis.node.appendChild( this.fragment.docFrag );\n\
\t\t\t\t}\n\
\t\t\t}\n\
\t\t}\n\
\t}\n\
\n\
\n\
\t// create event proxies\n\
\tif ( docFrag && descriptor.v ) {\n\
\t\tfor ( eventName in descriptor.v ) {\n\
\t\t\tif ( hasOwn.call( descriptor.v, eventName ) ) {\n\
\t\t\t\teventNames = eventName.split( '-' );\n\
\t\t\t\ti = eventNames.length;\n\
\n\
\t\t\t\twhile ( i-- ) {\n\
\t\t\t\t\tthis.addEventProxy( eventNames[i], descriptor.v[ eventName ], parentFragment.contextStack );\n\
\t\t\t\t}\n\
\t\t\t}\n\
\t\t}\n\
\t}\n\
\n\
\n\
\t// set attributes\n\
\tthis.attributes = [];\n\
\tbindable = []; // save these till the end\n\
\n\
\tfor ( attrName in descriptor.a ) {\n\
\t\tif ( hasOwn.call( descriptor.a, attrName ) ) {\n\
\t\t\tattrValue = descriptor.a[ attrName ];\n\
\t\t\t\n\
\t\t\tattr = new DomAttribute({\n\
\t\t\t\telement:      this,\n\
\t\t\t\tname:         attrName,\n\
\t\t\t\tvalue:        ( attrValue === undefined ? null : attrValue ),\n\
\t\t\t\troot:         root,\n\
\t\t\t\tparentNode:   this.node,\n\
\t\t\t\tcontextStack: parentFragment.contextStack\n\
\t\t\t});\n\
\n\
\t\t\tthis.attributes[ this.attributes.length ] = attr;\n\
\n\
\t\t\t// TODO why is this an array? Shurely an element can only have one two-way attribute?\n\
\t\t\tif ( attr.isBindable ) {\n\
\t\t\t\tbindable.push( attr );\n\
\t\t\t}\n\
\n\
\t\t\t// The name attribute is a special case - it is the only two-way attribute that updates\n\
\t\t\t// the viewmodel based on the value of another attribute. For that reason it must wait\n\
\t\t\t// until the node has been initialised, and the viewmodel has had its first two-way\n\
\t\t\t// update, before updating itself (otherwise it may disable a checkbox or radio that\n\
\t\t\t// was enabled in the template)\n\
\t\t\tif ( attr.isBindable && attr.propertyName === 'name' ) {\n\
\t\t\t\ttwowayNameAttr = attr;\n\
\t\t\t} else {\n\
\t\t\t\tattr.update();\n\
\t\t\t}\n\
\t\t}\n\
\t}\n\
\n\
\t// if we're actually rendering (i.e. not server-side stringifying), proceed\n\
\tif ( docFrag ) {\n\
\t\twhile ( bindable.length ) {\n\
\t\t\tbindable.pop().bind( this.root.lazy );\n\
\t\t}\n\
\n\
\t\tif ( twowayNameAttr ) {\n\
\t\t\tif ( twowayNameAttr.updateViewModel ) {\n\
\t\t\t\ttwowayNameAttr.updateViewModel();\n\
\t\t\t}\n\
\t\t\ttwowayNameAttr.update();\n\
\t\t}\n\
\n\
\t\tdocFrag.appendChild( this.node );\n\
\n\
\t\t// trigger intro transition\n\
\t\tif ( descriptor.t1 ) {\n\
\t\t\texecuteTransition( descriptor.t1, root, this, parentFragment.contextStack, true );\n\
\t\t}\n\
\t}\n\
};\n\
\n\
DomElement.prototype = {\n\
\taddEventProxy: function ( triggerEventName, proxyDescriptor, contextStack ) {\n\
\t\tvar self = this, root = this.root, proxyName, proxyArgs, dynamicArgs, reuseable, definition, listener, fragment, handler, comboKey;\n\
\n\
\t\t// Note the current context - this can be useful with event handlers\n\
\t\tif ( !this.node._ractive ) {\n\
\t\t\tdefineProperty( this.node, '_ractive', { value: {\n\
\t\t\t\tkeypath: ( contextStack.length ? contextStack[ contextStack.length - 1 ] : '' ),\n\
\t\t\t\tindex: this.parentFragment.indexRefs\n\
\t\t\t} });\n\
\t\t}\n\
\n\
\t\tif ( typeof proxyDescriptor === 'string' ) {\n\
\t\t\tproxyName = proxyDescriptor;\n\
\t\t} else {\n\
\t\t\tproxyName = proxyDescriptor.n;\n\
\t\t}\n\
\n\
\t\t// This key uniquely identifies this trigger+proxy name combo on this element\n\
\t\tcomboKey = triggerEventName + '=' + proxyName;\n\
\t\t\n\
\t\tif ( proxyDescriptor.a ) {\n\
\t\t\tproxyArgs = proxyDescriptor.a;\n\
\t\t}\n\
\n\
\t\telse if ( proxyDescriptor.d ) {\n\
\t\t\tdynamicArgs = true;\n\
\n\
\t\t\tproxyArgs = new StringFragment({\n\
\t\t\t\tdescriptor:   proxyDescriptor.d,\n\
\t\t\t\troot:         this.root,\n\
\t\t\t\towner:        this,\n\
\t\t\t\tcontextStack: contextStack\n\
\t\t\t});\n\
\n\
\t\t\tif ( !this.proxyFrags ) {\n\
\t\t\t\tthis.proxyFrags = [];\n\
\t\t\t}\n\
\t\t\tthis.proxyFrags[ this.proxyFrags.length ] = proxyArgs;\n\
\t\t}\n\
\n\
\t\tif ( proxyArgs !== undefined ) {\n\
\t\t\t// store arguments on the element, so we can reuse the same handler\n\
\t\t\t// with multiple elements\n\
\t\t\tif ( this.node._ractive[ comboKey ] ) {\n\
\t\t\t\tthrow new Error( 'You cannot have two proxy events with the same trigger event (' + comboKey + ')' );\n\
\t\t\t}\n\
\n\
\t\t\tthis.node._ractive[ comboKey ] = {\n\
\t\t\t\tdynamic: dynamicArgs,\n\
\t\t\t\tpayload: proxyArgs\n\
\t\t\t};\n\
\t\t}\n\
\n\
\t\t// Is this a custom event?\n\
\t\tif ( definition = ( root.eventDefinitions[ triggerEventName ] || Ractive.eventDefinitions[ triggerEventName ] ) ) {\n\
\t\t\t// If the proxy is a string (e.g. <a proxy-click='select'>{{item}}</a>) then\n\
\t\t\t// we can reuse the handler. This eliminates the need for event delegation\n\
\t\t\tif ( !root._customProxies[ comboKey ] ) {\n\
\t\t\t\troot._customProxies[ comboKey ] = function ( proxyEvent ) {\n\
\t\t\t\t\tvar args, payload;\n\
\n\
\t\t\t\t\tif ( !proxyEvent.node ) {\n\
\t\t\t\t\t\tthrow new Error( 'Proxy event definitions must fire events with a `node` property' );\n\
\t\t\t\t\t}\n\
\n\
\t\t\t\t\tproxyEvent.keypath = proxyEvent.node._ractive.keypath;\n\
\t\t\t\t\tproxyEvent.context = root.get( proxyEvent.keypath );\n\
\t\t\t\t\tproxyEvent.index = proxyEvent.node._ractive.index;\n\
\n\
\t\t\t\t\tif ( proxyEvent.node._ractive[ comboKey ] ) {\n\
\t\t\t\t\t\targs = proxyEvent.node._ractive[ comboKey ];\n\
\t\t\t\t\t\tpayload = args.dynamic ? args.payload.toJson() : args.payload;\n\
\t\t\t\t\t}\n\
\n\
\t\t\t\t\troot.fire( proxyName, proxyEvent, payload );\n\
\t\t\t\t};\n\
\t\t\t}\n\
\n\
\t\t\thandler = root._customProxies[ comboKey ];\n\
\n\
\t\t\t// Use custom event. Apply definition to this node\n\
\t\t\tlistener = definition( this.node, handler );\n\
\t\t\tthis.customEventListeners[ this.customEventListeners.length ] = listener;\n\
\n\
\t\t\treturn;\n\
\t\t}\n\
\n\
\t\t// If not, we just need to check it is a valid event for this element\n\
\t\t// warn about invalid event handlers, if we're in debug mode\n\
\t\tif ( this.node[ 'on' + triggerEventName ] !== undefined && root.debug ) {\n\
\t\t\tif ( console && console.warn ) {\n\
\t\t\t\tconsole.warn( 'Invalid event handler (' + triggerEventName + ')' );\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\tif ( !root._proxies[ comboKey ] ) {\n\
\t\t\troot._proxies[ comboKey ] = function ( event ) {\n\
\t\t\t\tvar args, payload, proxyEvent = {\n\
\t\t\t\t\tnode: this,\n\
\t\t\t\t\toriginal: event,\n\
\t\t\t\t\tkeypath: this._ractive.keypath,\n\
\t\t\t\t\tcontext: root.get( this._ractive.keypath ),\n\
\t\t\t\t\tindex: this._ractive.index\n\
\t\t\t\t};\n\
\n\
\t\t\t\tif ( this._ractive && this._ractive[ comboKey ] ) {\n\
\t\t\t\t\targs = this._ractive[ comboKey ];\n\
\t\t\t\t\tpayload = args.dynamic ? args.payload.toJson() : args.payload;\n\
\t\t\t\t}\n\
\n\
\t\t\t\troot.fire( proxyName, proxyEvent, payload );\n\
\t\t\t};\n\
\t\t}\n\
\n\
\t\thandler = root._proxies[ comboKey ];\n\
\n\
\t\tthis.eventListeners[ this.eventListeners.length ] = {\n\
\t\t\tn: triggerEventName,\n\
\t\t\th: handler\n\
\t\t};\n\
\n\
\t\tthis.node.addEventListener( triggerEventName, handler, false );\n\
\t},\n\
\n\
\tteardown: function ( detach ) {\n\
\t\tvar self = this, tearThisDown, transitionManager, transitionName, transitionParams, listener, outro;\n\
\n\
\t\t// Children first. that way, any transitions on child elements will be\n\
\t\t// handled by the current transitionManager\n\
\t\tif ( self.fragment ) {\n\
\t\t\tself.fragment.teardown( false );\n\
\t\t}\n\
\n\
\t\twhile ( self.attributes.length ) {\n\
\t\t\tself.attributes.pop().teardown();\n\
\t\t}\n\
\n\
\t\twhile ( self.eventListeners.length ) {\n\
\t\t\tlistener = self.eventListeners.pop();\n\
\t\t\tself.node.removeEventListener( listener.n, listener.h, false );\n\
\t\t}\n\
\n\
\t\twhile ( self.customEventListeners.length ) {\n\
\t\t\tself.customEventListeners.pop().teardown();\n\
\t\t}\n\
\n\
\t\tif ( this.proxyFrags ) {\n\
\t\t\twhile ( this.proxyFrags.length ) {\n\
\t\t\t\tthis.proxyFrags.pop().teardown();\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\tif ( this.descriptor.t2 ) {\n\
\t\t\texecuteTransition( this.descriptor.t2, this.root, this, this.parentFragment.contextStack, false );\n\
\t\t}\n\
\n\
\t\tif ( detach ) {\n\
\t\t\tthis.root._transitionManager.detachWhenReady( this.node );\n\
\t\t}\n\
\t},\n\
\n\
\tfirstNode: function () {\n\
\t\treturn this.node;\n\
\t},\n\
\n\
\tfindNextNode: function ( fragment ) {\n\
\t\treturn null;\n\
\t},\n\
\n\
\tbubble: function () {\n\
\t\t// noop - just so event proxy and transition fragments have something to call!\n\
\t},\n\
\n\
\ttoString: function () {\n\
\t\tvar str, i, len, attr;\n\
\n\
\t\t// TODO void tags\n\
\t\tstr = '' +\n\
\t\t\t'<' + this.descriptor.e;\n\
\n\
\t\tlen = this.attributes.length;\n\
\t\tfor ( i=0; i<len; i+=1 ) {\n\
\t\t\tstr += ' ' + this.attributes[i].toString();\n\
\t\t}\n\
\n\
\t\tstr += '>';\n\
\n\
\t\tif ( this.html ) {\n\
\t\t\tstr += this.html;\n\
\t\t} else if ( this.fragment ) {\n\
\t\t\tstr += this.fragment.toString();\n\
\t\t}\n\
\n\
\t\tstr += '</' + this.descriptor.e + '>';\n\
\n\
\t\treturn str;\n\
\t}\n\
};\n\
DomFragment = function ( options ) {\n\
\tif ( options.parentNode ) {\n\
\t\tthis.docFrag = doc.createDocumentFragment();\n\
\t}\n\
\n\
\t// if we have an HTML string, our job is easy.\n\
\tif ( typeof options.descriptor === 'string' ) {\n\
\t\tthis.html = options.descriptor;\n\
\n\
\t\tif ( this.docFrag ) {\n\
\t\t\tthis.nodes = insertHtml( options.descriptor, this.docFrag );\n\
\t\t}\n\
\t\t\n\
\t\treturn; // prevent the rest of the init sequence\n\
\t}\n\
\n\
\t// otherwise we need to make a proper fragment\n\
\tinitFragment( this, options );\n\
};\n\
\n\
DomFragment.prototype = {\n\
\tcreateItem: function ( options ) {\n\
\t\tif ( typeof options.descriptor === 'string' ) {\n\
\t\t\treturn new DomText( options, this.docFrag );\n\
\t\t}\n\
\n\
\t\tswitch ( options.descriptor.t ) {\n\
\t\t\tcase INTERPOLATOR: return new DomInterpolator( options, this.docFrag );\n\
\t\t\tcase SECTION:      return new DomSection( options, this.docFrag );\n\
\t\t\tcase TRIPLE:       return new DomTriple( options, this.docFrag );\n\
\n\
\t\t\tcase ELEMENT:      return new DomElement( options, this.docFrag );\n\
\t\t\tcase PARTIAL:      return new DomPartial( options, this.docFrag );\n\
\t\t\tcase COMPONENT:    return new DomComponent( options, this.docFrag );\n\
\n\
\t\t\tdefault: throw new Error( 'WTF? not sure what happened here...' );\n\
\t\t}\n\
\t},\n\
\n\
\tteardown: function ( detach ) {\n\
\t\tvar node;\n\
\n\
\t\t// if this was built from HTML, we just need to remove the nodes\n\
\t\tif ( detach && this.nodes ) {\n\
\t\t\twhile ( this.nodes.length ) {\n\
\t\t\t\tnode = this.nodes.pop();\n\
\t\t\t\tnode.parentNode.removeChild( node );\n\
\t\t\t}\n\
\t\t\treturn;\n\
\t\t}\n\
\n\
\t\t// otherwise we need to do a proper teardown\n\
\t\tif ( !this.items ) {\n\
\t\t\treturn;\n\
\t\t}\n\
\n\
\t\twhile ( this.items.length ) {\n\
\t\t\tthis.items.pop().teardown( detach );\n\
\t\t}\n\
\t},\n\
\n\
\tfirstNode: function () {\n\
\t\tif ( this.items && this.items[0] ) {\n\
\t\t\treturn this.items[0].firstNode();\n\
\t\t} else if ( this.nodes ) {\n\
\t\t\treturn this.nodes[0] || null;\n\
\t\t}\n\
\n\
\t\treturn null;\n\
\t},\n\
\n\
\tfindNextNode: function ( item ) {\n\
\t\tvar index = item.index;\n\
\n\
\t\tif ( this.items[ index + 1 ] ) {\n\
\t\t\treturn this.items[ index + 1 ].firstNode();\n\
\t\t}\n\
\n\
\t\t// if this is the root fragment, and there are no more items,\n\
\t\t// it means we're at the end\n\
\t\tif ( this.owner === this.root ) {\n\
\t\t\treturn null;\n\
\t\t}\n\
\n\
\t\treturn this.owner.findNextNode( this );\n\
\t},\n\
\n\
\ttoString: function () {\n\
\t\tvar html, i, len, item;\n\
\t\t\n\
\t\tif ( this.html ) {\n\
\t\t\treturn this.html;\n\
\t\t}\n\
\n\
\t\thtml = '';\n\
\n\
\t\tif ( !this.items ) {\n\
\t\t\treturn html;\n\
\t\t}\n\
\n\
\t\tlen = this.items.length;\n\
\n\
\t\tfor ( i=0; i<len; i+=1 ) {\n\
\t\t\titem = this.items[i];\n\
\t\t\thtml += item.toString();\n\
\t\t}\n\
\n\
\t\treturn html;\n\
\t}\n\
};\n\
// Interpolator\n\
DomInterpolator = function ( options, docFrag ) {\n\
\tthis.type = INTERPOLATOR;\n\
\n\
\tif ( docFrag ) {\n\
\t\tthis.node = doc.createTextNode( '' );\n\
\t\tdocFrag.appendChild( this.node );\n\
\t}\n\
\n\
\t// extend Mustache\n\
\tinitMustache( this, options );\n\
};\n\
\n\
DomInterpolator.prototype = {\n\
\tupdate: updateMustache,\n\
\tresolve: resolveMustache,\n\
\n\
\tteardown: function ( detach ) {\n\
\t\tteardown( this );\n\
\t\t\n\
\t\tif ( detach ) {\n\
\t\t\tthis.parentNode.removeChild( this.node );\n\
\t\t}\n\
\t},\n\
\n\
\trender: function ( value ) {\n\
\t\tif ( this.node ) {\n\
\t\t\tthis.node.data = ( value === undefined ? '' : value );\n\
\t\t}\n\
\t},\n\
\n\
\tfirstNode: function () {\n\
\t\treturn this.node;\n\
\t},\n\
\n\
\ttoString: function () {\n\
\t\tvar value = ( this.value !== undefined ? '' + this.value : '' );\n\
\t\treturn value.replace( '<', '&lt;' ).replace( '>', '&gt;' );\n\
\t}\n\
};\n\
// Partials\n\
DomPartial = function ( options, docFrag ) {\n\
\tvar parentFragment = this.parentFragment = options.parentFragment, descriptor;\n\
\n\
\tthis.type = PARTIAL;\n\
\tthis.name = options.descriptor.r;\n\
\n\
\tdescriptor = getPartialDescriptor( parentFragment.root, options.descriptor.r );\n\
\n\
\tthis.fragment = new DomFragment({\n\
\t\tdescriptor:   descriptor,\n\
\t\troot:         parentFragment.root,\n\
\t\tparentNode:   parentFragment.parentNode,\n\
\t\tcontextStack: parentFragment.contextStack,\n\
\t\towner:        this\n\
\t});\n\
\n\
\tif ( docFrag ) {\n\
\t\tdocFrag.appendChild( this.fragment.docFrag );\n\
\t}\n\
};\n\
\n\
DomPartial.prototype = {\n\
\tfirstNode: function () {\n\
\t\treturn this.fragment.firstNode();\n\
\t},\n\
\n\
\tfindNextNode: function () {\n\
\t\treturn this.parentFragment.findNextNode( this );\n\
\t},\n\
\n\
\tteardown: function ( detach ) {\n\
\t\tthis.fragment.teardown( detach );\n\
\t},\n\
\n\
\ttoString: function () {\n\
\t\treturn this.fragment.toString();\n\
\t}\n\
};\n\
// Section\n\
DomSection = function ( options, docFrag ) {\n\
\tthis.type = SECTION;\n\
\n\
\tthis.fragments = [];\n\
\tthis.length = 0; // number of times this section is rendered\n\
\n\
\tif ( docFrag ) {\n\
\t\tthis.docFrag = doc.createDocumentFragment();\n\
\t}\n\
\t\n\
\tthis.initialising = true;\n\
\tinitMustache( this, options );\n\
\n\
\tif ( docFrag ) {\n\
\t\tdocFrag.appendChild( this.docFrag );\n\
\t}\n\
\n\
\tthis.initialising = false;\n\
};\n\
\n\
DomSection.prototype = {\n\
\tupdate: updateMustache,\n\
\tresolve: resolveMustache,\n\
\n\
\tsmartUpdate: function ( methodName, args ) {\n\
\t\tvar fragmentOptions, i;\n\
\n\
\t\tif ( methodName === 'push' || methodName === 'unshift' || methodName === 'splice' ) {\n\
\t\t\tfragmentOptions = {\n\
\t\t\t\tdescriptor: this.descriptor.f,\n\
\t\t\t\troot:       this.root,\n\
\t\t\t\tparentNode: this.parentNode,\n\
\t\t\t\towner:      this\n\
\t\t\t};\n\
\n\
\t\t\tif ( this.descriptor.i ) {\n\
\t\t\t\tfragmentOptions.indexRef = this.descriptor.i;\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\tif ( this[ methodName ] ) { // if not, it's sort or reverse, which doesn't affect us (i.e. our length)\n\
\t\t\tthis[ methodName ]( fragmentOptions, args );\n\
\t\t}\n\
\t},\n\
\n\
\tpop: function () {\n\
\t\t// teardown last fragment\n\
\t\tif ( this.length ) {\n\
\t\t\tthis.fragments.pop().teardown( true );\n\
\t\t\tthis.length -= 1;\n\
\t\t}\n\
\t},\n\
\n\
\tpush: function ( fragmentOptions, args ) {\n\
\t\tvar start, end, i;\n\
\n\
\t\t// append list item to context stack\n\
\t\tstart = this.length;\n\
\t\tend = start + args.length;\n\
\n\
\t\tfor ( i=start; i<end; i+=1 ) {\n\
\t\t\tfragmentOptions.contextStack = this.contextStack.concat( this.keypath + '.' + i );\n\
\t\t\tfragmentOptions.index = i;\n\
\n\
\t\t\tthis.fragments[i] = this.createFragment( fragmentOptions );\n\
\t\t}\n\
\t\t\n\
\t\tthis.length += args.length;\n\
\n\
\t\t// append docfrag in front of next node\n\
\t\tthis.parentNode.insertBefore( this.docFrag, this.parentFragment.findNextNode( this ) );\n\
\t},\n\
\n\
\tshift: function () {\n\
\t\tthis.splice( null, [ 0, 1 ] );\n\
\t},\n\
\n\
\tunshift: function ( fragmentOptions, args ) {\n\
\t\tthis.splice( fragmentOptions, [ 0, 0 ].concat( new Array( args.length ) ) );\n\
\t},\n\
\n\
\tsplice: function ( fragmentOptions, args ) {\n\
\t\tvar insertionPoint, addedItems, removedItems, balance, i, start, end, spliceArgs, reassignStart, reassignEnd, reassignBy;\n\
\n\
\t\tif ( !args.length ) {\n\
\t\t\treturn;\n\
\t\t}\n\
\n\
\t\t// figure out where the changes started...\n\
\t\tstart = +( args[0] < 0 ? this.length + args[0] : args[0] );\n\
\n\
\t\t// ...and how many items were added to or removed from the array\n\
\t\taddedItems = Math.max( 0, args.length - 2 );\n\
\t\tremovedItems = ( args[1] !== undefined ? args[1] : this.length - start );\n\
\n\
\t\tbalance = addedItems - removedItems;\n\
\n\
\t\tif ( !balance ) {\n\
\t\t\t// The array length hasn't changed - we don't need to add or remove anything\n\
\t\t\treturn;\n\
\t\t}\n\
\n\
\t\t// If more items were removed than added, we need to remove some things from the DOM\n\
\t\tif ( balance < 0 ) {\n\
\t\t\tend = start - balance;\n\
\n\
\t\t\tfor ( i=start; i<end; i+=1 ) {\n\
\t\t\t\tthis.fragments[i].teardown( true );\n\
\t\t\t}\n\
\n\
\t\t\t// Keep in sync\n\
\t\t\tthis.fragments.splice( start, -balance );\n\
\t\t}\n\
\n\
\t\t// Otherwise we need to add some things to the DOM\n\
\t\telse {\n\
\t\t\tend = start + balance;\n\
\n\
\t\t\t// Figure out where these new nodes need to be inserted\n\
\t\t\tinsertionPoint = ( this.fragments[ start ] ? this.fragments[ start ].firstNode() : this.parentFragment.findNextNode( this ) );\n\
\n\
\t\t\t// Make room for the new fragments. (Just trust me, this works...)\n\
\t\t\tspliceArgs = [ start, 0 ].concat( new Array( balance ) );\n\
\t\t\tthis.fragments.splice.apply( this.fragments, spliceArgs );\n\
\n\
\t\t\tfor ( i=start; i<end; i+=1 ) {\n\
\t\t\t\tfragmentOptions.contextStack = this.contextStack.concat( this.keypath + '.' + i );\n\
\t\t\t\tfragmentOptions.index = i;\n\
\n\
\t\t\t\tthis.fragments[i] = this.createFragment( fragmentOptions );\n\
\t\t\t}\n\
\n\
\t\t\t// Append docfrag in front of insertion point\n\
\t\t\tthis.parentNode.insertBefore( this.docFrag, insertionPoint );\n\
\t\t}\n\
\n\
\t\tthis.length += balance;\n\
\n\
\n\
\t\t// Now we need to reassign existing fragments (e.g. items.4 -> items.3 - the keypaths,\n\
\t\t// context stacks and index refs will have changed)\n\
\t\treassignStart = ( start + addedItems );\n\
\n\
\t\treassignFragments( this.root, this, reassignStart, this.length, balance );\n\
\t},\n\
\n\
\tteardown: function ( detach ) {\n\
\t\tthis.teardownFragments( detach );\n\
\n\
\t\tteardown( this );\n\
\t},\n\
\n\
\tfirstNode: function () {\n\
\t\tif ( this.fragments[0] ) {\n\
\t\t\treturn this.fragments[0].firstNode();\n\
\t\t}\n\
\n\
\t\treturn this.parentFragment.findNextNode( this );\n\
\t},\n\
\n\
\tfindNextNode: function ( fragment ) {\n\
\t\tif ( this.fragments[ fragment.index + 1 ] ) {\n\
\t\t\treturn this.fragments[ fragment.index + 1 ].firstNode();\n\
\t\t}\n\
\n\
\t\treturn this.parentFragment.findNextNode( this );\n\
\t},\n\
\n\
\tteardownFragments: function ( detach ) {\n\
\t\twhile ( this.fragments.length ) {\n\
\t\t\tthis.fragments.shift().teardown( detach );\n\
\t\t}\n\
\t},\n\
\n\
\trender: function ( value ) {\n\
\t\t\n\
\t\tupdateSection( this, value );\n\
\n\
\t\tif ( !this.initialising ) {\n\
\t\t\t// we need to insert the contents of our document fragment into the correct place\n\
\t\t\tthis.parentNode.insertBefore( this.docFrag, this.parentFragment.findNextNode( this ) );\n\
\t\t}\n\
\t},\n\
\n\
\tcreateFragment: function ( options ) {\n\
\t\tvar fragment = new DomFragment( options );\n\
\t\t\n\
\t\tif ( this.docFrag ) {\n\
\t\t\tthis.docFrag.appendChild( fragment.docFrag );\n\
\t\t}\n\
\n\
\t\treturn fragment;\n\
\t},\n\
\n\
\ttoString: function () {\n\
\t\tvar str, i, len;\n\
\n\
\t\tstr = '';\n\
\n\
\t\ti = 0;\n\
\t\tlen = this.length;\n\
\n\
\t\tfor ( i=0; i<len; i+=1 ) {\n\
\t\t\tstr += this.fragments[i].toString();\n\
\t\t}\n\
\n\
\t\treturn str;\n\
\t}\n\
};\n\
// Plain text\n\
DomText = function ( options, docFrag ) {\n\
\tthis.type = TEXT;\n\
\tthis.descriptor = options.descriptor;\n\
\n\
\tif ( docFrag ) {\n\
\t\tthis.node = doc.createTextNode( options.descriptor );\n\
\t\tthis.parentNode = options.parentFragment.parentNode;\n\
\n\
\t\tdocFrag.appendChild( this.node );\n\
\t}\n\
};\n\
\n\
DomText.prototype = {\n\
\tteardown: function ( detach ) {\n\
\t\tif ( detach ) {\n\
\t\t\tthis.parentNode.removeChild( this.node );\n\
\t\t}\n\
\t},\n\
\n\
\tfirstNode: function () {\n\
\t\treturn this.node;\n\
\t},\n\
\n\
\ttoString: function () {\n\
\t\treturn ( '' + this.descriptor ).replace( '<', '&lt;' ).replace( '>', '&gt;' );\n\
\t}\n\
};\n\
// Triple\n\
DomTriple = function ( options, docFrag ) {\n\
\tthis.type = TRIPLE;\n\
\n\
\tif ( docFrag ) {\n\
\t\tthis.nodes = [];\n\
\t\tthis.docFrag = doc.createDocumentFragment();\n\
\t}\n\
\n\
\tthis.initialising = true;\n\
\tinitMustache( this, options );\n\
\tif ( docFrag ) {\n\
\t\tdocFrag.appendChild( this.docFrag );\n\
\t}\n\
\tthis.initialising = false;\n\
};\n\
\n\
DomTriple.prototype = {\n\
\tupdate: updateMustache,\n\
\tresolve: resolveMustache,\n\
\n\
\tteardown: function ( detach ) {\n\
\n\
\t\t// remove child nodes from DOM\n\
\t\tif ( detach ) {\n\
\t\t\twhile ( this.nodes.length ) {\n\
\t\t\t\tthis.parentNode.removeChild( this.nodes.pop() );\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\tteardown( this );\n\
\t},\n\
\n\
\tfirstNode: function () {\n\
\t\tif ( this.nodes[0] ) {\n\
\t\t\treturn this.nodes[0];\n\
\t\t}\n\
\n\
\t\treturn this.parentFragment.findNextNode( this );\n\
\t},\n\
\n\
\trender: function ( html ) {\n\
\t\t// remove existing nodes\n\
\t\twhile ( this.nodes.length ) {\n\
\t\t\tthis.parentNode.removeChild( this.nodes.pop() );\n\
\t\t}\n\
\n\
\t\tif ( html === undefined ) {\n\
\t\t\tthis.nodes = [];\n\
\t\t\treturn;\n\
\t\t}\n\
\n\
\t\t// get new nodes\n\
\t\tthis.nodes = insertHtml( html, this.docFrag );\n\
\n\
\t\tif ( !this.initialising ) {\n\
\t\t\tthis.parentNode.insertBefore( this.docFrag, this.parentFragment.findNextNode( this ) );\n\
\t\t}\n\
\t},\n\
\n\
\ttoString: function () {\n\
\t\treturn ( this.value !== undefined ? this.value : '' );\n\
\t}\n\
};\n\
StringFragment = function ( options ) {\n\
\tinitFragment( this, options );\n\
};\n\
\n\
StringFragment.prototype = {\n\
\tcreateItem: function ( options ) {\n\
\t\tif ( typeof options.descriptor === 'string' ) {\n\
\t\t\treturn new StringText( options.descriptor );\n\
\t\t}\n\
\n\
\t\tswitch ( options.descriptor.t ) {\n\
\t\t\tcase INTERPOLATOR: return new StringInterpolator( options );\n\
\t\t\tcase TRIPLE: return new StringInterpolator( options );\n\
\t\t\tcase SECTION: return new StringSection( options );\n\
\n\
\t\t\tdefault: throw 'Something went wrong in a rather interesting way';\n\
\t\t}\n\
\t},\n\
\n\
\n\
\tbubble: function () {\n\
\t\tthis.owner.bubble();\n\
\t},\n\
\n\
\tteardown: function () {\n\
\t\tvar numItems, i;\n\
\n\
\t\tnumItems = this.items.length;\n\
\t\tfor ( i=0; i<numItems; i+=1 ) {\n\
\t\t\tthis.items[i].teardown();\n\
\t\t}\n\
\t},\n\
\n\
\tgetValue: function () {\n\
\t\tvar value;\n\
\t\t\n\
\t\t// Accommodate boolean attributes\n\
\t\tif ( this.items.length === 1 && this.items[0].type === INTERPOLATOR ) {\n\
\t\t\tvalue = this.items[0].value;\n\
\t\t\tif ( value !== undefined ) {\n\
\t\t\t\treturn value;\n\
\t\t\t}\n\
\t\t}\n\
\t\t\n\
\t\treturn this.toString();\n\
\t},\n\
\n\
\ttoString: function () {\n\
\t\treturn this.items.join( '' );\n\
\t},\n\
\n\
\ttoJson: function () {\n\
\t\tvar str, json;\n\
\n\
\t\tstr = this.toString();\n\
\n\
\t\ttry {\n\
\t\t\tjson = JSON.parse( str );\n\
\t\t} catch ( err ) {\n\
\t\t\tjson = str;\n\
\t\t}\n\
\n\
\t\treturn json;\n\
\t}\n\
};\n\
// Interpolator or Triple\n\
StringInterpolator = function ( options ) {\n\
\tthis.type = INTERPOLATOR;\n\
\tinitMustache( this, options );\n\
};\n\
\n\
StringInterpolator.prototype = {\n\
\tupdate: updateMustache,\n\
\tresolve: resolveMustache,\n\
\n\
\trender: function ( value ) {\n\
\t\tthis.value = value;\n\
\t\tthis.parentFragment.bubble();\n\
\t},\n\
\n\
\tteardown: function () {\n\
\t\tteardown( this );\n\
\t},\n\
\n\
\ttoString: function () {\n\
\t\treturn ( this.value === undefined ? '' : this.value );\n\
\t}\n\
};\n\
// Section\n\
StringSection = function ( options ) {\n\
\tthis.type = SECTION;\n\
\tthis.fragments = [];\n\
\tthis.length = 0;\n\
\n\
\tinitMustache( this, options );\n\
};\n\
\n\
StringSection.prototype = {\n\
\tupdate: updateMustache,\n\
\tresolve: resolveMustache,\n\
\n\
\tteardown: function () {\n\
\t\tthis.teardownFragments();\n\
\n\
\t\tteardown( this );\n\
\t},\n\
\n\
\tteardownFragments: function () {\n\
\t\twhile ( this.fragments.length ) {\n\
\t\t\tthis.fragments.shift().teardown();\n\
\t\t}\n\
\t\tthis.length = 0;\n\
\t},\n\
\n\
\tbubble: function () {\n\
\t\tthis.value = this.fragments.join( '' );\n\
\t\tthis.parentFragment.bubble();\n\
\t},\n\
\n\
\trender: function ( value ) {\n\
\t\tupdateSection( this, value );\n\
\t\tthis.parentFragment.bubble();\n\
\t},\n\
\n\
\tcreateFragment: function ( options ) {\n\
\t\treturn new StringFragment( options );\n\
\t},\n\
\n\
\ttoString: function () {\n\
\t\treturn this.fragments.join( '' );\n\
\t}\n\
};\n\
// Plain text\n\
StringText = function ( text ) {\n\
\tthis.type = TEXT;\n\
\tthis.text = text;\n\
};\n\
\n\
StringText.prototype = {\n\
\ttoString: function () {\n\
\t\treturn this.text;\n\
\t},\n\
\n\
\tteardown: function () {} // no-op\n\
};\n\
getEl = function ( input ) {\n\
\tvar output;\n\
\n\
\tif ( typeof window === 'undefined' || !doc || !input ) {\n\
\t\treturn null;\n\
\t}\n\
\n\
\t// We already have a DOM node - no work to do. (Duck typing alert!)\n\
\tif ( input.nodeType ) {\n\
\t\treturn input;\n\
\t}\n\
\n\
\t// Get node from string\n\
\tif ( typeof input === 'string' ) {\n\
\t\t// try ID first\n\
\t\toutput = doc.getElementById( input );\n\
\n\
\t\t// then as selector, if possible\n\
\t\tif ( !output && doc.querySelector ) {\n\
\t\t\toutput = doc.querySelector( input );\n\
\t\t}\n\
\n\
\t\t// did it work?\n\
\t\tif ( output.nodeType ) {\n\
\t\t\treturn output;\n\
\t\t}\n\
\t}\n\
\n\
\t// If we've been given a collection (jQuery, Zepto etc), extract the first item\n\
\tif ( input[0] && input[0].nodeType ) {\n\
\t\treturn input[0];\n\
\t}\n\
\n\
\treturn null;\n\
};\n\
toString = Object.prototype.toString;\n\
\n\
// thanks, http://perfectionkills.com/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/\n\
isArray = function ( obj ) {\n\
\treturn toString.call( obj ) === '[object Array]';\n\
};\n\
\n\
isEqual = function ( a, b ) {\n\
\tif ( a === null && b === null ) {\n\
\t\treturn true;\n\
\t}\n\
\n\
\tif ( typeof a === 'object' || typeof b === 'object' ) {\n\
\t\treturn false;\n\
\t}\n\
\n\
\treturn a === b;\n\
};\n\
\n\
// http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric\n\
isNumeric = function ( n ) {\n\
\treturn !isNaN( parseFloat( n ) ) && isFinite( n );\n\
};\n\
\n\
isObject = function ( obj ) {\n\
\treturn ( typeof obj === 'object' && toString.call( obj ) === '[object Object]' );\n\
};\n\
// We're not using a constructor here because it's convenient (and more\n\
// efficient) to pass e.g. transitionManager.pop as a callback, rather\n\
// than wrapping a prototype method in an anonymous function each time\n\
makeTransitionManager = function ( root, callback ) {\n\
\tvar transitionManager, nodesToDetach, detachNodes, nodeHasNoTransitioningChildren;\n\
\n\
\tnodesToDetach = [];\n\
\n\
\t// detach any nodes which a) need to be detached and b) have no child nodes\n\
\t// which are actively transitioning. This will be called each time a\n\
\t// transition completes\n\
\tdetachNodes = function () {\n\
\t\tvar i, node;\n\
\n\
\t\ti = nodesToDetach.length;\n\
\t\twhile ( i-- ) {\n\
\t\t\tnode = nodesToDetach[i];\n\
\n\
\t\t\t// see if this node can be detached yet\n\
\t\t\tif ( nodeHasNoTransitioningChildren( node ) ) {\n\
\t\t\t\tnode.parentNode.removeChild( node );\n\
\t\t\t\tnodesToDetach.splice( i, 1 );\n\
\t\t\t}\n\
\t\t}\n\
\t};\n\
\n\
\tnodeHasNoTransitioningChildren = function ( node ) {\n\
\t\tvar i, candidate;\n\
\n\
\t\ti = transitionManager.active.length;\n\
\t\twhile ( i-- ) {\n\
\t\t\tcandidate = transitionManager.active[i];\n\
\n\
\t\t\tif ( node.contains( candidate ) ) {\n\
\t\t\t\t// fail as soon as possible\n\
\t\t\t\treturn false;\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\treturn true;\n\
\t};\n\
\n\
\ttransitionManager = {\n\
\t\tactive: [],\n\
\t\tpush: function ( node ) {\n\
\t\t\ttransitionManager.active[ transitionManager.active.length ] = node;\n\
\t\t},\n\
\t\tpop: function ( node ) {\n\
\t\t\ttransitionManager.active.splice( transitionManager.active.indexOf( node ), 1 );\n\
\t\t\t\n\
\t\t\tdetachNodes();\n\
\n\
\t\t\tif ( !transitionManager.active.length && transitionManager._ready ) {\n\
\t\t\t\ttransitionManager.complete();\n\
\t\t\t}\n\
\t\t},\n\
\t\tcomplete: function () {\n\
\t\t\tif ( callback ) {\n\
\t\t\t\tcallback.call( root );\n\
\t\t\t}\n\
\t\t},\n\
\t\tready: function () {\n\
\t\t\tdetachNodes();\n\
\n\
\t\t\ttransitionManager._ready = true;\n\
\t\t\tif ( !transitionManager.active.length ) {\n\
\t\t\t\ttransitionManager.complete();\n\
\t\t\t}\n\
\t\t},\n\
\t\tdetachWhenReady: function ( node ) {\n\
\t\t\tnodesToDetach[ nodesToDetach.length ] = node;\n\
\t\t}\n\
\t};\n\
\n\
\treturn transitionManager;\n\
};\n\
splitKeypath =  function ( keypath ) {\n\
\tvar index, startIndex, keys, remaining, part;\n\
\n\
\t// We should only have to do all the heavy regex stuff once... caching FTW\n\
\tif ( keypathCache[ keypath ] ) {\n\
\t\treturn keypathCache[ keypath ].concat();\n\
\t}\n\
\n\
\tkeys = [];\n\
\tremaining = keypath;\n\
\t\n\
\tstartIndex = 0;\n\
\n\
\t// Split into keys\n\
\twhile ( remaining.length ) {\n\
\t\t// Find next dot\n\
\t\tindex = remaining.indexOf( '.', startIndex );\n\
\n\
\t\t// Final part?\n\
\t\tif ( index === -1 ) {\n\
\t\t\tpart = remaining;\n\
\t\t\tremaining = '';\n\
\t\t}\n\
\n\
\t\telse {\n\
\t\t\t// If this dot is preceded by a backslash, which isn't\n\
\t\t\t// itself preceded by a backslash, we consider it escaped\n\
\t\t\tif ( remaining.charAt( index - 1) === '\\\\' && remaining.charAt( index - 2 ) !== '\\\\' ) {\n\
\t\t\t\t// we don't want to keep this part, we want to keep looking\n\
\t\t\t\t// for the separator\n\
\t\t\t\tstartIndex = index + 1;\n\
\t\t\t\tcontinue;\n\
\t\t\t}\n\
\n\
\t\t\t// Otherwise, we have our next part\n\
\t\t\tpart = remaining.substr( 0, index );\n\
\t\t\tstartIndex = 0;\n\
\t\t}\n\
\n\
\t\tif ( /\\[/.test( part ) ) {\n\
\t\t\tkeys = keys.concat( part.replace( /\\[\\s*([0-9]+)\\s*\\]/g, '.$1' ).split( '.' ) );\n\
\t\t} else {\n\
\t\t\tkeys[ keys.length ] = part;\n\
\t\t}\n\
\t\t\n\
\t\tremaining = remaining.substring( index + 1 );\n\
\t}\n\
\n\
\t\n\
\tkeypathCache[ keypath ] = keys;\n\
\treturn keys.concat();\n\
};\n\
(function () {\n\
\n\
\tvar getItem,\n\
\tgetText,\n\
\tgetMustache,\n\
\tgetElement,\n\
\n\
\tFragment,\n\
\tText,\n\
\tMustache,\n\
\tSection,\n\
\tElement,\n\
\tExpression,\n\
\n\
\tstringify,\n\
\tjsonify;\n\
\n\
\n\
\tgetFragmentStubFromTokens = function ( tokens, options, preserveWhitespace ) {\n\
\t\tvar parser, stub;\n\
\n\
\t\tparser = {\n\
\t\t\tpos: 0,\n\
\t\t\ttokens: tokens || [],\n\
\t\t\tnext: function () {\n\
\t\t\t\treturn parser.tokens[ parser.pos ];\n\
\t\t\t},\n\
\t\t\toptions: options\n\
\t\t};\n\
\n\
\t\tstub = new Fragment( parser, preserveWhitespace );\n\
\n\
\t\treturn stub;\n\
\t};\n\
\n\
\tgetItem = function ( parser, preserveWhitespace ) {\n\
\t\tif ( !parser.next() ) {\n\
\t\t\treturn null;\n\
\t\t}\n\
\n\
\t\treturn getText( parser, preserveWhitespace )\n\
\t\t    || getMustache( parser, preserveWhitespace )\n\
\t\t    || getElement( parser, preserveWhitespace );\n\
\t};\n\
\n\
\tgetText = function ( parser, preserveWhitespace ) {\n\
\t\tvar next = parser.next();\n\
\n\
\t\tif ( next.type === TEXT ) {\n\
\t\t\tparser.pos += 1;\n\
\t\t\treturn new Text( next, preserveWhitespace );\n\
\t\t}\n\
\n\
\t\treturn null;\n\
\t};\n\
\n\
\tgetMustache = function ( parser, preserveWhitespace ) {\n\
\t\tvar next = parser.next();\n\
\n\
\t\tif ( next.type === MUSTACHE || next.type === TRIPLE ) {\n\
\t\t\tif ( next.mustacheType === SECTION || next.mustacheType === INVERTED ) {\n\
\t\t\t\treturn new Section( next, parser, preserveWhitespace );\t\t\t\t\n\
\t\t\t}\n\
\n\
\t\t\treturn new Mustache( next, parser );\n\
\t\t}\n\
\n\
\t\treturn null;\n\
\t};\n\
\n\
\tgetElement = function ( parser, preserveWhitespace ) {\n\
\t\tvar next = parser.next(), stub;\n\
\n\
\t\tif ( next.type === TAG ) {\n\
\t\t\tstub = new Element( next, parser, preserveWhitespace );\n\
\n\
\t\t\t// sanitize\t\t\t\n\
\t\t\tif ( parser.options.sanitize && parser.options.sanitize.elements ) {\n\
\t\t\t\tif ( parser.options.sanitize.elements.indexOf( stub.lcTag ) !== -1 ) {\n\
\t\t\t\t\treturn null;\n\
\t\t\t\t}\n\
\t\t\t}\n\
\n\
\t\t\treturn stub;\n\
\t\t}\n\
\n\
\t\treturn null;\n\
\t};\n\
\n\
\tstringify = function ( items ) {\n\
\t\tvar str = '', itemStr, i, len;\n\
\n\
\t\tif ( !items ) {\n\
\t\t\treturn '';\n\
\t\t}\n\
\n\
\t\tfor ( i=0, len=items.length; i<len; i+=1 ) {\n\
\t\t\titemStr = items[i].toString();\n\
\t\t\t\n\
\t\t\tif ( itemStr === false ) {\n\
\t\t\t\treturn false;\n\
\t\t\t}\n\
\n\
\t\t\tstr += itemStr;\n\
\t\t}\n\
\n\
\t\treturn str;\n\
\t};\n\
\n\
\tjsonify = function ( items, noStringify ) {\n\
\t\tvar str, json;\n\
\n\
\t\tif ( !noStringify ) {\n\
\t\t\tstr = stringify( items );\n\
\t\t\tif ( str !== false ) {\n\
\t\t\t\treturn str;\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\tjson = items.map( function ( item ) {\n\
\t\t\treturn item.toJson( noStringify );\n\
\t\t});\n\
\n\
\t\treturn json;\n\
\t};\n\
\n\
\n\
\n\
\tFragment = function ( parser, preserveWhitespace ) {\n\
\t\tvar items, item;\n\
\n\
\t\titems = this.items = [];\n\
\n\
\t\titem = getItem( parser, preserveWhitespace );\n\
\t\twhile ( item !== null ) {\n\
\t\t\titems[ items.length ] = item;\n\
\t\t\titem = getItem( parser, preserveWhitespace );\n\
\t\t}\n\
\t};\n\
\n\
\tFragment.prototype = {\n\
\t\ttoJson: function ( noStringify ) {\n\
\t\t\tvar json;\n\
\n\
\t\t\tif ( this[ 'json_' + noStringify ] ) {\n\
\t\t\t\treturn this[ 'json_' + noStringify ];\n\
\t\t\t}\n\
\n\
\t\t\tjson = this[ 'json_' + noStringify ] = jsonify( this.items, noStringify );\n\
\t\t\treturn json;\n\
\t\t},\n\
\n\
\t\ttoString: function () {\n\
\t\t\tif ( this.str !== undefined ) {\n\
\t\t\t\treturn this.str;\n\
\t\t\t}\n\
\n\
\t\t\tthis.str = stringify( this.items );\n\
\t\t\treturn this.str;\n\
\t\t}\n\
\t};\n\
\n\
\n\
\t// text\n\
\t(function () {\n\
\t\tvar htmlEntities, decodeCharacterReferences, whitespace;\n\
\n\
\t\tText = function ( token, preserveWhitespace ) {\n\
\t\t\tthis.type = TEXT;\n\
\t\t\tthis.text = ( preserveWhitespace ? token.value : token.value.replace( whitespace, ' ' ) );\n\
\t\t};\n\
\n\
\t\tText.prototype = {\n\
\t\t\ttoJson: function () {\n\
\t\t\t\t// this will be used as text, so we need to decode things like &amp;\n\
\t\t\t\treturn this.decoded || ( this.decoded = decodeCharacterReferences( this.text) );\n\
\t\t\t},\n\
\n\
\t\t\ttoString: function () {\n\
\t\t\t\t// this will be used as straight text\n\
\t\t\t\treturn this.text;\n\
\t\t\t}\n\
\t\t};\n\
\n\
\t\thtmlEntities = { quot: 34, amp: 38, apos: 39, lt: 60, gt: 62, nbsp: 160, iexcl: 161, cent: 162, pound: 163, curren: 164, yen: 165, brvbar: 166, sect: 167, uml: 168, copy: 169, ordf: 170, laquo: 171, not: 172, shy: 173, reg: 174, macr: 175, deg: 176, plusmn: 177, sup2: 178, sup3: 179, acute: 180, micro: 181, para: 182, middot: 183, cedil: 184, sup1: 185, ordm: 186, raquo: 187, frac14: 188, frac12: 189, frac34: 190, iquest: 191, Agrave: 192, Aacute: 193, Acirc: 194, Atilde: 195, Auml: 196, Aring: 197, AElig: 198, Ccedil: 199, Egrave: 200, Eacute: 201, Ecirc: 202, Euml: 203, Igrave: 204, Iacute: 205, Icirc: 206, Iuml: 207, ETH: 208, Ntilde: 209, Ograve: 210, Oacute: 211, Ocirc: 212, Otilde: 213, Ouml: 214, times: 215, Oslash: 216, Ugrave: 217, Uacute: 218, Ucirc: 219, Uuml: 220, Yacute: 221, THORN: 222, szlig: 223, agrave: 224, aacute: 225, acirc: 226, atilde: 227, auml: 228, aring: 229, aelig: 230, ccedil: 231, egrave: 232, eacute: 233, ecirc: 234, euml: 235, igrave: 236, iacute: 237, icirc: 238, iuml: 239, eth: 240, ntilde: 241, ograve: 242, oacute: 243, ocirc: 244, otilde: 245, ouml: 246, divide: 247, oslash: 248, ugrave: 249, uacute: 250, ucirc: 251, uuml: 252, yacute: 253, thorn: 254, yuml: 255, OElig: 338, oelig: 339, Scaron: 352, scaron: 353, Yuml: 376, fnof: 402, circ: 710, tilde: 732, Alpha: 913, Beta: 914, Gamma: 915, Delta: 916, Epsilon: 917, Zeta: 918, Eta: 919, Theta: 920, Iota: 921, Kappa: 922, Lambda: 923, Mu: 924, Nu: 925, Xi: 926, Omicron: 927, Pi: 928, Rho: 929, Sigma: 931, Tau: 932, Upsilon: 933, Phi: 934, Chi: 935, Psi: 936, Omega: 937, alpha: 945, beta: 946, gamma: 947, delta: 948, epsilon: 949, zeta: 950, eta: 951, theta: 952, iota: 953, kappa: 954, lambda: 955, mu: 956, nu: 957, xi: 958, omicron: 959, pi: 960, rho: 961, sigmaf: 962, sigma: 963, tau: 964, upsilon: 965, phi: 966, chi: 967, psi: 968, omega: 969, thetasym: 977, upsih: 978, piv: 982, ensp: 8194, emsp: 8195, thinsp: 8201, zwnj: 8204, zwj: 8205, lrm: 8206, rlm: 8207, ndash: 8211, mdash: 8212, lsquo: 8216, rsquo: 8217, sbquo: 8218, ldquo: 8220, rdquo: 8221, bdquo: 8222, dagger: 8224, Dagger: 8225, bull: 8226, hellip: 8230, permil: 8240, prime: 8242, Prime: 8243, lsaquo: 8249, rsaquo: 8250, oline: 8254, frasl: 8260, euro: 8364, image: 8465, weierp: 8472, real: 8476, trade: 8482, alefsym: 8501, larr: 8592, uarr: 8593, rarr: 8594, darr: 8595, harr: 8596, crarr: 8629, lArr: 8656, uArr: 8657, rArr: 8658, dArr: 8659, hArr: 8660, forall: 8704, part: 8706, exist: 8707, empty: 8709, nabla: 8711, isin: 8712, notin: 8713, ni: 8715, prod: 8719, sum: 8721, minus: 8722, lowast: 8727, radic: 8730, prop: 8733, infin: 8734, ang: 8736, and: 8743, or: 8744, cap: 8745, cup: 8746, 'int': 8747, there4: 8756, sim: 8764, cong: 8773, asymp: 8776, ne: 8800, equiv: 8801, le: 8804, ge: 8805, sub: 8834, sup: 8835, nsub: 8836, sube: 8838, supe: 8839, oplus: 8853, otimes: 8855, perp: 8869, sdot: 8901, lceil: 8968, rceil: 8969, lfloor: 8970, rfloor: 8971, lang: 9001, rang: 9002, loz: 9674, spades: 9824, clubs: 9827, hearts: 9829, diams: 9830\t};\n\
\n\
\t\tdecodeCharacterReferences = function ( html ) {\n\
\t\t\tvar result;\n\
\n\
\t\t\t// named entities\n\
\t\t\tresult = html.replace( /&([a-zA-Z]+);/, function ( match, name ) {\n\
\t\t\t\tif ( htmlEntities[ name ] ) {\n\
\t\t\t\t\treturn String.fromCharCode( htmlEntities[ name ] );\n\
\t\t\t\t}\n\
\n\
\t\t\t\treturn match;\n\
\t\t\t});\n\
\n\
\t\t\t// hex references\n\
\t\t\tresult = result.replace( /&#x([0-9]+);/, function ( match, hex ) {\n\
\t\t\t\treturn String.fromCharCode( parseInt( hex, 16 ) );\n\
\t\t\t});\n\
\n\
\t\t\t// decimal references\n\
\t\t\tresult = result.replace( /&#([0-9]+);/, function ( match, num ) {\n\
\t\t\t\treturn String.fromCharCode( num );\n\
\t\t\t});\n\
\n\
\t\t\treturn result;\n\
\t\t};\n\
\n\
\t\twhitespace = /\\s+/g;\n\
\t}());\n\
\n\
\n\
\t// mustache\n\
\t(function () {\n\
\t\tMustache = function ( token, parser ) {\n\
\t\t\tthis.type = ( token.type === TRIPLE ? TRIPLE : token.mustacheType );\n\
\n\
\t\t\tif ( token.ref ) {\n\
\t\t\t\tthis.ref = token.ref;\n\
\t\t\t}\n\
\t\t\t\n\
\t\t\tif ( token.expression ) {\n\
\t\t\t\tthis.expr = new Expression( token.expression );\n\
\t\t\t}\n\
\n\
\t\t\tparser.pos += 1;\n\
\t\t};\n\
\n\
\t\tMustache.prototype = {\n\
\t\t\ttoJson: function () {\n\
\t\t\t\tvar json;\n\
\n\
\t\t\t\tif ( this.json ) {\n\
\t\t\t\t\treturn this.json;\n\
\t\t\t\t}\n\
\n\
\t\t\t\tjson = {\n\
\t\t\t\t\tt: this.type\n\
\t\t\t\t};\n\
\n\
\t\t\t\tif ( this.ref ) {\n\
\t\t\t\t\tjson.r = this.ref;\n\
\t\t\t\t}\n\
\n\
\t\t\t\tif ( this.expr ) {\n\
\t\t\t\t\tjson.x = this.expr.toJson();\n\
\t\t\t\t}\n\
\n\
\t\t\t\tthis.json = json;\n\
\t\t\t\treturn json;\n\
\t\t\t},\n\
\n\
\t\t\ttoString: function () {\n\
\t\t\t\t// mustaches cannot be stringified\n\
\t\t\t\treturn false;\n\
\t\t\t}\n\
\t\t};\n\
\n\
\n\
\t\tSection = function ( firstToken, parser, preserveWhitespace ) {\n\
\t\t\tvar next;\n\
\n\
\t\t\tthis.ref = firstToken.ref;\n\
\t\t\tthis.indexRef = firstToken.indexRef;\n\
\n\
\t\t\tthis.inverted = ( firstToken.mustacheType === INVERTED );\n\
\n\
\t\t\tif ( firstToken.expression ) {\n\
\t\t\t\tthis.expr = new Expression( firstToken.expression );\n\
\t\t\t}\n\
\n\
\t\t\tparser.pos += 1;\n\
\n\
\t\t\tthis.items = [];\n\
\t\t\tnext = parser.next();\n\
\n\
\t\t\twhile ( next ) {\n\
\t\t\t\tif ( next.mustacheType === CLOSING ) {\n\
\t\t\t\t\tif ( ( next.ref.trim() === this.ref ) || this.expr ) {\n\
\t\t\t\t\t\tparser.pos += 1;\n\
\t\t\t\t\t\tbreak;\n\
\t\t\t\t\t}\n\
\n\
\t\t\t\t\telse {\n\
\t\t\t\t\t\tthrow new Error( 'Could not parse template: Illegal closing section' );\n\
\t\t\t\t\t}\n\
\t\t\t\t}\n\
\n\
\t\t\t\tthis.items[ this.items.length ] = getItem( parser, preserveWhitespace );\n\
\t\t\t\tnext = parser.next();\n\
\t\t\t}\n\
\t\t};\n\
\n\
\t\tSection.prototype = {\n\
\t\t\ttoJson: function ( noStringify ) {\n\
\t\t\t\tvar json, str, i, len, itemStr;\n\
\n\
\t\t\t\tif ( this.json ) {\n\
\t\t\t\t\treturn this.json;\n\
\t\t\t\t}\n\
\n\
\t\t\t\tjson = { t: SECTION };\n\
\n\
\t\t\t\tif ( this.ref ) {\n\
\t\t\t\t\tjson.r = this.ref;\n\
\t\t\t\t}\n\
\n\
\t\t\t\tif ( this.indexRef ) {\n\
\t\t\t\t\tjson.i = this.indexRef;\n\
\t\t\t\t}\n\
\n\
\t\t\t\tif ( this.inverted ) {\n\
\t\t\t\t\tjson.n = true;\n\
\t\t\t\t}\n\
\n\
\t\t\t\tif ( this.expr ) {\n\
\t\t\t\t\tjson.x = this.expr.toJson();\n\
\t\t\t\t}\n\
\n\
\t\t\t\tif ( this.items.length ) {\n\
\t\t\t\t\tjson.f = jsonify( this.items, noStringify );\n\
\t\t\t\t}\n\
\n\
\t\t\t\tthis.json = json;\n\
\t\t\t\treturn json;\n\
\t\t\t},\n\
\n\
\t\t\ttoString: function () {\n\
\t\t\t\t// sections cannot be stringified\n\
\t\t\t\treturn false;\n\
\t\t\t}\n\
\t\t};\n\
\t}());\n\
\n\
\n\
\t// element\n\
\t(function () {\n\
\t\tvar voidElementNames,\n\
\t\t\tallElementNames,\n\
\t\t\tmapToLowerCase,\n\
\t\t\tsvgCamelCaseElements,\n\
\t\t\tsvgCamelCaseElementsMap,\n\
\t\t\tsvgCamelCaseAttributes,\n\
\t\t\tsvgCamelCaseAttributesMap,\n\
\t\t\tclosedByParentClose,\n\
\t\t\tsiblingsByTagName,\n\
\t\t\tonPattern,\n\
\t\t\tsanitize,\n\
\t\t\tfilterAttrs;\n\
\n\
\t\tElement = function ( firstToken, parser, preserveWhitespace ) {\n\
\t\t\tvar closed, next, i, len, attrs, filtered, proxies, attr, getFrag, processProxy, item;\n\
\n\
\t\t\tthis.lcTag = firstToken.name.toLowerCase();\n\
\n\
\t\t\t// enforce lower case tag names by default. HTML doesn't care. SVG does, so if we see an SVG tag\n\
\t\t\t// that should be camelcased, camelcase it\n\
\t\t\tthis.tag = ( svgCamelCaseElementsMap[ this.lcTag ] ? svgCamelCaseElementsMap[ this.lcTag ] : this.lcTag );\n\
\n\
\t\t\tparser.pos += 1;\n\
\n\
\t\t\t// if this is a <pre> element, preserve whitespace within\n\
\t\t\tpreserveWhitespace = ( preserveWhitespace || this.lcTag === 'pre' );\n\
\n\
\t\t\tif ( firstToken.attrs ) {\n\
\t\t\t\tfiltered = filterAttrs( firstToken.attrs );\n\
\t\t\t\t\n\
\t\t\t\tattrs = filtered.attrs;\n\
\t\t\t\tproxies = filtered.proxies;\n\
\n\
\t\t\t\t// remove event attributes (e.g. onclick='doSomething()') if we're sanitizing\n\
\t\t\t\tif ( parser.options.sanitize && parser.options.sanitize.eventAttributes ) {\n\
\t\t\t\t\tattrs = attrs.filter( sanitize );\n\
\t\t\t\t}\n\
\n\
\t\t\t\tgetFrag = function ( attr ) {\n\
\t\t\t\t\tvar lcName = attr.name.toLowerCase();\n\
\n\
\t\t\t\t\treturn {\n\
\t\t\t\t\t\tname: ( svgCamelCaseAttributesMap[ lcName ] ? svgCamelCaseAttributesMap[ lcName ] : lcName ),\n\
\t\t\t\t\t\tvalue: attr.value ? getFragmentStubFromTokens( attr.value ) : null\n\
\t\t\t\t\t};\n\
\t\t\t\t};\n\
\n\
\t\t\t\tprocessProxy = function ( proxy ) {\n\
\t\t\t\t\tvar processed, domEventName, match, tokens, proxyName, proxyArgs, colonIndex, throwError;\n\
\n\
\t\t\t\t\tthrowError = function () {\n\
\t\t\t\t\t\tthrow new Error( 'Illegal proxy event' );\n\
\t\t\t\t\t};\n\
\n\
\t\t\t\t\tif ( !proxy.name || !proxy.value ) {\n\
\t\t\t\t\t\tthrowError();\n\
\t\t\t\t\t}\n\
\n\
\t\t\t\t\tprocessed = { domEventName: proxy.name };\n\
\n\
\t\t\t\t\ttokens = proxy.value;\n\
\n\
\t\t\t\t\t// proxy event names must start with a string (no mustaches)\n\
\t\t\t\t\tif ( tokens[0].type !== TEXT ) {\n\
\t\t\t\t\t\tthrowError();\n\
\t\t\t\t\t}\n\
\n\
\t\t\t\t\tcolonIndex = tokens[0].value.indexOf( ':' );\n\
\t\t\t\t\t\n\
\t\t\t\t\t// if no arguments are specified...\n\
\t\t\t\t\tif ( colonIndex === -1 ) {\n\
\t\t\t\t\t\t\n\
\t\t\t\t\t\t// ...the proxy name must be string-only (no mustaches)\n\
\t\t\t\t\t\tif ( tokens.length > 1 ) {\n\
\t\t\t\t\t\t\tthrowError();\n\
\t\t\t\t\t\t}\n\
\n\
\t\t\t\t\t\tprocessed.name = tokens[0].value;\n\
\t\t\t\t\t}\n\
\n\
\t\t\t\t\telse {\n\
\t\t\t\t\t\tprocessed.name = tokens[0].value.substr( 0, colonIndex );\n\
\t\t\t\t\t\ttokens[0].value = tokens[0].value.substring( colonIndex + 1 );\n\
\n\
\t\t\t\t\t\tif ( !tokens[0].value ) {\n\
\t\t\t\t\t\t\ttokens.shift();\n\
\t\t\t\t\t\t}\n\
\n\
\t\t\t\t\t\t// can we parse it yet?\n\
\t\t\t\t\t\tif ( tokens.length === 1 && tokens[0].type === TEXT ) {\n\
\t\t\t\t\t\t\ttry {\n\
\t\t\t\t\t\t\t\tprocessed.args = JSON.parse( tokens[0].value );\n\
\t\t\t\t\t\t\t} catch ( err ) {\n\
\t\t\t\t\t\t\t\tprocessed.args = tokens[0].value;\n\
\t\t\t\t\t\t\t}\n\
\t\t\t\t\t\t}\n\
\n\
\t\t\t\t\t\tprocessed.dynamicArgs = getFragmentStubFromTokens( tokens );\n\
\t\t\t\t\t}\n\
\n\
\t\t\t\t\treturn processed;\n\
\t\t\t\t};\n\
\n\
\t\t\t\tif ( attrs.length ) {\n\
\t\t\t\t\tthis.attributes = attrs.map( getFrag );\n\
\t\t\t\t}\n\
\n\
\t\t\t\tif ( proxies.length ) {\n\
\t\t\t\t\tthis.proxies = proxies.map( processProxy );\n\
\t\t\t\t}\n\
\n\
\t\t\t\t// TODO rename this helper function\n\
\t\t\t\tif ( filtered.intro ) {\n\
\t\t\t\t\tthis.intro = processProxy( filtered.intro );\n\
\t\t\t\t}\n\
\n\
\t\t\t\tif ( filtered.outro ) {\n\
\t\t\t\t\tthis.outro = processProxy( filtered.outro );\n\
\t\t\t\t}\n\
\t\t\t}\n\
\n\
\t\t\tif ( firstToken.selfClosing ) {\n\
\t\t\t\tthis.selfClosing = true;\n\
\t\t\t}\n\
\n\
\t\t\tif ( voidElementNames.indexOf( this.lcTag ) !== -1 ) {\n\
\t\t\t\tthis.isVoid = true;\n\
\t\t\t}\n\
\n\
\t\t\t// if self-closing or a void element, close\n\
\t\t\tif ( this.selfClosing || this.isVoid ) {\n\
\t\t\t\treturn;\n\
\t\t\t}\n\
\n\
\t\t\tthis.siblings = siblingsByTagName[ this.lcTag ];\n\
\n\
\t\t\tthis.items = [];\n\
\n\
\t\t\tnext = parser.next();\n\
\t\t\twhile ( next ) {\n\
\n\
\t\t\t\t// section closing mustache should also close this element, e.g.\n\
\t\t\t\t// <ul>{{#items}}<li>{{content}}{{/items}}</ul>\n\
\t\t\t\tif ( next.mustacheType === CLOSING ) {\n\
\t\t\t\t\tbreak;\n\
\t\t\t\t}\n\
\t\t\t\t\n\
\t\t\t\tif ( next.type === TAG ) {\n\
\n\
\t\t\t\t\t// closing tag\n\
\t\t\t\t\tif ( next.closing ) {\n\
\t\t\t\t\t\t// it's a closing tag, which means this element is closed...\n\
\t\t\t\t\t\tif ( next.name.toLowerCase() === this.lcTag ) {\n\
\t\t\t\t\t\t\tparser.pos += 1;\n\
\t\t\t\t\t\t}\n\
\n\
\t\t\t\t\t\tbreak;\n\
\t\t\t\t\t}\n\
\n\
\t\t\t\t\t// sibling element, which closes this element implicitly\n\
\t\t\t\t\telse if ( this.siblings && ( this.siblings.indexOf( next.name.toLowerCase() ) !== -1 ) ) {\n\
\t\t\t\t\t\tbreak;\n\
\t\t\t\t\t}\n\
\t\t\t\t\t\n\
\t\t\t\t}\n\
\n\
\t\t\t\tthis.items[ this.items.length ] = getItem( parser );\n\
\n\
\t\t\t\tnext = parser.next();\n\
\t\t\t}\n\
\n\
\n\
\t\t\t// if we're not preserving whitespace, we can eliminate inner leading and trailing whitespace\n\
\t\t\tif ( !preserveWhitespace ) {\n\
\t\t\t\titem = this.items[0];\n\
\t\t\t\tif ( item && item.type === TEXT ) {\n\
\t\t\t\t\titem.text = item.text.replace( leadingWhitespace, '' );\n\
\t\t\t\t\tif ( !item.text ) {\n\
\t\t\t\t\t\tthis.items.shift();\n\
\t\t\t\t\t}\n\
\t\t\t\t}\n\
\n\
\t\t\t\titem = this.items[ this.items.length - 1 ];\n\
\t\t\t\tif ( item && item.type === TEXT ) {\n\
\t\t\t\t\titem.text = item.text.replace( trailingWhitespace, '' );\n\
\t\t\t\t\tif ( !item.text ) {\n\
\t\t\t\t\t\tthis.items.pop();\n\
\t\t\t\t\t}\n\
\t\t\t\t}\n\
\t\t\t}\n\
\t\t};\n\
\n\
\t\tElement.prototype = {\n\
\t\t\ttoJson: function ( noStringify ) {\n\
\t\t\t\tvar json, name, value, str, itemStr, proxy, match, i, len;\n\
\n\
\t\t\t\tif ( this[ 'json_' + noStringify ] ) {\n\
\t\t\t\t\treturn this[ 'json_' + noStringify ];\n\
\t\t\t\t}\n\
\n\
\t\t\t\tif ( this.tag.substr( 0, 3 ) === 'rv-' ) {\n\
\t\t\t\t\tjson = {\n\
\t\t\t\t\t\tt: COMPONENT,\n\
\t\t\t\t\t\te: this.tag.substr( 3 )\n\
\t\t\t\t\t};\n\
\t\t\t\t} else {\n\
\t\t\t\t\tjson = {\n\
\t\t\t\t\t\tt: ELEMENT,\n\
\t\t\t\t\t\te: this.tag\n\
\t\t\t\t\t};\n\
\t\t\t\t}\n\
\n\
\t\t\t\tif ( this.attributes && this.attributes.length ) {\n\
\t\t\t\t\tjson.a = {};\n\
\n\
\t\t\t\t\tlen = this.attributes.length;\n\
\t\t\t\t\tfor ( i=0; i<len; i+=1 ) {\n\
\t\t\t\t\t\tname = this.attributes[i].name;\n\
\n\
\t\t\t\t\t\tif ( json.a[ name ] ) {\n\
\t\t\t\t\t\t\tthrow new Error( 'You cannot have multiple elements with the same name' );\n\
\t\t\t\t\t\t}\n\
\n\
\t\t\t\t\t\t// empty attributes (e.g. autoplay, checked)\n\
\t\t\t\t\t\tif( this.attributes[i].value === null ) {\n\
\t\t\t\t\t\t\tvalue = null;\n\
\t\t\t\t\t\t} else {\n\
\t\t\t\t\t\t\tvalue = jsonify( this.attributes[i].value.items, noStringify );\t\n\
\t\t\t\t\t\t}\n\
\n\
\t\t\t\t\t\tjson.a[ name ] = value;\n\
\t\t\t\t\t}\n\
\t\t\t\t}\n\
\n\
\t\t\t\tif ( this.items && this.items.length ) {\n\
\t\t\t\t\tjson.f = jsonify( this.items, noStringify );\n\
\t\t\t\t}\n\
\n\
\t\t\t\tif ( this.proxies && this.proxies.length ) {\n\
\t\t\t\t\tjson.v = {};\n\
\n\
\t\t\t\t\tlen = this.proxies.length;\n\
\t\t\t\t\tfor ( i=0; i<len; i+=1 ) {\n\
\t\t\t\t\t\tproxy = this.proxies[i];\n\
\n\
\t\t\t\t\t\t// TODO rename domEventName, since transitions use the same mechanism\n\
\t\t\t\t\t\tif ( proxy.args ) {\n\
\t\t\t\t\t\t\tjson.v[ proxy.domEventName ] = {\n\
\t\t\t\t\t\t\t\tn: proxy.name,\n\
\t\t\t\t\t\t\t\ta: proxy.args\n\
\t\t\t\t\t\t\t};\n\
\t\t\t\t\t\t} else if ( proxy.dynamicArgs ) {\n\
\t\t\t\t\t\t\tjson.v[ proxy.domEventName ] = {\n\
\t\t\t\t\t\t\t\tn: proxy.name,\n\
\t\t\t\t\t\t\t\td: jsonify( proxy.dynamicArgs.items, noStringify )\n\
\t\t\t\t\t\t\t};\n\
\t\t\t\t\t\t} else {\n\
\t\t\t\t\t\t\tjson.v[ proxy.domEventName ] = proxy.name;\n\
\t\t\t\t\t\t}\n\
\t\t\t\t\t}\n\
\t\t\t\t}\n\
\n\
\t\t\t\tif ( this.intro ) {\n\
\t\t\t\t\tif ( this.intro.args ) {\n\
\t\t\t\t\t\tjson.t1 = {\n\
\t\t\t\t\t\t\tn: this.intro.name,\n\
\t\t\t\t\t\t\ta: this.intro.args\n\
\t\t\t\t\t\t};\n\
\t\t\t\t\t} else if ( this.intro.dynamicArgs ) {\n\
\t\t\t\t\t\tjson.t1 = {\n\
\t\t\t\t\t\t\tn: this.intro.name,\n\
\t\t\t\t\t\t\td: jsonify( this.intro.dynamicArgs.items, noStringify )\n\
\t\t\t\t\t\t};\n\
\t\t\t\t\t} else {\n\
\t\t\t\t\t\tjson.t1 = this.intro.name;\n\
\t\t\t\t\t}\n\
\t\t\t\t}\n\
\n\
\t\t\t\tif ( this.outro ) {\n\
\t\t\t\t\tif ( this.outro.args ) {\n\
\t\t\t\t\t\tjson.t2 = {\n\
\t\t\t\t\t\t\tn: this.outro.name,\n\
\t\t\t\t\t\t\ta: this.outro.args\n\
\t\t\t\t\t\t};\n\
\t\t\t\t\t} else if ( this.outro.dynamicArgs ) {\n\
\t\t\t\t\t\tjson.t2 = {\n\
\t\t\t\t\t\t\tn: this.outro.name,\n\
\t\t\t\t\t\t\td: jsonify( this.outro.dynamicArgs.items, noStringify )\n\
\t\t\t\t\t\t};\n\
\t\t\t\t\t} else {\n\
\t\t\t\t\t\tjson.t2 = this.outro.name;\n\
\t\t\t\t\t}\n\
\t\t\t\t}\n\
\n\
\t\t\t\tthis[ 'json_' + noStringify ] = json;\n\
\t\t\t\treturn json;\n\
\t\t\t},\n\
\n\
\t\t\ttoString: function () {\n\
\t\t\t\tvar str, i, len, attrStr, lcName, attrValueStr, fragStr, isVoid;\n\
\n\
\t\t\t\tif ( this.str !== undefined ) {\n\
\t\t\t\t\treturn this.str;\n\
\t\t\t\t}\n\
\n\
\t\t\t\t// if this isn't an HTML element, it can't be stringified (since the only reason to stringify an\n\
\t\t\t\t// element is to use with innerHTML, and SVG doesn't support that method.\n\
\t\t\t\t// Note: table elements and select children are excluded from this, because IE (of course)\n\
\t\t\t\t// fucks up when you use innerHTML with them\n\
\t\t\t\tif ( allElementNames.indexOf( this.tag.toLowerCase() ) === -1 ) {\n\
\t\t\t\t\treturn ( this.str = false );\n\
\t\t\t\t}\n\
\n\
\t\t\t\t// do we have proxies or transitions? if so we can't use innerHTML\n\
\t\t\t\tif ( this.proxies || this.intro || this.outro ) {\n\
\t\t\t\t\treturn ( this.str = false );\n\
\t\t\t\t}\n\
\n\
\t\t\t\t// see if children can be stringified (i.e. don't contain mustaches)\n\
\t\t\t\tfragStr = stringify( this.items );\n\
\t\t\t\tif ( fragStr === false ) {\n\
\t\t\t\t\treturn ( this.str = false );\n\
\t\t\t\t}\n\
\n\
\t\t\t\t// is this a void element?\n\
\t\t\t\tisVoid = ( voidElementNames.indexOf( this.tag.toLowerCase() ) !== -1 );\n\
\n\
\t\t\t\tstr = '<' + this.tag;\n\
\t\t\t\t\n\
\t\t\t\tif ( this.attributes ) {\n\
\t\t\t\t\tfor ( i=0, len=this.attributes.length; i<len; i+=1 ) {\n\
\n\
\t\t\t\t\t\tlcName = this.attributes[i].name.toLowerCase();\n\
\t\t\t\t\t\t\n\
\t\t\t\t\t\t// does this look like a namespaced attribute? if so we can't stringify it\n\
\t\t\t\t\t\tif ( lcName.indexOf( ':' ) !== -1 ) {\n\
\t\t\t\t\t\t\treturn ( this.str = false );\n\
\t\t\t\t\t\t}\n\
\n\
\t\t\t\t\t\t// if this element has an id attribute, it can't be stringified (since references are stored\n\
\t\t\t\t\t\t// in ractive.nodes). Similarly, intro and outro transitions\n\
\t\t\t\t\t\tif ( lcName === 'id' || lcName === 'intro' || lcName === 'outro' ) {\n\
\t\t\t\t\t\t\treturn ( this.str = false );\n\
\t\t\t\t\t\t}\n\
\n\
\t\t\t\t\t\tattrStr = ' ' + this.attributes[i].name;\n\
\n\
\t\t\t\t\t\t// empty attributes\n\
\t\t\t\t\t\tif ( this.attributes[i].value !== undefined ) {\n\
\t\t\t\t\t\t\tattrValueStr = this.attributes[i].value.toString();\n\
\n\
\t\t\t\t\t\t\tif ( attrValueStr === false ) {\n\
\t\t\t\t\t\t\t\treturn ( this.str = false );\n\
\t\t\t\t\t\t\t}\n\
\n\
\t\t\t\t\t\t\tif ( attrValueStr !== '' ) {\n\
\t\t\t\t\t\t\t\tattrStr += '=';\n\
\n\
\t\t\t\t\t\t\t\t// does it need to be quoted?\n\
\t\t\t\t\t\t\t\tif ( /[\\s\"'=<>`]/.test( attrValueStr ) ) {\n\
\t\t\t\t\t\t\t\t\tattrStr += '\"' + attrValueStr.replace( /\"/g, '&quot;' ) + '\"';\n\
\t\t\t\t\t\t\t\t} else {\n\
\t\t\t\t\t\t\t\t\tattrStr += attrValueStr;\n\
\t\t\t\t\t\t\t\t}\n\
\t\t\t\t\t\t\t}\n\
\t\t\t\t\t\t}\n\
\n\
\t\t\t\t\t\tstr += attrStr;\n\
\t\t\t\t\t}\n\
\t\t\t\t}\n\
\n\
\t\t\t\t// if this isn't a void tag, but is self-closing, add a solidus. Aaaaand, we're done\n\
\t\t\t\tif ( this.selfClosing && !isVoid ) {\n\
\t\t\t\t\tstr += '/>';\n\
\t\t\t\t\treturn ( this.str = str );\n\
\t\t\t\t}\n\
\n\
\t\t\t\tstr += '>';\n\
\n\
\t\t\t\t// void element? we're done\n\
\t\t\t\tif ( isVoid ) {\n\
\t\t\t\t\treturn ( this.str = str );\n\
\t\t\t\t}\n\
\n\
\t\t\t\t// if this has children, add them\n\
\t\t\t\tstr += fragStr;\n\
\n\
\t\t\t\tstr += '</' + this.tag + '>';\n\
\t\t\t\treturn ( this.str = str );\n\
\t\t\t}\n\
\t\t};\n\
\n\
\n\
\t\tvoidElementNames = 'area base br col command embed hr img input keygen link meta param source track wbr'.split( ' ' );\n\
\t\tallElementNames = 'a abbr acronym address applet area b base basefont bdo big blockquote body br button caption center cite code col colgroup dd del dfn dir div dl dt em fieldset font form frame frameset h1 h2 h3 h4 h5 h6 head hr html i iframe img input ins isindex kbd label legend li link map menu meta noframes noscript object ol p param pre q s samp script select small span strike strong style sub sup textarea title tt u ul var article aside audio bdi canvas command data datagrid datalist details embed eventsource figcaption figure footer header hgroup keygen mark meter nav output progress ruby rp rt section source summary time track video wbr'.split( ' ' );\n\
\t\tclosedByParentClose = 'li dd rt rp optgroup option tbody tfoot tr td th'.split( ' ' );\n\
\n\
\t\tsvgCamelCaseElements = 'altGlyph altGlyphDef altGlyphItem animateColor animateMotion animateTransform clipPath feBlend feColorMatrix feComponentTransfer feComposite feConvolveMatrix feDiffuseLighting feDisplacementMap feDistantLight feFlood feFuncA feFuncB feFuncG feFuncR feGaussianBlur feImage feMerge feMergeNode feMorphology feOffset fePointLight feSpecularLighting feSpotLight feTile feTurbulence foreignObject glyphRef linearGradient radialGradient textPath vkern'.split( ' ' );\n\
\t\tsvgCamelCaseAttributes = 'attributeName attributeType baseFrequency baseProfile calcMode clipPathUnits contentScriptType contentStyleType diffuseConstant edgeMode externalResourcesRequired filterRes filterUnits glyphRef glyphRef gradientTransform gradientTransform gradientUnits gradientUnits kernelMatrix kernelUnitLength kernelUnitLength kernelUnitLength keyPoints keySplines keyTimes lengthAdjust limitingConeAngle markerHeight markerUnits markerWidth maskContentUnits maskUnits numOctaves pathLength patternContentUnits patternTransform patternUnits pointsAtX pointsAtY pointsAtZ preserveAlpha preserveAspectRatio primitiveUnits refX refY repeatCount repeatDur requiredExtensions requiredFeatures specularConstant specularExponent specularExponent spreadMethod spreadMethod startOffset stdDeviation stitchTiles surfaceScale surfaceScale systemLanguage tableValues targetX targetY textLength textLength viewBox viewTarget xChannelSelector yChannelSelector zoomAndPan'.split( ' ' );\n\
\t\t\n\
\t\tmapToLowerCase = function ( items ) {\n\
\t\t\tvar map = {}, i = items.length;\n\
\t\t\twhile ( i-- ) {\n\
\t\t\t\tmap[ items[i].toLowerCase() ] = items[i];\n\
\t\t\t}\n\
\t\t\treturn map;\n\
\t\t};\n\
\n\
\t\tsvgCamelCaseElementsMap = mapToLowerCase( svgCamelCaseElements );\n\
\t\tsvgCamelCaseAttributesMap = mapToLowerCase( svgCamelCaseAttributes );\n\
\n\
\t\tsiblingsByTagName = {\n\
\t\t\tli: [ 'li' ],\n\
\t\t\tdt: [ 'dt', 'dd' ],\n\
\t\t\tdd: [ 'dt', 'dd' ],\n\
\t\t\tp: 'address article aside blockquote dir div dl fieldset footer form h1 h2 h3 h4 h5 h6 header hgroup hr menu nav ol p pre section table ul'.split( ' ' ),\n\
\t\t\trt: [ 'rt', 'rp' ],\n\
\t\t\trp: [ 'rp', 'rt' ],\n\
\t\t\toptgroup: [ 'optgroup' ],\n\
\t\t\toption: [ 'option', 'optgroup' ],\n\
\t\t\tthead: [ 'tbody', 'tfoot' ],\n\
\t\t\ttbody: [ 'tbody', 'tfoot' ],\n\
\t\t\ttr: [ 'tr' ],\n\
\t\t\ttd: [ 'td', 'th' ],\n\
\t\t\tth: [ 'td', 'th' ]\n\
\t\t};\n\
\n\
\t\tonPattern = /^on[a-zA-Z]/;\n\
\n\
\t\tsanitize = function ( attr ) {\n\
\t\t\tvar valid = !onPattern.test( attr.name );\n\
\t\t\treturn valid;\n\
\t\t};\n\
\n\
\t\tfilterAttrs = function ( items ) {\n\
\t\t\tvar attrs, proxies, filtered, i, len, item;\n\
\n\
\t\t\tfiltered = {};\n\
\t\t\tattrs = [];\n\
\t\t\tproxies = [];\n\
\n\
\t\t\tlen = items.length;\n\
\t\t\tfor ( i=0; i<len; i+=1 ) {\n\
\t\t\t\titem = items[i];\n\
\n\
\t\t\t\t// Transition?\n\
\t\t\t\tif ( item.name === 'intro' ) {\n\
\t\t\t\t\tif ( filtered.intro ) {\n\
\t\t\t\t\t\tthrow new Error( 'An element can only have one intro transition' );\n\
\t\t\t\t\t}\n\
\n\
\t\t\t\t\tfiltered.intro = item;\n\
\t\t\t\t} else if ( item.name === 'outro' ) {\n\
\t\t\t\t\tif ( filtered.outro ) {\n\
\t\t\t\t\t\tthrow new Error( 'An element can only have one outro transition' );\n\
\t\t\t\t\t}\n\
\n\
\t\t\t\t\tfiltered.outro = item;\n\
\t\t\t\t}\n\
\n\
\t\t\t\t// Proxy?\n\
\t\t\t\telse if ( item.name.substr( 0, 6 ) === 'proxy-' ) {\n\
\t\t\t\t\titem.name = item.name.substring( 6 );\n\
\t\t\t\t\tproxies[ proxies.length ] = item;\n\
\t\t\t\t}\n\
\n\
\t\t\t\telse if ( item.name.substr( 0, 3 ) === 'on-' ) {\n\
\t\t\t\t\titem.name = item.name.substring( 3 );\n\
\t\t\t\t\tproxies[ proxies.length ] = item;\n\
\t\t\t\t}\n\
\n\
\t\t\t\t// Attribute?\n\
\t\t\t\telse {\n\
\t\t\t\t\tattrs[ attrs.length ] = item;\n\
\t\t\t\t}\n\
\t\t\t}\n\
\n\
\t\t\tfiltered.attrs = attrs;\n\
\t\t\tfiltered.proxies = proxies;\n\
\n\
\t\t\treturn filtered;\n\
\t\t};\n\
\t}());\n\
\n\
\n\
\t// expression\n\
\t(function () {\n\
\n\
\t\tvar getRefs, stringify, stringifyKey, identifier;\n\
\n\
\t\tExpression = function ( token ) {\n\
\t\t\tthis.refs = [];\n\
\n\
\t\t\tgetRefs( token, this.refs );\n\
\t\t\tthis.str = stringify( token, this.refs );\n\
\t\t};\n\
\n\
\t\tExpression.prototype = {\n\
\t\t\ttoJson: function () {\n\
\t\t\t\tif ( this.json ) {\n\
\t\t\t\t\treturn this.json;\n\
\t\t\t\t}\n\
\t\t\t\t\n\
\t\t\t\tthis.json = {\n\
\t\t\t\t\tr: this.refs,\n\
\t\t\t\t\ts: this.str\n\
\t\t\t\t};\n\
\n\
\t\t\t\treturn this.json;\n\
\t\t\t}\n\
\t\t};\n\
\n\
\n\
\t\t// TODO maybe refactor this?\n\
\t\tgetRefs = function ( token, refs ) {\n\
\t\t\tvar i, list;\n\
\n\
\t\t\tif ( token.t === REFERENCE ) {\n\
\t\t\t\tif ( refs.indexOf( token.n ) === -1 ) {\n\
\t\t\t\t\trefs.unshift( token.n );\n\
\t\t\t\t}\n\
\t\t\t}\n\
\n\
\t\t\tlist = token.o || token.m;\n\
\t\t\tif ( list ) {\n\
\t\t\t\tif ( isObject( list ) ) {\n\
\t\t\t\t\tgetRefs( list, refs );\n\
\t\t\t\t} else {\n\
\t\t\t\t\ti = list.length;\n\
\t\t\t\t\twhile ( i-- ) {\n\
\t\t\t\t\t\tgetRefs( list[i], refs );\n\
\t\t\t\t\t}\n\
\t\t\t\t}\n\
\t\t\t}\n\
\n\
\t\t\tif ( token.x ) {\n\
\t\t\t\tgetRefs( token.x, refs );\n\
\t\t\t}\n\
\n\
\t\t\tif ( token.r ) {\n\
\t\t\t\tgetRefs( token.r, refs );\n\
\t\t\t}\n\
\n\
\t\t\tif ( token.v ) {\n\
\t\t\t\tgetRefs( token.v, refs );\n\
\t\t\t}\n\
\t\t};\n\
\n\
\n\
\t\tstringify = function ( token, refs ) {\n\
\t\t\tvar map = function ( item ) {\n\
\t\t\t\treturn stringify( item, refs );\n\
\t\t\t};\n\
\n\
\t\t\tswitch ( token.t ) {\n\
\t\t\t\tcase BOOLEAN_LITERAL:\n\
\t\t\t\tcase GLOBAL:\n\
\t\t\t\tcase NUMBER_LITERAL:\n\
\t\t\t\treturn token.v;\n\
\n\
\t\t\t\tcase STRING_LITERAL:\n\
\t\t\t\treturn \"'\" + token.v.replace( /'/g, \"\\\\'\" ) + \"'\";\n\
\n\
\t\t\t\tcase ARRAY_LITERAL:\n\
\t\t\t\treturn '[' + ( token.m ? token.m.map( map ).join( ',' ) : '' ) + ']';\n\
\n\
\t\t\t\tcase OBJECT_LITERAL:\n\
\t\t\t\treturn '{' + ( token.m ? token.m.map( map ).join( ',' ) : '' ) + '}';\n\
\n\
\t\t\t\tcase KEY_VALUE_PAIR:\n\
\t\t\t\treturn stringifyKey( token.k ) + ':' + stringify( token.v, refs );\n\
\n\
\t\t\t\tcase PREFIX_OPERATOR:\n\
\t\t\t\treturn ( token.s === 'typeof' ? 'typeof ' : token.s ) + stringify( token.o, refs );\n\
\n\
\t\t\t\tcase INFIX_OPERATOR:\n\
\t\t\t\treturn stringify( token.o[0], refs ) + token.s + stringify( token.o[1], refs );\n\
\n\
\t\t\t\tcase INVOCATION:\n\
\t\t\t\treturn stringify( token.x, refs ) + '(' + ( token.o ? token.o.map( map ).join( ',' ) : '' ) + ')';\n\
\n\
\t\t\t\tcase BRACKETED:\n\
\t\t\t\treturn '(' + stringify( token.x, refs ) + ')';\n\
\n\
\t\t\t\tcase MEMBER:\n\
\t\t\t\treturn stringify( token.x, refs ) + stringify( token.r, refs );\n\
\n\
\t\t\t\tcase REFINEMENT:\n\
\t\t\t\treturn ( token.n ? '.' + token.n : '[' + stringify( token.x, refs ) + ']' );\n\
\n\
\t\t\t\tcase CONDITIONAL:\n\
\t\t\t\treturn stringify( token.o[0], refs ) + '?' + stringify( token.o[1], refs ) + ':' + stringify( token.o[2], refs );\n\
\n\
\t\t\t\tcase REFERENCE:\n\
\t\t\t\treturn '${' + refs.indexOf( token.n ) + '}';\n\
\n\
\t\t\t\tdefault:\n\
\t\t\t\tconsole.log( token );\n\
\t\t\t\tthrow new Error( 'Could not stringify expression token. This error is unexpected' );\n\
\t\t\t}\n\
\t\t};\n\
\n\
\t\tstringifyKey = function ( key ) {\n\
\t\t\tif ( key.t === STRING_LITERAL ) {\n\
\t\t\t\treturn identifier.test( key.v ) ? key.v : '\"' + key.v.replace( /\"/g, '\\\\\"' ) + '\"';\n\
\t\t\t}\n\
\n\
\t\t\tif ( key.t === NUMBER_LITERAL ) {\n\
\t\t\t\treturn key.v;\n\
\t\t\t}\n\
\n\
\t\t\treturn key;\n\
\t\t};\n\
\n\
\t\tidentifier = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/;\n\
\n\
\t}());\n\
\n\
}());\n\
(function () {\n\
\n\
\tvar getStringMatch,\n\
\tgetRegexMatcher,\n\
\tallowWhitespace,\n\
\n\
\tgetMustacheOrTriple,\n\
\tgetTag,\n\
\tgetText,\n\
\tgetExpression,\n\
\n\
\tgetDelimiter,\n\
\tgetDelimiterChange,\n\
\tgetName,\n\
\tgetMustacheRef,\n\
\tgetRefinement,\n\
\tgetDotRefinement,\n\
\tgetArrayRefinement,\n\
\tgetArrayMember,\n\
\n\
\tgetSingleQuotedString,\n\
\tgetUnescapedSingleQuotedChars,\n\
\tgetDoubleQuotedString,\n\
\tgetUnescapedDoubleQuotedChars,\n\
\tgetEscapedChars,\n\
\tgetEscapedChar,\n\
\n\
\tfail;\n\
\n\
\n\
\tgetToken = function ( tokenizer ) {\n\
\t\tvar token = getMustacheOrTriple( tokenizer ) ||\n\
\t\t        getTag( tokenizer ) ||\n\
\t\t        getText( tokenizer );\n\
\n\
\t\treturn token;\n\
\t};\n\
\n\
\n\
\n\
\t// helpers\n\
\tfail = function ( tokenizer, expected ) {\n\
\t\tvar remaining = tokenizer.remaining().substr( 0, 40 );\n\
\t\tif ( remaining.length === 40 ) {\n\
\t\t\tremaining += '...';\n\
\t\t}\n\
\t\tthrow new Error( 'Tokenizer failed: unexpected string \"' + remaining + '\" (expected ' + expected + ')' );\n\
\t};\n\
\n\
\tgetStringMatch = function ( tokenizer, string ) {\n\
\t\tvar substr;\n\
\n\
\t\tsubstr = tokenizer.str.substr( tokenizer.pos, string.length );\n\
\n\
\t\tif ( substr === string ) {\n\
\t\t\ttokenizer.pos += string.length;\n\
\t\t\treturn string;\n\
\t\t}\n\
\n\
\t\treturn null;\n\
\t};\n\
\n\
\tgetRegexMatcher = function ( regex ) {\n\
\t\treturn function ( tokenizer ) {\n\
\t\t\tvar match = regex.exec( tokenizer.str.substring( tokenizer.pos ) );\n\
\n\
\t\t\tif ( !match ) {\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\ttokenizer.pos += match[0].length;\n\
\t\t\treturn match[1] || match[0];\n\
\t\t};\n\
\t};\n\
\n\
\tallowWhitespace = function ( tokenizer ) {\n\
\t\tvar match = leadingWhitespace.exec( tokenizer.str.substring( tokenizer.pos ) );\n\
\n\
\t\tif ( !match ) {\n\
\t\t\treturn null;\n\
\t\t}\n\
\n\
\t\ttokenizer.pos += match[0].length;\n\
\t\treturn match[0];\n\
\t};\n\
\n\
\n\
\t// shared\n\
\tgetDelimiter = getRegexMatcher( /^[^\\s=]+/ );\n\
\n\
\tgetDelimiterChange = function ( tokenizer ) {\n\
\t\tvar start, opening, closing;\n\
\n\
\t\tif ( !getStringMatch( tokenizer, '=' ) ) {\n\
\t\t\treturn null;\n\
\t\t}\n\
\n\
\t\tstart = tokenizer.pos;\n\
\n\
\t\t// allow whitespace before new opening delimiter\n\
\t\tallowWhitespace( tokenizer );\n\
\n\
\t\topening = getDelimiter( tokenizer );\n\
\t\tif ( !opening ) {\n\
\t\t\ttokenizer.pos = start;\n\
\t\t\treturn null;\n\
\t\t}\n\
\n\
\t\t// allow whitespace (in fact, it's necessary...)\n\
\t\tallowWhitespace( tokenizer );\n\
\n\
\t\tclosing = getDelimiter( tokenizer );\n\
\t\tif ( !closing ) {\n\
\t\t\ttokenizer.pos = start;\n\
\t\t\treturn null;\n\
\t\t}\n\
\n\
\t\t// allow whitespace before closing '='\n\
\t\tallowWhitespace( tokenizer );\n\
\n\
\t\tif ( !getStringMatch( tokenizer, '=' ) ) {\n\
\t\t\ttokenizer.pos = start;\n\
\t\t\treturn null;\n\
\t\t}\n\
\n\
\t\treturn [ opening, closing ];\n\
\t};\n\
\n\
\tgetName = getRegexMatcher( /^[a-zA-Z_$][a-zA-Z_$0-9]*/ );\n\
\n\
\tgetMustacheRef = function ( tokenizer ) {\n\
\t\tvar start, ref, member, dot, name;\n\
\n\
\t\tstart = tokenizer.pos;\n\
\n\
\t\tdot = getStringMatch( tokenizer, '.' ) || '';\n\
\t\tname = getName( tokenizer ) || '';\n\
\n\
\t\tif ( dot && !name ) {\n\
\t\t\treturn dot;\n\
\t\t}\n\
\n\
\t\tref = dot + name;\n\
\t\tif ( !ref ) {\n\
\t\t\treturn null;\n\
\t\t}\n\
\n\
\t\tmember = getRefinement( tokenizer );\n\
\t\twhile ( member !== null ) {\n\
\t\t\tref += member;\n\
\t\t\tmember = getRefinement( tokenizer );\n\
\t\t}\n\
\n\
\t\treturn ref;\n\
\t};\n\
\n\
\tgetRefinement = function ( tokenizer ) {\n\
\t\treturn getDotRefinement( tokenizer ) || getArrayRefinement( tokenizer );\n\
\t};\n\
\n\
\tgetDotRefinement = getRegexMatcher( /^\\.[a-zA-Z_$0-9]+/ );\n\
\n\
\tgetArrayRefinement = function ( tokenizer ) {\n\
\t\tvar num = getArrayMember( tokenizer );\n\
\n\
\t\tif ( num ) {\n\
\t\t\treturn '.' + num;\n\
\t\t}\n\
\n\
\t\treturn null;\n\
\t};\n\
\n\
\tgetArrayMember = getRegexMatcher( /^\\[(0|[1-9][0-9]*)\\]/ );\n\
\n\
\tgetSingleQuotedString = function ( tokenizer ) {\n\
\t\tvar start, string, escaped, unescaped, next;\n\
\n\
\t\tstart = tokenizer.pos;\n\
\n\
\t\tstring = '';\n\
\n\
\t\tescaped = getEscapedChars( tokenizer );\n\
\t\tif ( escaped ) {\n\
\t\t\tstring += escaped;\n\
\t\t}\n\
\n\
\t\tunescaped = getUnescapedSingleQuotedChars( tokenizer );\n\
\t\tif ( unescaped ) {\n\
\t\t\tstring += unescaped;\n\
\t\t}\n\
\t\tif ( string ) {\n\
\t\t\tnext = getSingleQuotedString( tokenizer );\n\
\t\t\twhile ( next ) {\n\
\t\t\t\tstring += next;\n\
\t\t\t\tnext = getSingleQuotedString( tokenizer );\n\
\t\t\t}\n\
\t\t}\n\
\n\
\t\treturn string;\n\
\t};\n\
\n\
\tgetUnescapedSingleQuotedChars = getRegexMatcher( /^[^\\\\']+/ );\n\
\n\
\tgetDoubleQuotedString = function ( tokenizer ) {\n\
\t\tvar start, string, escaped, unescaped, next;\n\
\n\
\t\tstart = tokenizer.pos;\n\
\n\
\t\tstring = '';\n\
\n\
\t\tescaped = getEscapedChars( tokenizer );\n\
\t\tif ( escaped ) {\n\
\t\t\tstring += escaped;\n\
\t\t}\n\
\n\
\t\tunescaped = getUnescapedDoubleQuotedChars( tokenizer );\n\
\t\tif ( unescaped ) {\n\
\t\t\tstring += unescaped;\n\
\t\t}\n\
\n\
\t\tif ( !string ) {\n\
\t\t\treturn '';\n\
\t\t}\n\
\n\
\t\tnext = getDoubleQuotedString( tokenizer );\n\
\t\twhile ( next !== '' ) {\n\
\t\t\tstring += next;\n\
\t\t}\n\
\n\
\t\treturn string;\n\
\t};\n\
\n\
\tgetUnescapedDoubleQuotedChars = getRegexMatcher( /^[^\\\\\"]+/ );\n\
\n\
\tgetEscapedChars = function ( tokenizer ) {\n\
\t\tvar chars = '', character;\n\
\n\
\t\tcharacter = getEscapedChar( tokenizer );\n\
\t\twhile ( character ) {\n\
\t\t\tchars += character;\n\
\t\t\tcharacter = getEscapedChar( tokenizer );\n\
\t\t}\n\
\n\
\t\treturn chars || null;\n\
\t};\n\
\n\
\tgetEscapedChar = function ( tokenizer ) {\n\
\t\tvar character;\n\
\n\
\t\tif ( !getStringMatch( tokenizer, '\\\\' ) ) {\n\
\t\t\treturn null;\n\
\t\t}\n\
\n\
\t\tcharacter = tokenizer.str.charAt( tokenizer.pos );\n\
\t\ttokenizer.pos += 1;\n\
\n\
\t\treturn character;\n\
\t};\n\
\n\
\t\n\
\n\
\n\
\n\
\t// mustache / triple\n\
\t(function () {\n\
\t\tvar getMustache,\n\
\t\t\tgetTriple,\n\
\t\t\tgetMustacheContent,\n\
\t\t\tgetMustacheType,\n\
\t\t\tgetIndexRef,\n\
\t\t\tmustacheTypes;\n\
\n\
\t\tgetMustacheOrTriple = function ( tokenizer ) {\n\
\t\t\t// if the triple delimiter (e.g. '{{{') is longer than the regular mustache\n\
\t\t\t// delimiter (e.g. '{{') then we need to try and find a triple first. Otherwise\n\
\t\t\t// we will get a false positive if the mustache delimiter is a substring of the\n\
\t\t\t// triple delimiter, as in the default case\n\
\t\t\tif ( tokenizer.tripleDelimiters[0].length > tokenizer.delimiters[0].length ) {\n\
\t\t\t\treturn getTriple( tokenizer ) || getMustache( tokenizer );\n\
\t\t\t}\n\
\n\
\t\t\treturn getMustache( tokenizer ) || getTriple( tokenizer );\n\
\t\t};\n\
\n\
\t\tgetMustache = function ( tokenizer ) {\n\
\t\t\tvar start = tokenizer.pos, content;\n\
\n\
\t\t\tif ( !getStringMatch( tokenizer, tokenizer.delimiters[0] ) ) {\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\t// delimiter change?\n\
\t\t\tcontent = getDelimiterChange( tokenizer );\n\
\t\t\tif ( content ) {\n\
\t\t\t\t// find closing delimiter or abort...\n\
\t\t\t\tif ( !getStringMatch( tokenizer, tokenizer.delimiters[1] ) ) {\n\
\t\t\t\t\ttokenizer.pos = start;\n\
\t\t\t\t\treturn null;\n\
\t\t\t\t}\n\
\n\
\t\t\t\t// ...then make the switch\n\
\t\t\t\ttokenizer.delimiters = content;\n\
\t\t\t\treturn { type: MUSTACHE, mustacheType: DELIMCHANGE };\n\
\t\t\t}\n\
\n\
\t\t\tcontent = getMustacheContent( tokenizer );\n\
\n\
\t\t\tif ( content === null ) {\n\
\t\t\t\ttokenizer.pos = start;\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\t// allow whitespace before closing delimiter\n\
\t\t\tallowWhitespace( tokenizer );\n\
\n\
\t\t\tif ( !getStringMatch( tokenizer, tokenizer.delimiters[1] ) ) {\n\
\t\t\t\tfail( tokenizer, '\"' + tokenizer.delimiters[1] + '\"' );\n\
\t\t\t}\n\
\n\
\t\t\treturn content;\n\
\t\t};\n\
\n\
\t\tgetTriple = function ( tokenizer ) {\n\
\t\t\tvar start = tokenizer.pos, content;\n\
\n\
\t\t\tif ( !getStringMatch( tokenizer, tokenizer.tripleDelimiters[0] ) ) {\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\t// delimiter change?\n\
\t\t\tcontent = getDelimiterChange( tokenizer );\n\
\t\t\tif ( content ) {\n\
\t\t\t\t// find closing delimiter or abort...\n\
\t\t\t\tif ( !getStringMatch( tokenizer, tokenizer.tripleDelimiters[1] ) ) {\n\
\t\t\t\t\ttokenizer.pos = start;\n\
\t\t\t\t\treturn null;\n\
\t\t\t\t}\n\
\n\
\t\t\t\t// ...then make the switch\n\
\t\t\t\ttokenizer.tripleDelimiters = content;\n\
\t\t\t\treturn { type: MUSTACHE, mustacheType: DELIMCHANGE };\n\
\t\t\t}\n\
\n\
\t\t\t// allow whitespace between opening delimiter and reference\n\
\t\t\tallowWhitespace( tokenizer );\n\
\n\
\t\t\tcontent = getMustacheContent( tokenizer, true );\n\
\n\
\t\t\tif ( content === null ) {\n\
\t\t\t\ttokenizer.pos = start;\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\t// allow whitespace between reference and closing delimiter\n\
\t\t\tallowWhitespace( tokenizer );\n\
\n\
\t\t\tif ( !getStringMatch( tokenizer, tokenizer.tripleDelimiters[1] ) ) {\n\
\t\t\t\ttokenizer.pos = start;\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\treturn content;\n\
\t\t};\n\
\n\
\t\tgetMustacheContent = function ( tokenizer, isTriple ) {\n\
\t\t\tvar start, mustache, type, expr, i, remaining, index;\n\
\n\
\t\t\tstart = tokenizer.pos;\n\
\n\
\t\t\tmustache = { type: isTriple ? TRIPLE : MUSTACHE };\n\
\n\
\t\t\t// mustache type\n\
\t\t\tif ( !isTriple ) {\n\
\t\t\t\ttype = getMustacheType( tokenizer );\n\
\t\t\t\tmustache.mustacheType = type || INTERPOLATOR; // default\n\
\n\
\t\t\t\t// if it's a comment or a section closer, allow any contents except '}}'\n\
\t\t\t\tif ( type === COMMENT || type === CLOSING ) {\n\
\t\t\t\t\tremaining = tokenizer.remaining();\n\
\t\t\t\t\tindex = remaining.indexOf( tokenizer.delimiters[1] );\n\
\n\
\t\t\t\t\tif ( index !== -1 ) {\n\
\t\t\t\t\t\tmustache.ref = remaining.substr( 0, index );\n\
\t\t\t\t\t\ttokenizer.pos += index;\n\
\t\t\t\t\t\treturn mustache;\n\
\t\t\t\t\t}\n\
\t\t\t\t}\n\
\t\t\t}\n\
\n\
\t\t\t// allow whitespace\n\
\t\t\tallowWhitespace( tokenizer );\n\
\n\
\t\t\t// get expression\n\
\t\t\texpr = getExpression( tokenizer );\n\
\n\
\t\t\twhile ( expr.t === BRACKETED && expr.x ) {\n\
\t\t\t\texpr = expr.x;\n\
\t\t\t}\n\
\n\
\t\t\tif ( expr.t === REFERENCE ) {\n\
\t\t\t\tmustache.ref = expr.n;\n\
\t\t\t} else {\n\
\t\t\t\tmustache.expression = expr;\n\
\t\t\t}\n\
\n\
\t\t\t// optional index reference\n\
\t\t\ti = getIndexRef( tokenizer );\n\
\t\t\tif ( i !== null ) {\n\
\t\t\t\tmustache.indexRef = i;\n\
\t\t\t}\n\
\n\
\t\t\treturn mustache;\n\
\t\t};\n\
\n\
\t\tmustacheTypes = {\n\
\t\t\t'#': SECTION,\n\
\t\t\t'^': INVERTED,\n\
\t\t\t'/': CLOSING,\n\
\t\t\t'>': PARTIAL,\n\
\t\t\t'!': COMMENT,\n\
\t\t\t'&': INTERPOLATOR\n\
\t\t};\n\
\n\
\t\tgetMustacheType = function ( tokenizer ) {\n\
\t\t\tvar type = mustacheTypes[ tokenizer.str.charAt( tokenizer.pos ) ];\n\
\n\
\t\t\tif ( !type ) {\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\ttokenizer.pos += 1;\n\
\t\t\treturn type;\n\
\t\t};\n\
\n\
\t\tgetIndexRef = getRegexMatcher( /^\\s*:\\s*([a-zA-Z_$][a-zA-Z_$0-9]*)/ );\n\
\t}());\n\
\n\
\n\
\t// tag\n\
\t(function () {\n\
\t\tvar getOpeningTag,\n\
\t\tgetClosingTag,\n\
\t\tgetTagName,\n\
\t\tgetAttributes,\n\
\t\tgetAttribute,\n\
\t\tgetAttributeName,\n\
\t\tgetAttributeValue,\n\
\t\tgetUnquotedAttributeValue,\n\
\t\tgetUnquotedAttributeValueToken,\n\
\t\tgetUnquotedAttributeValueText,\n\
\t\tgetSingleQuotedAttributeValue,\n\
\t\tgetSingleQuotedStringToken,\n\
\t\tgetDoubleQuotedAttributeValue,\n\
\t\tgetDoubleQuotedStringToken;\n\
\n\
\t\tgetTag = function ( tokenizer ) {\n\
\t\t\treturn ( getOpeningTag( tokenizer ) || getClosingTag( tokenizer ) );\n\
\t\t};\n\
\n\
\t\tgetOpeningTag = function ( tokenizer ) {\n\
\t\t\tvar start, tag, attrs;\n\
\n\
\t\t\tstart = tokenizer.pos;\n\
\n\
\t\t\tif ( !getStringMatch( tokenizer, '<' ) ) {\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\ttag = {\n\
\t\t\t\ttype: TAG\n\
\t\t\t};\n\
\n\
\t\t\t// tag name\n\
\t\t\ttag.name = getTagName( tokenizer );\n\
\t\t\tif ( !tag.name ) {\n\
\t\t\t\ttokenizer.pos = start;\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\t// attributes\n\
\t\t\tattrs = getAttributes( tokenizer );\n\
\t\t\tif ( attrs ) {\n\
\t\t\t\ttag.attrs = attrs;\n\
\t\t\t}\n\
\n\
\t\t\t// allow whitespace before closing solidus\n\
\t\t\tallowWhitespace( tokenizer );\n\
\n\
\t\t\t// self-closing solidus?\n\
\t\t\tif ( getStringMatch( tokenizer, '/' ) ) {\n\
\t\t\t\ttag.selfClosing = true;\n\
\t\t\t}\n\
\n\
\t\t\t// closing angle bracket\n\
\t\t\tif ( !getStringMatch( tokenizer, '>' ) ) {\n\
\t\t\t\ttokenizer.pos = start;\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\treturn tag;\n\
\t\t};\n\
\n\
\t\tgetClosingTag = function ( tokenizer ) {\n\
\t\t\tvar start, tag;\n\
\n\
\t\t\tstart = tokenizer.pos;\n\
\n\
\t\t\tif ( !getStringMatch( tokenizer, '<' ) ) {\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\ttag = { type: TAG, closing: true };\n\
\n\
\t\t\t// closing solidus\n\
\t\t\tif ( !getStringMatch( tokenizer, '/' ) ) {\n\
\t\t\t\tthrow new Error( 'Unexpected character ' + tokenizer.remaining().charAt( 0 ) + ' (expected \"/\")' );\n\
\t\t\t}\n\
\n\
\t\t\t// tag name\n\
\t\t\ttag.name = getTagName( tokenizer );\n\
\t\t\tif ( !tag.name ) {\n\
\t\t\t\tthrow new Error( 'Unexpected character ' + tokenizer.remaining().charAt( 0 ) + ' (expected tag name)' );\n\
\t\t\t}\n\
\n\
\t\t\t// closing angle bracket\n\
\t\t\tif ( !getStringMatch( tokenizer, '>' ) ) {\n\
\t\t\t\tthrow new Error( 'Unexpected character ' + tokenizer.remaining().charAt( 0 ) + ' (expected \">\")' );\n\
\t\t\t}\n\
\n\
\t\t\treturn tag;\n\
\t\t};\n\
\n\
\t\tgetTagName = getRegexMatcher( /^[a-zA-Z][a-zA-Z0-9\\-]*/ );\n\
\n\
\t\tgetAttributes = function ( tokenizer ) {\n\
\t\t\tvar start, attrs, attr;\n\
\n\
\t\t\tstart = tokenizer.pos;\n\
\n\
\t\t\tallowWhitespace( tokenizer );\n\
\n\
\t\t\tattr = getAttribute( tokenizer );\n\
\n\
\t\t\tif ( !attr ) {\n\
\t\t\t\ttokenizer.pos = start;\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\tattrs = [];\n\
\n\
\t\t\twhile ( attr !== null ) {\n\
\t\t\t\tattrs[ attrs.length ] = attr;\n\
\n\
\t\t\t\tallowWhitespace( tokenizer );\n\
\t\t\t\tattr = getAttribute( tokenizer );\n\
\t\t\t}\n\
\n\
\t\t\treturn attrs;\n\
\t\t};\n\
\n\
\t\tgetAttribute = function ( tokenizer ) {\n\
\t\t\tvar attr, name, value;\n\
\n\
\t\t\tname = getAttributeName( tokenizer );\n\
\t\t\tif ( !name ) {\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\tattr = {\n\
\t\t\t\tname: name\n\
\t\t\t};\n\
\n\
\t\t\tvalue = getAttributeValue( tokenizer );\n\
\t\t\tif ( value ) {\n\
\t\t\t\tattr.value = value;\n\
\t\t\t}\n\
\n\
\t\t\treturn attr;\n\
\t\t};\n\
\n\
\t\tgetAttributeName = getRegexMatcher( /^[^\\s\"'>\\/=]+/ );\n\
\n\
\t\t\n\
\n\
\t\tgetAttributeValue = function ( tokenizer ) {\n\
\t\t\tvar start, value;\n\
\n\
\t\t\tstart = tokenizer.pos;\n\
\n\
\t\t\tallowWhitespace( tokenizer );\n\
\n\
\t\t\tif ( !getStringMatch( tokenizer, '=' ) ) {\n\
\t\t\t\ttokenizer.pos = start;\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\tvalue = getSingleQuotedAttributeValue( tokenizer ) || getDoubleQuotedAttributeValue( tokenizer ) || getUnquotedAttributeValue( tokenizer );\n\
\n\
\t\t\tif ( value === null ) {\n\
\t\t\t\ttokenizer.pos = start;\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\treturn value;\n\
\t\t};\n\
\n\
\t\tgetUnquotedAttributeValueText = getRegexMatcher( /^[^\\s\"'=<>`]+/ );\n\
\n\
\t\tgetUnquotedAttributeValueToken = function ( tokenizer ) {\n\
\t\t\tvar start, text, index;\n\
\n\
\t\t\tstart = tokenizer.pos;\n\
\n\
\t\t\ttext = getUnquotedAttributeValueText( tokenizer );\n\
\n\
\t\t\tif ( !text ) {\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\tif ( ( index = text.indexOf( tokenizer.delimiters[0] ) ) !== -1 ) {\n\
\t\t\t\ttext = text.substr( 0, index );\n\
\t\t\t\ttokenizer.pos = start + text.length;\n\
\t\t\t}\n\
\n\
\t\t\treturn {\n\
\t\t\t\ttype: TEXT,\n\
\t\t\t\tvalue: text\n\
\t\t\t};\n\
\t\t};\n\
\n\
\t\tgetUnquotedAttributeValue = function ( tokenizer ) {\n\
\t\t\tvar tokens, token;\n\
\n\
\t\t\ttokens = [];\n\
\n\
\t\t\ttoken = getMustacheOrTriple( tokenizer ) || getUnquotedAttributeValueToken( tokenizer );\n\
\t\t\twhile ( token !== null ) {\n\
\t\t\t\ttokens[ tokens.length ] = token;\n\
\t\t\t\ttoken = getMustacheOrTriple( tokenizer ) || getUnquotedAttributeValueToken( tokenizer );\n\
\t\t\t}\n\
\n\
\t\t\tif ( !tokens.length ) {\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\treturn tokens;\n\
\t\t};\n\
\n\
\n\
\t\tgetSingleQuotedStringToken = function ( tokenizer ) {\n\
\t\t\tvar start, text, index;\n\
\n\
\t\t\tstart = tokenizer.pos;\n\
\n\
\t\t\ttext = getSingleQuotedString( tokenizer );\n\
\n\
\t\t\tif ( !text ) {\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\tif ( ( index = text.indexOf( tokenizer.delimiters[0] ) ) !== -1 ) {\n\
\t\t\t\ttext = text.substr( 0, index );\n\
\t\t\t\ttokenizer.pos = start + text.length;\n\
\t\t\t}\n\
\n\
\t\t\treturn {\n\
\t\t\t\ttype: TEXT,\n\
\t\t\t\tvalue: text\n\
\t\t\t};\n\
\t\t};\n\
\n\
\t\tgetSingleQuotedAttributeValue = function ( tokenizer ) {\n\
\t\t\tvar start, tokens, token;\n\
\n\
\t\t\tstart = tokenizer.pos;\n\
\n\
\t\t\tif ( !getStringMatch( tokenizer, \"'\" ) ) {\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\ttokens = [];\n\
\n\
\t\t\ttoken = getMustacheOrTriple( tokenizer ) || getSingleQuotedStringToken( tokenizer );\n\
\t\t\twhile ( token !== null ) {\n\
\t\t\t\ttokens[ tokens.length ] = token;\n\
\t\t\t\ttoken = getMustacheOrTriple( tokenizer ) || getSingleQuotedStringToken( tokenizer );\n\
\t\t\t}\n\
\n\
\t\t\tif ( !getStringMatch( tokenizer, \"'\" ) ) {\n\
\t\t\t\ttokenizer.pos = start;\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\treturn tokens;\n\
\n\
\t\t};\n\
\n\
\t\tgetDoubleQuotedStringToken = function ( tokenizer ) {\n\
\t\t\tvar start, text, index;\n\
\n\
\t\t\tstart = tokenizer.pos;\n\
\n\
\t\t\ttext = getDoubleQuotedString( tokenizer );\n\
\n\
\t\t\tif ( !text ) {\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\tif ( ( index = text.indexOf( tokenizer.delimiters[0] ) ) !== -1 ) {\n\
\t\t\t\ttext = text.substr( 0, index );\n\
\t\t\t\ttokenizer.pos = start + text.length;\n\
\t\t\t}\n\
\n\
\t\t\treturn {\n\
\t\t\t\ttype: TEXT,\n\
\t\t\t\tvalue: text\n\
\t\t\t};\n\
\t\t};\n\
\n\
\t\tgetDoubleQuotedAttributeValue = function ( tokenizer ) {\n\
\t\t\tvar start, tokens, token;\n\
\n\
\t\t\tstart = tokenizer.pos;\n\
\n\
\t\t\tif ( !getStringMatch( tokenizer, '\"' ) ) {\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\ttokens = [];\n\
\n\
\t\t\ttoken = getMustacheOrTriple( tokenizer ) || getDoubleQuotedStringToken( tokenizer );\n\
\t\t\twhile ( token !== null ) {\n\
\t\t\t\ttokens[ tokens.length ] = token;\n\
\t\t\t\ttoken = getMustacheOrTriple( tokenizer ) || getDoubleQuotedStringToken( tokenizer );\n\
\t\t\t}\n\
\n\
\t\t\tif ( !getStringMatch( tokenizer, '\"' ) ) {\n\
\t\t\t\ttokenizer.pos = start;\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\treturn tokens;\n\
\n\
\t\t};\n\
\t}());\n\
\n\
\n\
\t// text\n\
\t(function () {\n\
\t\tgetText = function ( tokenizer ) {\n\
\t\t\tvar minIndex, text;\n\
\n\
\t\t\tminIndex = tokenizer.str.length;\n\
\n\
\t\t\t// anything goes except opening delimiters or a '<'\n\
\t\t\t[ tokenizer.delimiters[0], tokenizer.tripleDelimiters[0], '<' ].forEach( function ( substr ) {\n\
\t\t\t\tvar index = tokenizer.str.indexOf( substr, tokenizer.pos );\n\
\n\
\t\t\t\tif ( index !== -1 ) {\n\
\t\t\t\t\tminIndex = Math.min( index, minIndex );\n\
\t\t\t\t}\n\
\t\t\t});\n\
\n\
\t\t\tif ( minIndex === tokenizer.pos ) {\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\ttext = tokenizer.str.substring( tokenizer.pos, minIndex );\n\
\t\t\ttokenizer.pos = minIndex;\n\
\n\
\t\t\treturn {\n\
\t\t\t\ttype: TEXT,\n\
\t\t\t\tvalue: text\n\
\t\t\t};\n\
\n\
\t\t};\n\
\t}());\n\
\n\
\n\
\t// expression\n\
\t(function () {\n\
\t\tvar getExpressionList,\n\
\t\tmakePrefixSequenceMatcher,\n\
\t\tmakeInfixSequenceMatcher,\n\
\t\tgetRightToLeftSequenceMatcher,\n\
\t\tgetBracketedExpression,\n\
\t\tgetPrimary,\n\
\t\tgetMember,\n\
\t\tgetInvocation,\n\
\t\tgetTypeOf,\n\
\t\tgetLogicalOr,\n\
\t\tgetConditional,\n\
\t\t\n\
\t\tgetDigits,\n\
\t\tgetExponent,\n\
\t\tgetFraction,\n\
\t\tgetInteger,\n\
\t\t\n\
\t\tgetReference,\n\
\t\tgetRefinement,\n\
\n\
\t\tgetLiteral,\n\
\t\tgetArrayLiteral,\n\
\t\tgetBooleanLiteral,\n\
\t\tgetNumberLiteral,\n\
\t\tgetStringLiteral,\n\
\t\tgetObjectLiteral,\n\
\t\tgetGlobal,\n\
\n\
\t\tgetKeyValuePairs,\n\
\t\tgetKeyValuePair,\n\
\t\tgetKey,\n\
\n\
\t\tglobals;\n\
\n\
\t\tgetExpression = function ( tokenizer ) {\n\
\n\
\t\t\tvar start, expression, fns, fn, i, len;\n\
\n\
\t\t\tstart = tokenizer.pos;\n\
\n\
\t\t\t// The conditional operator is the lowest precedence operator (except yield,\n\
\t\t\t// assignment operators, and commas, none of which are supported), so we\n\
\t\t\t// start there. If it doesn't match, it 'falls through' to progressively\n\
\t\t\t// higher precedence operators, until it eventually matches (or fails to\n\
\t\t\t// match) a 'primary' - a literal or a reference. This way, the abstract syntax\n\
\t\t\t// tree has everything in its proper place, i.e. 2 + 3 * 4 === 14, not 20.\n\
\t\t\texpression = getConditional( tokenizer );\n\
\n\
\t\t\treturn expression;\n\
\t\t};\n\
\n\
\t\tgetExpressionList = function ( tokenizer ) {\n\
\t\t\tvar start, expressions, expr, next;\n\
\n\
\t\t\tstart = tokenizer.pos;\n\
\n\
\t\t\tallowWhitespace( tokenizer );\n\
\n\
\t\t\texpr = getExpression( tokenizer );\n\
\n\
\t\t\tif ( expr === null ) {\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\texpressions = [ expr ];\n\
\n\
\t\t\t// allow whitespace between expression and ','\n\
\t\t\tallowWhitespace( tokenizer );\n\
\n\
\t\t\tif ( getStringMatch( tokenizer, ',' ) ) {\n\
\t\t\t\tnext = getExpressionList( tokenizer );\n\
\t\t\t\tif ( next === null ) {\n\
\t\t\t\t\ttokenizer.pos = start;\n\
\t\t\t\t\treturn null;\n\
\t\t\t\t}\n\
\n\
\t\t\t\texpressions = expressions.concat( next );\n\
\t\t\t}\n\
\n\
\t\t\treturn expressions;\n\
\t\t};\n\
\n\
\t\tgetBracketedExpression = function ( tokenizer ) {\n\
\t\t\tvar start, expr;\n\
\n\
\t\t\tstart = tokenizer.pos;\n\
\n\
\t\t\tif ( !getStringMatch( tokenizer, '(' ) ) {\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\tallowWhitespace( tokenizer );\n\
\n\
\t\t\texpr = getExpression( tokenizer );\n\
\t\t\tif ( !expr ) {\n\
\t\t\t\ttokenizer.pos = start;\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\tallowWhitespace( tokenizer );\n\
\n\
\t\t\tif ( !getStringMatch( tokenizer, ')' ) ) {\n\
\t\t\t\ttokenizer.pos = start;\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\treturn {\n\
\t\t\t\tt: BRACKETED,\n\
\t\t\t\tx: expr\n\
\t\t\t};\n\
\t\t};\n\
\n\
\t\tgetPrimary = function ( tokenizer ) {\n\
\t\t\treturn getLiteral( tokenizer )\n\
\t\t\t    || getReference( tokenizer )\n\
\t\t\t    || getBracketedExpression( tokenizer );\n\
\t\t};\n\
\n\
\t\tgetMember = function ( tokenizer ) {\n\
\t\t\tvar start, expression, name, refinement, member;\n\
\n\
\t\t\texpression = getPrimary( tokenizer );\n\
\t\t\tif ( !expression ) {\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\trefinement = getRefinement( tokenizer );\n\
\t\t\tif ( !refinement ) {\n\
\t\t\t\treturn expression;\n\
\t\t\t}\n\
\n\
\t\t\twhile ( refinement !== null ) {\n\
\t\t\t\tmember = {\n\
\t\t\t\t\tt: MEMBER,\n\
\t\t\t\t\tx: expression,\n\
\t\t\t\t\tr: refinement\n\
\t\t\t\t};\n\
\n\
\t\t\t\texpression = member;\n\
\t\t\t\trefinement = getRefinement( tokenizer );\n\
\t\t\t}\n\
\n\
\t\t\treturn member;\n\
\t\t};\n\
\n\
\t\tgetInvocation = function ( tokenizer ) {\n\
\t\t\tvar start, expression, expressionList, result;\n\
\n\
\t\t\texpression = getMember( tokenizer );\n\
\t\t\tif ( !expression ) {\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\tstart = tokenizer.pos;\n\
\n\
\t\t\tif ( !getStringMatch( tokenizer, '(' ) ) {\n\
\t\t\t\treturn expression;\n\
\t\t\t}\n\
\n\
\t\t\tallowWhitespace( tokenizer );\n\
\t\t\texpressionList = getExpressionList( tokenizer );\n\
\n\
\t\t\tallowWhitespace( tokenizer );\n\
\n\
\t\t\tif ( !getStringMatch( tokenizer, ')' ) ) {\n\
\t\t\t\ttokenizer.pos = start;\n\
\t\t\t\treturn expression;\n\
\t\t\t}\n\
\n\
\t\t\tresult = {\n\
\t\t\t\tt: INVOCATION,\n\
\t\t\t\tx: expression\n\
\t\t\t};\n\
\n\
\t\t\tif ( expressionList ) {\n\
\t\t\t\tresult.o = expressionList;\n\
\t\t\t}\n\
\n\
\t\t\treturn result;\n\
\t\t};\n\
\n\
\t\t// right-to-left\n\
\t\tmakePrefixSequenceMatcher = function ( symbol, fallthrough ) {\n\
\t\t\treturn function ( tokenizer ) {\n\
\t\t\t\tvar start, expression;\n\
\n\
\t\t\t\tif ( !getStringMatch( tokenizer, symbol ) ) {\n\
\t\t\t\t\treturn fallthrough( tokenizer );\n\
\t\t\t\t}\n\
\n\
\t\t\t\tstart = tokenizer.pos;\n\
\n\
\t\t\t\tallowWhitespace( tokenizer );\n\
\n\
\t\t\t\texpression = getExpression( tokenizer );\n\
\t\t\t\tif ( !expression ) {\n\
\t\t\t\t\tfail( tokenizer, 'an expression' );\n\
\t\t\t\t}\n\
\n\
\t\t\t\treturn {\n\
\t\t\t\t\ts: symbol,\n\
\t\t\t\t\to: expression,\n\
\t\t\t\t\tt: PREFIX_OPERATOR\n\
\t\t\t\t};\n\
\t\t\t};\n\
\t\t};\n\
\n\
\t\t// create all prefix sequence matchers\n\
\t\t(function () {\n\
\t\t\tvar i, len, matcher, prefixOperators, fallthrough;\n\
\n\
\t\t\tprefixOperators = '! ~ + - typeof'.split( ' ' );\n\
\n\
\t\t\t// An invocation operator is higher precedence than logical-not\n\
\t\t\tfallthrough = getInvocation;\n\
\t\t\tfor ( i=0, len=prefixOperators.length; i<len; i+=1 ) {\n\
\t\t\t\tmatcher = makePrefixSequenceMatcher( prefixOperators[i], fallthrough );\n\
\t\t\t\tfallthrough = matcher;\n\
\t\t\t}\n\
\n\
\t\t\t// typeof operator is higher precedence than multiplication, so provides the\n\
\t\t\t// fallthrough for the multiplication sequence matcher we're about to create\n\
\t\t\t// (we're skipping void and delete)\n\
\t\t\tgetTypeOf = fallthrough;\n\
\t\t}());\n\
\n\
\n\
\t\tmakeInfixSequenceMatcher = function ( symbol, fallthrough ) {\n\
\t\t\treturn function ( tokenizer ) {\n\
\t\t\t\tvar start, left, right;\n\
\n\
\t\t\t\tleft = fallthrough( tokenizer );\n\
\t\t\t\tif ( !left ) {\n\
\t\t\t\t\treturn null;\n\
\t\t\t\t}\n\
\n\
\t\t\t\tstart = tokenizer.pos;\n\
\n\
\t\t\t\tallowWhitespace( tokenizer );\n\
\n\
\t\t\t\tif ( !getStringMatch( tokenizer, symbol ) ) {\n\
\t\t\t\t\ttokenizer.pos = start;\n\
\t\t\t\t\treturn left;\n\
\t\t\t\t}\n\
\n\
\t\t\t\tallowWhitespace( tokenizer );\n\
\n\
\t\t\t\tright = getExpression( tokenizer );\n\
\t\t\t\tif ( !right ) {\n\
\t\t\t\t\ttokenizer.pos = start;\n\
\t\t\t\t\treturn left;\n\
\t\t\t\t}\n\
\n\
\t\t\t\treturn {\n\
\t\t\t\t\tt: INFIX_OPERATOR,\n\
\t\t\t\t\ts: symbol,\n\
\t\t\t\t\to: [ left, right ]\n\
\t\t\t\t};\n\
\t\t\t};\n\
\t\t};\n\
\n\
\t\t// create all infix sequence matchers\n\
\t\t(function () {\n\
\t\t\tvar i, len, matcher, infixOperators, fallthrough;\n\
\n\
\t\t\t// All the infix operators on order of precedence (source: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Operators/Operator_Precedence)\n\
\t\t\t// Each sequence matcher will initially fall through to its higher precedence\n\
\t\t\t// neighbour, and only attempt to match if one of the higher precedence operators\n\
\t\t\t// (or, ultimately, a literal, reference, or bracketed expression) already matched\n\
\t\t\tinfixOperators = '* / % + - << >> >>> < <= > >= in instanceof == != === !== & ^ | && ||'.split( ' ' );\n\
\n\
\t\t\t// A typeof operator is higher precedence than multiplication\n\
\t\t\tfallthrough = getTypeOf;\n\
\t\t\tfor ( i=0, len=infixOperators.length; i<len; i+=1 ) {\n\
\t\t\t\tmatcher = makeInfixSequenceMatcher( infixOperators[i], fallthrough );\n\
\t\t\t\tfallthrough = matcher;\n\
\t\t\t}\n\
\n\
\t\t\t// Logical OR is the fallthrough for the conditional matcher\n\
\t\t\tgetLogicalOr = fallthrough;\n\
\t\t}());\n\
\t\t\n\
\n\
\t\t// The conditional operator is the lowest precedence operator, so we start here\n\
\t\tgetConditional = function ( tokenizer ) {\n\
\t\t\tvar start, expression, ifTrue, ifFalse;\n\
\n\
\t\t\texpression = getLogicalOr( tokenizer );\n\
\t\t\tif ( !expression ) {\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\tstart = tokenizer.pos;\n\
\n\
\t\t\tallowWhitespace( tokenizer );\n\
\n\
\t\t\tif ( !getStringMatch( tokenizer, '?' ) ) {\n\
\t\t\t\ttokenizer.pos = start;\n\
\t\t\t\treturn expression;\n\
\t\t\t}\n\
\n\
\t\t\tallowWhitespace( tokenizer );\n\
\n\
\t\t\tifTrue = getExpression( tokenizer );\n\
\t\t\tif ( !ifTrue ) {\n\
\t\t\t\ttokenizer.pos = start;\n\
\t\t\t\treturn expression;\n\
\t\t\t}\n\
\n\
\t\t\tallowWhitespace( tokenizer );\n\
\n\
\t\t\tif ( !getStringMatch( tokenizer, ':' ) ) {\n\
\t\t\t\ttokenizer.pos = start;\n\
\t\t\t\treturn expression;\n\
\t\t\t}\n\
\n\
\t\t\tallowWhitespace( tokenizer );\n\
\n\
\t\t\tifFalse = getExpression( tokenizer );\n\
\t\t\tif ( !ifFalse ) {\n\
\t\t\t\ttokenizer.pos = start;\n\
\t\t\t\treturn expression;\n\
\t\t\t}\n\
\n\
\t\t\treturn {\n\
\t\t\t\tt: CONDITIONAL,\n\
\t\t\t\to: [ expression, ifTrue, ifFalse ]\n\
\t\t\t};\n\
\t\t};\n\
\t\t\n\
\n\
\n\
\t\tgetDigits = getRegexMatcher( /^[0-9]+/ );\n\
\t\tgetExponent = getRegexMatcher( /^[eE][\\-+]?[0-9]+/ );\n\
\t\tgetFraction = getRegexMatcher( /^\\.[0-9]+/ );\n\
\t\tgetInteger = getRegexMatcher( /^(0|[1-9][0-9]*)/ );\n\
\n\
\n\
\t\tgetReference = function ( tokenizer ) {\n\
\t\t\tvar startPos, name, dot, combo, refinement, lastDotIndex;\n\
\n\
\t\t\tstartPos = tokenizer.pos;\n\
\n\
\t\t\t// could be an implicit iterator ('.'), a prefixed reference ('.name') or a\n\
\t\t\t// standard reference ('name')\n\
\t\t\tdot = getStringMatch( tokenizer, '.' ) || '';\n\
\t\t\tname = getName( tokenizer ) || '';\n\
\n\
\t\t\tcombo = dot + name;\n\
\n\
\t\t\tif ( !combo ) {\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\twhile ( refinement = getDotRefinement( tokenizer ) || getArrayRefinement( tokenizer ) ) {\n\
\t\t\t\tcombo += refinement;\n\
\t\t\t}\n\
\n\
\t\t\tif ( getStringMatch( tokenizer, '(' ) ) {\n\
\t\t\t\t\n\
\t\t\t\t// if this is a method invocation (as opposed to a function) we need\n\
\t\t\t\t// to strip the method name from the reference combo, else the context\n\
\t\t\t\t// will be wrong\n\
\t\t\t\tlastDotIndex = combo.lastIndexOf( '.' );\n\
\t\t\t\tif ( lastDotIndex !== -1 ) {\n\
\t\t\t\t\tcombo = combo.substr( 0, lastDotIndex );\n\
\t\t\t\t\ttokenizer.pos = startPos + combo.length;\n\
\t\t\t\t} else {\n\
\t\t\t\t\ttokenizer.pos -= 1;\n\
\t\t\t\t}\n\
\t\t\t}\n\
\n\
\t\t\treturn {\n\
\t\t\t\tt: REFERENCE,\n\
\t\t\t\tn: combo\n\
\t\t\t};\n\
\t\t};\n\
\n\
\t\tgetRefinement = function ( tokenizer ) {\n\
\t\t\tvar start, refinement, name, expr;\n\
\n\
\t\t\tstart = tokenizer.pos;\n\
\n\
\t\t\tallowWhitespace( tokenizer );\n\
\n\
\t\t\t// \".\" name\n\
\t\t\tif ( getStringMatch( tokenizer, '.' ) ) {\n\
\t\t\t\tallowWhitespace( tokenizer );\n\
\n\
\t\t\t\tif ( name = getName( tokenizer ) ) {\n\
\t\t\t\t\treturn {\n\
\t\t\t\t\t\tt: REFINEMENT,\n\
\t\t\t\t\t\tn: name\n\
\t\t\t\t\t};\n\
\t\t\t\t}\n\
\n\
\t\t\t\tfail( tokenizer, 'a property name' );\n\
\t\t\t}\n\
\n\
\t\t\t// \"[\" expression \"]\"\n\
\t\t\tif ( getStringMatch( tokenizer, '[' ) ) {\n\
\t\t\t\tallowWhitespace( tokenizer );\n\
\n\
\t\t\t\texpr = getExpression( tokenizer );\n\
\t\t\t\tif ( !expr ) {\n\
\t\t\t\t\tfail( tokenizer, 'an expression' );\n\
\t\t\t\t}\n\
\n\
\t\t\t\tallowWhitespace( tokenizer );\n\
\n\
\t\t\t\tif ( !getStringMatch( tokenizer, ']' ) ) {\n\
\t\t\t\t\tfail( tokenizer, '\"]\"' );\n\
\t\t\t\t}\n\
\n\
\t\t\t\treturn {\n\
\t\t\t\t\tt: REFINEMENT,\n\
\t\t\t\t\tx: expr\n\
\t\t\t\t};\n\
\t\t\t}\n\
\n\
\t\t\treturn null;\n\
\t\t};\n\
\n\
\t\t// Any literal except function and regexp literals, which aren't supported (yet?)\n\
\t\tgetLiteral = function ( tokenizer ) {\n\
\t\t\tvar literal = getNumberLiteral( tokenizer )   ||\n\
\t\t\t              getBooleanLiteral( tokenizer )  ||\n\
\t\t\t              getGlobal( tokenizer )          ||\n\
\t\t\t              getStringLiteral( tokenizer )   ||\n\
\t\t\t              getObjectLiteral( tokenizer )   ||\n\
\t\t\t              getArrayLiteral( tokenizer );\n\
\n\
\t\t\treturn literal;\n\
\t\t};\n\
\n\
\t\tgetArrayLiteral = function ( tokenizer ) {\n\
\t\t\tvar start, array, expressionList;\n\
\n\
\t\t\tstart = tokenizer.pos;\n\
\n\
\t\t\t// allow whitespace before '['\n\
\t\t\tallowWhitespace( tokenizer );\n\
\n\
\t\t\tif ( !getStringMatch( tokenizer, '[' ) ) {\n\
\t\t\t\ttokenizer.pos = start;\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\texpressionList = getExpressionList( tokenizer );\n\
\n\
\t\t\tif ( !getStringMatch( tokenizer, ']' ) ) {\n\
\t\t\t\ttokenizer.pos = start;\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\treturn {\n\
\t\t\t\tt: ARRAY_LITERAL,\n\
\t\t\t\tm: expressionList\n\
\t\t\t};\n\
\t\t};\n\
\n\
\t\tgetBooleanLiteral = function ( tokenizer ) {\n\
\t\t\tvar remaining = tokenizer.remaining();\n\
\n\
\t\t\tif ( remaining.substr( 0, 4 ) === 'true' ) {\n\
\t\t\t\ttokenizer.pos += 4;\n\
\t\t\t\treturn {\n\
\t\t\t\t\tt: BOOLEAN_LITERAL,\n\
\t\t\t\t\tv: 'true'\n\
\t\t\t\t};\n\
\t\t\t}\n\
\n\
\t\t\tif ( remaining.substr( 0, 5 ) === 'false' ) {\n\
\t\t\t\ttokenizer.pos += 5;\n\
\t\t\t\treturn {\n\
\t\t\t\t\tt: BOOLEAN_LITERAL,\n\
\t\t\t\t\tv: 'false'\n\
\t\t\t\t};\n\
\t\t\t}\n\
\n\
\t\t\treturn null;\n\
\t\t};\n\
\n\
\t\tglobals = /^(?:Array|Date|RegExp|decodeURIComponent|decodeURI|encodeURIComponent|encodeURI|isFinite|isNaN|parseFloat|parseInt|JSON|Math|NaN|undefined|null)/;\n\
\n\
\t\t// Not strictly literals, but we can treat them as such because they\n\
\t\t// never need to be dereferenced.\n\
\n\
\t\t// Allowed globals:\n\
\t\t// ----------------\n\
\t\t//\n\
\t\t// Array, Date, RegExp, decodeURI, decodeURIComponent, encodeURI, encodeURIComponent, isFinite, isNaN, parseFloat, parseInt, JSON, Math, NaN, undefined, null\n\
\t\tgetGlobal = function ( tokenizer ) {\n\
\t\t\tvar start, name, match, global;\n\
\n\
\t\t\tstart = tokenizer.pos;\n\
\t\t\tname = getName( tokenizer );\n\
\n\
\t\t\tif ( !name ) {\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\tmatch = globals.exec( name );\n\
\t\t\tif ( match ) {\n\
\t\t\t\ttokenizer.pos = start + match[0].length;\n\
\t\t\t\treturn {\n\
\t\t\t\t\tt: GLOBAL,\n\
\t\t\t\t\tv: match[0]\n\
\t\t\t\t};\n\
\t\t\t}\n\
\n\
\t\t\ttokenizer.pos = start;\n\
\t\t\treturn null;\n\
\t\t};\n\
\n\
\t\tgetNumberLiteral = function ( tokenizer ) {\n\
\t\t\tvar start, result;\n\
\n\
\t\t\tstart = tokenizer.pos;\n\
\n\
\t\t\t// special case - we may have a decimal without a literal zero (because\n\
\t\t\t// some programmers are plonkers)\n\
\t\t\tif ( result = getFraction( tokenizer ) ) {\n\
\t\t\t\treturn {\n\
\t\t\t\t\tt: NUMBER_LITERAL,\n\
\t\t\t\t\tv: result\n\
\t\t\t\t};\n\
\t\t\t}\n\
\n\
\t\t\tresult = getInteger( tokenizer );\n\
\t\t\tif ( result === null ) {\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\tresult += getFraction( tokenizer ) || '';\n\
\t\t\tresult += getExponent( tokenizer ) || '';\n\
\n\
\t\t\treturn {\n\
\t\t\t\tt: NUMBER_LITERAL,\n\
\t\t\t\tv: result\n\
\t\t\t};\n\
\t\t};\n\
\n\
\t\tgetObjectLiteral = function ( tokenizer ) {\n\
\t\t\tvar start, pairs, keyValuePairs, i, pair;\n\
\n\
\t\t\tstart = tokenizer.pos;\n\
\n\
\t\t\t// allow whitespace\n\
\t\t\tallowWhitespace( tokenizer );\n\
\n\
\t\t\tif ( !getStringMatch( tokenizer, '{' ) ) {\n\
\t\t\t\ttokenizer.pos = start;\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\tkeyValuePairs = getKeyValuePairs( tokenizer );\n\
\n\
\t\t\t// allow whitespace between final value and '}'\n\
\t\t\tallowWhitespace( tokenizer );\n\
\n\
\t\t\tif ( !getStringMatch( tokenizer, '}' ) ) {\n\
\t\t\t\ttokenizer.pos = start;\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\treturn {\n\
\t\t\t\tt: OBJECT_LITERAL,\n\
\t\t\t\tm: keyValuePairs\n\
\t\t\t};\n\
\t\t};\n\
\n\
\t\tgetKeyValuePairs = function ( tokenizer ) {\n\
\t\t\tvar start, pairs, pair, keyValuePairs;\n\
\n\
\t\t\tstart = tokenizer.pos;\n\
\n\
\t\t\tpair = getKeyValuePair( tokenizer );\n\
\t\t\tif ( pair === null ) {\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\tpairs = [ pair ];\n\
\n\
\t\t\tif ( getStringMatch( tokenizer, ',' ) ) {\n\
\t\t\t\tkeyValuePairs = getKeyValuePairs( tokenizer );\n\
\n\
\t\t\t\tif ( !keyValuePairs ) {\n\
\t\t\t\t\ttokenizer.pos = start;\n\
\t\t\t\t\treturn null;\n\
\t\t\t\t}\n\
\n\
\t\t\t\treturn pairs.concat( keyValuePairs );\n\
\t\t\t}\n\
\n\
\t\t\treturn pairs;\n\
\t\t};\n\
\n\
\t\tgetKeyValuePair = function ( tokenizer ) {\n\
\t\t\tvar start, pair, key, value;\n\
\n\
\t\t\tstart = tokenizer.pos;\n\
\n\
\t\t\t// allow whitespace between '{' and key\n\
\t\t\tallowWhitespace( tokenizer );\n\
\n\
\t\t\tkey = getKey( tokenizer );\n\
\t\t\tif ( key === null ) {\n\
\t\t\t\ttokenizer.pos = start;\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\t// allow whitespace between key and ':'\n\
\t\t\tallowWhitespace( tokenizer );\n\
\n\
\t\t\t// next character must be ':'\n\
\t\t\tif ( !getStringMatch( tokenizer, ':' ) ) {\n\
\t\t\t\ttokenizer.pos = start;\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\t// allow whitespace between ':' and value\n\
\t\t\tallowWhitespace( tokenizer );\n\
\n\
\t\t\t// next expression must be a, well... expression\n\
\t\t\tvalue = getExpression( tokenizer );\n\
\t\t\tif ( value === null ) {\n\
\t\t\t\ttokenizer.pos = start;\n\
\t\t\t\treturn null;\n\
\t\t\t}\n\
\n\
\t\t\treturn {\n\
\t\t\t\tt: KEY_VALUE_PAIR,\n\
\t\t\t\tk: key,\n\
\t\t\t\tv: value\n\
\t\t\t};\n\
\t\t};\n\
\n\
\t\t// http://mathiasbynens.be/notes/javascript-properties\n\
\t\t// can be any name, string literal, or number literal\n\
\t\tgetKey = function ( tokenizer ) {\n\
\t\t\treturn getName( tokenizer ) || getStringLiteral( tokenizer ) || getNumberLiteral( tokenizer );\n\
\t\t};\n\
\n\
\t\tgetStringLiteral = function ( tokenizer ) {\n\
\t\t\tvar start, string;\n\
\n\
\t\t\tstart = tokenizer.pos;\n\
\n\
\t\t\tif ( getStringMatch( tokenizer, '\"' ) ) {\n\
\t\t\t\tstring = getDoubleQuotedString( tokenizer );\n\
\t\t\t\n\
\t\t\t\tif ( !getStringMatch( tokenizer, '\"' ) ) {\n\
\t\t\t\t\ttokenizer.pos = start;\n\
\t\t\t\t\treturn null;\n\
\t\t\t\t}\n\
\n\
\t\t\t\treturn {\n\
\t\t\t\t\tt: STRING_LITERAL,\n\
\t\t\t\t\tv: string\n\
\t\t\t\t};\n\
\t\t\t}\n\
\n\
\t\t\tif ( getStringMatch( tokenizer, \"'\" ) ) {\n\
\t\t\t\tstring = getSingleQuotedString( tokenizer );\n\
\n\
\t\t\t\tif ( !getStringMatch( tokenizer, \"'\" ) ) {\n\
\t\t\t\t\ttokenizer.pos = start;\n\
\t\t\t\t\treturn null;\n\
\t\t\t\t}\n\
\n\
\t\t\t\treturn {\n\
\t\t\t\t\tt: STRING_LITERAL,\n\
\t\t\t\t\tv: string\n\
\t\t\t\t};\n\
\t\t\t}\n\
\n\
\t\t\treturn null;\n\
\t\t};\n\
\t\t\n\
\t}());\n\
\n\
\n\
}());\n\
// Ractive.parse\n\
// ===============\n\
//\n\
// Takes in a string, and returns an object representing the parsed template.\n\
// A parsed template is an array of 1 or more 'descriptors', which in some\n\
// cases have children.\n\
//\n\
// The format is optimised for size, not readability, however for reference the\n\
// keys for each descriptor are as follows:\n\
//\n\
// * r - Reference, e.g. 'mustache' in {{mustache}}\n\
// * t - Type code (e.g. 1 is text, 2 is interpolator...)\n\
// * f - Fragment. Contains a descriptor's children\n\
// * e - Element name\n\
// * a - map of element Attributes, or proxy event/transition Arguments\n\
// * d - Dynamic proxy event/transition arguments\n\
// * n - indicates an iNverted section\n\
// * i - Index reference, e.g. 'num' in {{#section:num}}content{{/section}}\n\
// * v - eVent proxies (i.e. when user e.g. clicks on a node, fire proxy event)\n\
// * c - Conditionals (e.g. ['yes', 'no'] in {{condition ? yes : no}})\n\
// * x - eXpressions\n\
// * t1 - intro Transition\n\
// * t2 - outro Transition\n\
\n\
(function () {\n\
\n\
\tvar onlyWhitespace, inlinePartialStart, inlinePartialEnd, parseCompoundTemplate;\n\
\n\
\tonlyWhitespace = /^\\s*$/;\n\
\n\
\tinlinePartialStart = /<!--\\s*\\{\\{\\s*>\\s*([a-zA-Z_$][a-zA-Z_$0-9]*)\\s*}\\}\\s*-->/;\n\
\tinlinePartialEnd = /<!--\\s*\\{\\{\\s*\\/\\s*([a-zA-Z_$][a-zA-Z_$0-9]*)\\s*}\\}\\s*-->/;\n\
\n\
\tparse = function ( template, options ) {\n\
\t\tvar tokens, fragmentStub, json, token;\n\
\n\
\t\toptions = options || {};\n\
\n\
\t\t// does this template include inline partials?\n\
\t\tif ( inlinePartialStart.test( template ) ) {\n\
\t\t\treturn parseCompoundTemplate( template, options );\n\
\t\t}\n\
\n\
\n\
\t\tif ( options.sanitize === true ) {\n\
\t\t\toptions.sanitize = {\n\
\t\t\t\t// blacklist from https://code.google.com/p/google-caja/source/browse/trunk/src/com/google/caja/lang/html/html4-elements-whitelist.json\n\
\t\t\t\telements: 'applet base basefont body frame frameset head html isindex link meta noframes noscript object param script style title'.split( ' ' ),\n\
\t\t\t\teventAttributes: true\n\
\t\t\t};\n\
\t\t}\n\
\n\
\t\ttokens = tokenize( template, options );\n\
\n\
\t\tif ( !options.preserveWhitespace ) {\n\
\t\t\t// remove first token if it only contains whitespace\n\
\t\t\ttoken = tokens[0];\n\
\t\t\tif ( token && ( token.type === TEXT ) && onlyWhitespace.test( token.value ) ) {\n\
\t\t\t\ttokens.shift();\n\
\t\t\t}\n\
\n\
\t\t\t// ditto last token\n\
\t\t\ttoken = tokens[ tokens.length - 1 ];\n\
\t\t\tif ( token && ( token.type === TEXT ) && onlyWhitespace.test( token.value ) ) {\n\
\t\t\t\ttokens.pop();\n\
\t\t\t}\n\
\t\t}\n\
\t\t\n\
\t\tfragmentStub = getFragmentStubFromTokens( tokens, options, options.preserveWhitespace );\n\
\t\t\n\
\t\tjson = fragmentStub.toJson();\n\
\n\
\t\tif ( typeof json === 'string' ) {\n\
\t\t\t// If we return it as a string, Ractive will attempt to reparse it!\n\
\t\t\t// Instead we wrap it in an array. Ractive knows what to do then\n\
\t\t\treturn [ json ];\n\
\t\t}\n\
\n\
\t\treturn json;\n\
\t};\n\
\n\
\t\n\
\tparseCompoundTemplate = function ( template, options ) {\n\
\t\tvar mainTemplate, remaining, partials, name, startMatch, endMatch;\n\
\n\
\t\tpartials = {};\n\
\n\
\t\tmainTemplate = '';\n\
\t\tremaining = template;\n\
\n\
\t\twhile ( startMatch = inlinePartialStart.exec( remaining ) ) {\n\
\t\t\tname = startMatch[1];\n\
\n\
\t\t\tmainTemplate += remaining.substr( 0, startMatch.index );\n\
\t\t\tremaining = remaining.substring( startMatch.index + startMatch[0].length );\n\
\n\
\t\t\tendMatch = inlinePartialEnd.exec( remaining );\n\
\n\
\t\t\tif ( !endMatch || endMatch[1] !== name ) {\n\
\t\t\t\tthrow new Error( 'Inline partials must have a closing delimiter, and cannot be nested' );\n\
\t\t\t}\n\
\n\
\t\t\tpartials[ name ] = parse( remaining.substr( 0, endMatch.index ), options );\n\
\n\
\t\t\tremaining = remaining.substring( endMatch.index + endMatch[0].length );\n\
\t\t}\n\
\n\
\t\treturn {\n\
\t\t\tmain: parse( mainTemplate, options ),\n\
\t\t\tpartials: partials\n\
\t\t};\n\
\t};\n\
\n\
}());\n\
tokenize = function ( template, options ) {\n\
\tvar tokenizer, tokens, token, last20, next20;\n\
\n\
\toptions = options || {};\n\
\n\
\ttokenizer = {\n\
\t\tstr: stripHtmlComments( template ),\n\
\t\tpos: 0,\n\
\t\tdelimiters: options.delimiters || [ '{{', '}}' ],\n\
\t\ttripleDelimiters: options.tripleDelimiters || [ '{{{', '}}}' ],\n\
\t\tremaining: function () {\n\
\t\t\treturn tokenizer.str.substring( tokenizer.pos );\n\
\t\t}\n\
\t};\n\
\n\
\ttokens = [];\n\
\n\
\twhile ( tokenizer.pos < tokenizer.str.length ) {\n\
\t\ttoken = getToken( tokenizer );\n\
\n\
\t\tif ( token === null && tokenizer.remaining() ) {\n\
\t\t\tlast20 = tokenizer.str.substr( 0, tokenizer.pos ).substr( -20 );\n\
\t\t\tif ( last20.length === 20 ) {\n\
\t\t\t\tlast20 = '...' + last20;\n\
\t\t\t}\n\
\n\
\t\t\tnext20 = tokenizer.remaining().substr( 0, 20 );\n\
\t\t\tif ( next20.length === 20 ) {\n\
\t\t\t\tnext20 = next20 + '...';\n\
\t\t\t}\n\
\n\
\t\t\tthrow new Error( 'Could not parse template: ' + ( last20 ? last20 + '<- ' : '' ) + 'failed at character ' + tokenizer.pos + ' ->' + next20 );\n\
\t\t}\n\
\n\
\t\ttokens[ tokens.length ] = token;\n\
\t}\n\
\n\
\tstripStandalones( tokens );\n\
\tstripCommentTokens( tokens );\n\
\n\
\treturn tokens;\n\
};\n\
Ractive.prototype = proto;\n\
\n\
Ractive.adaptors = adaptors;\n\
Ractive.eventDefinitions = eventDefinitions;\n\
Ractive.partials = {};\n\
\n\
Ractive.easing = easing;\n\
Ractive.extend = extend;\n\
Ractive.interpolate = interpolate;\n\
Ractive.interpolators = interpolators;\n\
Ractive.parse = parse;\n\
\n\
// TODO add some more transitions\n\
Ractive.transitions = transitions;\n\
\n\
Ractive.VERSION = VERSION;\n\
\n\
\n\
// export as Common JS module...\n\
if ( typeof module !== \"undefined\" && module.exports ) {\n\
\tmodule.exports = Ractive;\n\
}\n\
\n\
// ... or as AMD module\n\
else if ( typeof define === \"function\" && define.amd ) {\n\
\tdefine( function () {\n\
\t\treturn Ractive;\n\
\t});\n\
}\n\
\n\
// ... or as browser global\n\
else {\n\
\tglobal.Ractive = Ractive;\n\
}\n\
\n\
}( this ));//@ sourceURL=CamShaft-Ractive/build/Ractive.js"
));
require.register("jsont-demo/index.js", Function("exports, require, module",
"/**\n\
 * Module dependencies\n\
 */\n\
\n\
var Ractive = require('Ractive');\n\
var jsont = require('jsont')();\n\
var template = require('./template');\n\
\n\
var ractive = new Ractive({\n\
  el: document.getElementById('main'),\n\
  template: template,\n\
  data: {\n\
    data: JSON.stringify(require('./default-options'), null, '  '),\n\
    helpers: 'module.exports = ' + require('./default-helpers').toString(),\n\
    input: JSON.stringify(require('./default-template'), null, '  ')\n\
  }\n\
});\n\
\n\
ractive.observe('input', update);\n\
ractive.observe('helpers', update);\n\
ractive.observe('data', update);\n\
\n\
function update() {\n\
  try {\n\
    var input = ractive.get('input');\n\
    var data = ractive.get('data');\n\
    var helpers = eval(ractive.get('helpers'));\n\
\n\
    var render = jsont(input, {});\n\
\n\
    if (typeof helpers === 'function') helpers(render);\n\
\n\
    var opts = JSON.parse(data);\n\
\n\
    render(opts, function(err, out) {\n\
      if (err) return ractive.set('error', err.stack);\n\
      else ractive.set('error', false);\n\
      ractive.set('out', JSON.stringify(out, null, '  '));\n\
    });\n\
  } catch (err) {\n\
    ractive.set('error', err.stack);\n\
  }\n\
};\n\
//@ sourceURL=jsont-demo/index.js"
));
require.register("jsont-demo/template.js", Function("exports, require, module",
"module.exports = '<div>\\n\
  <div class=\"input\">\\n\
    <h2>Template</h2>\\n\
    <textarea id=\"input\" value=\"{{input}}\"></textarea>\\n\
  </div>\\n\
  <div class=\"input\">\\n\
    <h2>Options</h2>\\n\
    <textarea id=\"data\" value=\"{{data}}\"></textarea>\\n\
  </div>\\n\
  <div class=\"input\">\\n\
    <h2>Helpers</h2>\\n\
    <textarea id=\"helpers\" value=\"{{helpers}}\"></textarea>\\n\
  </div>\\n\
</div>\\n\
<div>\\n\
  <h2>Output</h2>\\n\
  <pre class=\"out\">{{out}}</pre>\\n\
</div>\\n\
{{#error}}\\n\
<div>\\n\
  <h2>Error</h2>\\n\
  <pre class=\"error\">{{error}}</pre>\\n\
</div>\\n\
{{/error}}';//@ sourceURL=jsont-demo/template.js"
));
require.register("jsont-demo/default-helpers.js", Function("exports, require, module",
"module.exports = function (jsont) {\n\
  jsont.use('hello', function(input, cb){\n\
    cb(null, 'hello, '+input);\n\
  });\n\
\n\
  jsont.use('exclaim', function(input, cb){\n\
    cb(null, input+'!');\n\
  });\n\
\n\
  // You can even call a database from the template!\n\
  jsont.use('user', function(id, cb){\n\
    setTimeout(function(){\n\
      cb(null, {href: \"/users/\"+id, name: \"camshaft\"});\n\
    }, 10);\n\
  });\n\
}//@ sourceURL=jsont-demo/default-helpers.js"
));
require.register("jsont-demo/default-options.js", Function("exports, require, module",
"module.exports = {\n\
  \"id\": \"1\",\n\
  \"names\": [\n\
    \"cameron\",\n\
    \"scott\",\n\
    \"dave\"\n\
  ]\n\
}//@ sourceURL=jsont-demo/default-options.js"
));
require.register("jsont-demo/default-template.js", Function("exports, require, module",
"module.exports = {\n\
  \"id\": \"`id | user`\",\n\
  \"welcomes\": \"`names | map | hello | exclaim`\"\n\
}//@ sourceURL=jsont-demo/default-template.js"
));





require.alias("CamShaft-jsont/index.js", "jsont-demo/deps/jsont/index.js");
require.alias("CamShaft-jsont/lib/each.js", "jsont-demo/deps/jsont/lib/each.js");
require.alias("CamShaft-jsont/lib/helpers.js", "jsont-demo/deps/jsont/lib/helpers.js");
require.alias("CamShaft-jsont/lib/index.js", "jsont-demo/deps/jsont/lib/index.js");
require.alias("CamShaft-jsont/lib/render.js", "jsont-demo/deps/jsont/lib/render.js");
require.alias("CamShaft-jsont/lib/stack.js", "jsont-demo/deps/jsont/lib/stack.js");
require.alias("CamShaft-jsont/lib/template.js", "jsont-demo/deps/jsont/lib/template.js");
require.alias("CamShaft-jsont/lib/utils.js", "jsont-demo/deps/jsont/lib/utils.js");
require.alias("CamShaft-jsont/index.js", "jsont-demo/deps/jsont/index.js");
require.alias("CamShaft-jsont/index.js", "jsont/index.js");
require.alias("component-format-parser/index.js", "CamShaft-jsont/deps/format-parser/index.js");

require.alias("component-type/index.js", "CamShaft-jsont/deps/type/index.js");

require.alias("wilmoore-selectn/index.js", "CamShaft-jsont/deps/selectn/index.js");

require.alias("visionmedia-batch/index.js", "CamShaft-jsont/deps/batch/index.js");
require.alias("component-emitter/index.js", "visionmedia-batch/deps/emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

require.alias("CamShaft-jsont/index.js", "CamShaft-jsont/index.js");
require.alias("CamShaft-Ractive/build/Ractive.js", "jsont-demo/deps/Ractive/build/Ractive.js");
require.alias("CamShaft-Ractive/build/Ractive.js", "jsont-demo/deps/Ractive/index.js");
require.alias("CamShaft-Ractive/build/Ractive.js", "Ractive/index.js");
require.alias("CamShaft-Ractive/build/Ractive.js", "CamShaft-Ractive/index.js");
require.alias("jsont-demo/index.js", "jsont-demo/index.js");