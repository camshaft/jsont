
var people = {
  "1": "Cameron",
  "2": "Scott",
  "3": "Dave"
};

module.exports = function(jsont) {
  jsont.use('fetch', function(id, done) {
    setTimeout(function() {
      done(null, {
        href: '/people/'+id,
        name: people[id]
      });
    }, 2);
  });

  jsont.use('long-api-call', function(key, done) {
    setTimeout(function() {
      var value = key === 'testing'
        ? 42
        : 12;
      done(null, value);
    }, 20);
  });

  return jsont;
};
