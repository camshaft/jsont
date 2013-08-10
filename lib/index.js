/**
 * Module dependencies
 */

var defaults = require('./helpers');
var template = require('./template');

module.exports = createInstance;

/**
 * Create an instance of JSONt
 *
 * @return {JSONt}
 */

function createInstance() {
  function JSONt(tmpl, options){ return JSONt.compile(tmpl, options); };
  JSONt.helpers = {};
  JSONt.helpers.__proto__ = defaults;

  JSONt.use = use;
  JSONt.plugin = plugin;
  JSONt.compile = compile;
  JSONt.render = render;
  JSONt.renderFile = renderFile;

  return JSONt;
};

/**
 * Use a helpers
 *
 * @param {String} name
 * @param {Function} fun
 * @return {JSONt} for chaining
 */

function use(name, fun) {
  this.helpers[name] = fun;
  return this;
};

/**
 * Register a collection of helpers
 */

function plugin(fn) {
  fn(this);
  return this;
};

/**
 * Compile a template with the default helpers
 *
 * @param {String|Object} tmpl
 * @param {Object} options
 * @return {Template}
 */

function compile(tmpl, options) {
  return template(tmpl, options || {}, this.helpers);
};

/**
 * Compile and render a template
 *
 * @param {String|Object} tmpl
 * @param {Object} options
 * @param {Function} fn
 */

function render(tmpl, options, fn) {
  this.compile(tmpl, options)(options, fn);
};

/**
 * Compile and render a template
 *
 * @param {String} filename
 * @param {Object} options
 * @param {Function} fn
 */

function renderFile(file, options, fn) {
  this.compile(require(file), options)(options, fn);
};
