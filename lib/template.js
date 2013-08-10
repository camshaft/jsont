/**
 * Module dependencies
 */

var each = require('./each');
var Render = require('./render');
var fmtparser = require('format-parser');
var type = require('type-component');
var get = require('selectn');

module.exports = createTemplate;

/**
 * Create an instance of Template
 *
 * @return {Template}
 */

function createTemplate(tmpl, options, helpers) {
  function Template(data, fn){ return Template.render(data, fn); };
  Template.helpers = {};
  Template.helpers.__proto__ = helpers;
  Template.properties = [];

  // Properties
  Template._tmpl = typeof tmpl === 'string'
    ? JSON.parse(tmpl)
    : tmpl;
  Template.options = options;

  // Methods
  Template.use = use;
  Template.render = render;
  Template.scan = scan;
  Template.parse = parse;

  // Scan for templated properties
  Template.scan(Template._tmpl, []);

  return Template;
};

/**
 * Use a helper
 *
 * @param {String} name
 * @param {Function} fun
 * @return {Template} for chaining
 */

function use(name, fun) {
  this.helpers[name] = fun;
  return this;
};

/**
 * Render the template with the data
 *
 * @param {String|Object} tmpl
 * @param {Object} options
 * @return {Template}
 */

function render(data, fn) {
  return new Render(this.helpers, this.properties, copy(this._tmpl), this.options, data, fn);
};

/**
 * Deep copy an object
 *
 * @api private
 */

function copy(tmpl) {
  return JSON.parse(JSON.stringify(tmpl));
};

/**
 * Scan the properties for something that looks like a template
 */

var scannable = [
  'object',
  'array'
];

function scan(template, path) {
  // We can't iterate
  if (!~scannable.indexOf(type(template))) return;

  var self = this;
  each(template, function(value, key) {
    var newpath = path.concat([key]);
    if (type(value) === 'string') return self.parse(value, newpath);
    if (type(value) === 'object') return self.scan(value, newpath);
    if (type(value) === 'array') return self.scan(value, newpath);
  });
};

/**
 * Parse and register a templated property
 */

function parse(value, path) {
  // Verify that it's a templated property
  var out = /^`(.+)`$/.exec(value);
  if (!out) return;

  // Parse the arguments
  var args = fmtparser(out[1]);

  // Translate the argument into a function
  var fns = args.map(function(input, i) {
    return (!i ? exp : helper)(input.name, input.args);
  });

  // Register the location and helper functions
  this.properties.push({
    fns: fns,
    path: path
  });
};

function helper(name, args) {
  return function(input, next) {
    // Find the helper
    var helper = this.helpers[name];
    if (!helper) return next(new Error('Invalid helper "' + name + '" at ' + this.path));

    // Insert the input and add the next function
    var newargs = args.slice(0);
    newargs.unshift(input);
    newargs.push(next);

    return helper.apply(this, newargs);
  };
};

function exp(name, args) {

  // TODO we should be able to parse valid js - similar to angular
  var val = /^'(.+)'$/.exec(name);

  if (!val) {
    var _get = get(name);
    return function(data, next) {
      next(null, _get(data));
    };
  }

  var val = val[1];
  return function(data, next) {
    next(null, val);
  };

  // We've got a function
  // if (args.length) return function(data, next) {
  //   var newargs = args.slice(0);
  //   newargs.unshift(data);
  //   newargs.push(next);

  // };

};
