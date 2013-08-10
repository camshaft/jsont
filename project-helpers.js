module.exports = function (jsont) {
  jsont.use('github-project', function(project, cb) {
    if (typeof project === 'string') return cb(null, 'https://' + project + '.github.io');
    cb(null, 'https://' + project.owner + '.github.io/' + project.name);
  });
}