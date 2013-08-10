module.exports = function (jsont) {
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