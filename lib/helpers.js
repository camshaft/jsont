/**
 * Module dependencies
 */

var Batch = require('batch');
var each = require('./each');
var type = require('type-component');
var stack = require('./stack');
var set = require('./utils').set;

exports.each = function(input, done) {
  var self = this;

  var inputType = type(input);
  var obj;
  if (inputType === 'object') obj = {}
  else if (inputType === 'array') obj = [];
  else return done(new Error('Incompatible type for `each`: '+inputType));

  var batch = new Batch;

  each(input, function(value, key) {
    batch.push(function(next) {
      stack.call(self, self.stack.slice(0), value, function(err, value) {
        if (err) return next(err);
        set([key], value, obj);
        next();
      });
    });
  });

  batch.end(function(err) {
    // Don't use done - we're controling the stack now
    if (err) self.exit(err);
    self.set(self.path, obj);
    self.exit();
  });
};
