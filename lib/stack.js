module.exports = renderProperty;

function renderProperty(stack, data, done) {
  var self = this;
  var fn = stack.shift();

  // We're all done
  if (!fn) return done(null, data);

  try {
    fn.call(self, data, function(err, val) {
      if (err) return done(err);
      setTimeout(function() {
        renderProperty.call(self, stack, val, done);
      }, 0);
    });
  } catch (e) {
    done(e);
  }
};
