module.exports = function (jsont) {
  jsont.use('hello', function(input, cb) {
    cb(null, 'hello, '+input);
  });

  jsont.use('exclaim', function(input, cb) {
    cb(null, input+'!');
  });

  // You can even call a database from the template!
  jsont.use('user', function(id, cb) {
    setTimeout(function(){
      cb(null, {
        href: "/users/"+id,
        name: "camshaft"
      });
    }, 10);
  });

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

  jsont.use('sum', function(input, cb) {
    var val = input.reduce(function(prev, curr) {
      return prev + curr;
    }, 0);
    cb(null, val)
  });
}