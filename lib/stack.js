/**
 * Expose stack iteration function
 */

module.exports = exec;

function exec(stack, data, done) {
  var self = this;
  var fn = stack.shift();

  // We're all done
  if (!fn) return done(null, data);

  try {
    fn.call(self, data, function(err, val) {
      if (err) return done(err);
      // TODO figure out a better way to not have a huge stack
      // setTimeout(function() {
        exec.call(self, stack, val, done);
      // }, 0);
    });
  } catch (e) {
    done(e);
  }
};
