module.exports = function (jsont) {
  jsont.use('is-allowed-to', function(input, perm, cb) {
    if (perm === 'code' && input === 'Cameron') return cb(null, input);
    if (perm === 'analyze' && input === 'Scott') return cb(null, input);
    cb(null, undefined);
  });

  jsont.use('filter-falsy', function(input, cb) {
    cb(null, input.filter(function(item) {
      return !!item;
    }));
  });

  jsont.use('pre', function(input, cb) {
    if (typeof input === 'string' || typeof input === 'undefined') return cb(null, input);
    cb(new Error('Pre helper called in post step ' + input));
  });

  jsont.use('post', function(input, cb) {
    if (typeof input !== 'string') return cb(null, input);
    cb(new Error('Post helper called in pre step ' + input));
  });

  return jsont;
}