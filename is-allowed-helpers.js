module.exports = function (jsont) {
  var partials = {
    code: {
      action: '/code',
      method: 'POST',
      input: {
        user: '`username`'
      }
    }
  };

  jsont.use('is-allowed-to', function(input, perm, cb) {
    if (perm === 'code') return cb(null, input);
    cb(null, undefined);
  });

  jsont.use('partial', function(username, partial, cb) {
    if (!username) return cb();
    jsont.render(partials[partial], {
      username: username
    }, cb);
  });
}