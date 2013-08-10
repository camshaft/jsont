/**
 * Module dependencies
 */

var Batch = require('batch');
var each = require('./each');
var stack = require('./stack');
var set = require('./utils').set;

module.exports = Render;

/**
 * Renders a template
 *
 */

function Render(helpers, properties, value, options, data, fn) {
  this.helpers = helpers;
  this.properties = properties;
  this.value = value;
  this.options = options;
  this.data = data;
  this.render(fn);
};

Render.prototype.render = function(fn) {
  var self = this;
  var batch = new Batch;

  each(self.properties, function(property) {
    batch.push(function(next) {
      // Setup the property context
      var context = {
        exit: next,
        path: property.path,
        stack: property.fns.slice(0)
      };
      context.__proto__ = self;

      stack.call(context, context.stack, self.data, function(err, value) {
        if (err) return next(err);
        self.set(context.path, value);
        next();
      });
    });
  });

  batch.end(function(err) {
    if (err) return fn(err);
    fn(null, self.value);
  });
};

Render.prototype.set = function(path, value) {
  set(path, value, this.value);
  return this;
};
