module.exports = function (jsont) {
  var users = {
    "1": {
      name: "Cameron",
      followers: 100
    },
    "2": {
      name: "Scott",
      followers: 4
    },
    "3": {
      name: "Dave",
      followers: 50
    }
  }

  jsont.use('user', function(id, cb) {
    cb(null, users[id]);
  });

  jsont.use('filter-unpopular', function(users, cb) {
    cb(null, users.filter(function(user) {
      return user.followers > 49;
    }));
  });
}