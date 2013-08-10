
module.exports = function(jsont) {
  jsont.pipe('type', function(key, done) {
    if (key === 'email') return done(null, 'email');
    return done(null, 'text');
  });

  jsont.pipe('required', function(key, done) {
    if (key === 'email') return done(null, true);
    return done(null, false);
  });

  return jsont;
};
