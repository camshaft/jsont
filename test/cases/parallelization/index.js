
// Our fake people db
var people = {
  '1': {
    name: 'Cameron',
    likes: ['music', 'bikes', 'cars', 'code'],
    followers: ['2', '3']
  },
  '2': {
    name: 'Scott',
    likes: ['cats', 'dogs', 'houses']
  },
  '3': {
    name: 'Dave',
    likes: ['cars', 'bikes']
  }
};

var api = {};

api.get = function(id, cb) {
  setTimeout(function() {
    cb(null, people[id]);
  }, Math.floor(Math.random() + 10)); // Simulate DB call
};

api.likes = function(id, cb) {
  setTimeout(function() {
    cb(null, people[id].likes);
  }, Math.floor(Math.random() + 10)); // Simulate DB call
};

api.followers = function(id, cb) {
  setTimeout(function() {
    cb(null, people[id].followers);
  }, Math.floor(Math.random() + 10)); // Simulate DB call
};

module.exports = function(jsont) {
  jsont.use('user-likes', function(user, next) {
    if (typeof user !== 'object') user = {id: user};

    api.likes(user.id, function(err, likes) {
      if (err) return next(err);

      user.likes = likes;
      next(null, user);
    });
  });

  jsont.use('user-followers', function(id, next) {
    api.followers(id, next);
  });

  jsont.use('user', function(id, next) {
    api.get(id, function(err, user) {
      if (err) return next(err);

      user.id = id;
      next(null, user);
    });
  });

  jsont.use('length', function(user, property, position, next) {
    if (typeof position === 'function') return position(null, user[property].length);
    user[position] = user[property].length;
    next(null, user);
  });

  return jsont;
};
