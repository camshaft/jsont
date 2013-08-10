module.exports = function (jsont) {
  var partials = {
    code: {
      action: '/code',
      method: 'POST',
      input: {
        user: '`username`'
      }
    },
   'sit-around': {
      action: '/sit-around',
      method: 'POST',
      input: {
        user: '`username`'
      }
    }
  };

  jsont.use('is-allowed-to', function(input, perm, cb) {
    if (perm === 'code' && input === 'CamShaft') return cb(null, input);
    if (perm === 'sit-around' && input === 'Scott') return cb(null, input);
    cb(null, undefined);
  });

  jsont.use('partial', function(username, partial, cb) {
    if (!username) return cb();
    jsont.render(partials[partial], {
      username: username
    }, cb);
  });
}