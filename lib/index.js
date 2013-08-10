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
  JSONt.compile = compile;

  return JSONt;
};

/**
 * Use a pipe
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
 * Compile a template with the default helpers
 *
 * @param {String|Object} tmpl
 * @param {Object} options
 * @return {Template}
 */

function compile(tmpl, options) {
  return template(tmpl, options || {}, this.helpers);
};
