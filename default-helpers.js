module.exports = function (jsont) {
  jsont.use('hello', function(input, cb){
    cb(null, 'hello, '+input);
  });

  jsont.use('exclaim', function(input, cb){
    cb(null, input+'!');
  });
}