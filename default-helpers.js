module.exports = function (jsont) {
  jsont.use('hello', function(input, cb){
    cb(null, 'hello, '+input);
  });

  jsont.use('exclaim', function(input, cb){
    cb(null, input+'!');
  });

  // You can even call a database from the template!
  jsont.use('user', function(id, cb){
    setTimeout(function(){
      cb(null, {href: "/users/"+id, name: "camshaft"});
    }, 100);
  });
}