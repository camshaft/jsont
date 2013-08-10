module.exports = function (jsont) {
  var request = require('superagent');

  jsont.use('parse-int', function(input, cb) {
    cb(null, parseInt(input));
  });

  jsont.use('range', function(input, cb) {
    var r = [];
    for(var i = 1; i <= input; i++) {
      r.push(i);
    }
    cb(null, r);
  });

  // You can even call an api from the template!
  jsont.use('user', function(id, cb) {
    request
      .get("https://api.github.com/user/"+id)
      .end(function(err, res) {
        cb(err, res.body);
      });
  });

  jsont.use('prop', function(input, prop, cb) {
    cb(null, input[prop]);
  });

  jsont.use('hello', function(input, cb) {
    cb(null, 'hello, '+input);
  });

  jsont.use('exclaim', function(input, cb) {
    cb(null, input+'!');
  });
}