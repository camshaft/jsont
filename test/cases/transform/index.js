
module.exports = function(jsont) {
  jsont.use('type', function(key, done) {
    if (key === 'email') return done(null, 'email');
    return done(null, 'text');
  });

  jsont.use('required', function(key, done) {
    if (key === 'email') return done(null, true);
    return done(null, false);
  });

  return jsont;
};
