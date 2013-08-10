module.exports = function (jsont) {
  jsont.use('github', function(user, cb) {
    cb(null, 'https://github.com/'+user);
  });
}