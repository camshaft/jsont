jsont [![Build Status](https://travis-ci.org/CamShaft/jsont.png?branch=master)](https://travis-ci.org/CamShaft/jsont)
=====

Simple json template language

Installation
------------

```sh
$ npm install jsont
```

```sh
$ component install CamShaft/jsont
```

Features
--------

* Simple
* Valid JSON
* Extensible
* Auto-parallelization of templated properties

Example
-------

Input:

```json
{
  "name": "`user.firstName`",
  "birthday": "`user.birthday | date:'MMMM Do'`",
  "addresses": "`user.addresses | map | partial:address`"
}
```

Output:

```json
{
  "name": "Cameron",
  "birthday": "September 19th",
  "addresses": [
    {
      "street": "123 Fake Street",
      "city": "Nowhere",
      "country": "USA"
    },
    {
      "street": "Broadway Street",
      "city": "NY",
      "country": "USA"
    }
  ]
}
```

Usage
-----

```js
var jsont = require('jsont')();

var template = require('./my-template.json');

var options = {};

jsont.render(template, options, function(err, out) {
  console.log(out);
});
```

Helpers
-------

You can easily extend `jsont` by calling `use`:

```js
var jsont = require('jsont')();

jsont.use('reverse', function(input, next) {
  next(null, input.split("").reverse().join(""));
});
```

In your template you can then call the helper by piping data to it:

```json
{
  "reversed-name": "'Cameron' | reverse"
}
```

Out comes:

```json
{
  "reversed-name": "noremaC"
}
```

You can also pass arguments and chain arguments

```json
{
  "list": "'1,2,3,4,5' | split:',' | map | to-int"
}
```

```js
jsont.use('split', function(input, separator, next) {
  next(null, input.split(separator));
});

jsont.use('to-int', function(input, next) {
  next(null, parseInt(input));
});
```

And we get:

```json
{
  "list": [
    1,
    2,
    3,
    4,
    5
  ]
}
```

Parallelization
---------------

Since helpers are all asynchronous behind the scenes we get parallelization in a simple form:

```js
var api = require('./api');

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

jsont.use('length', function(likes, path, next) {
  // We didn't get any params
  if (typeof path === 'function') return next(null, likes ? likes.length : 0);

  // get and replace the length at `path`
  var length = get(path, likes).length;
  next(null, set(path, length, likes));
});

jsont.use('partial', function(data, partial, next) {
  // load your partial here
  jsont.render(partial, data, next);
})

jsont.renderFile('user-profile.json', {id: 0}, function(err, out) {
  console.log(out);
});
```

```json
{
  "likes": "`id | user-likes | length`",
  "followers": "`id | user-followers | map | user-likes | length:'likes'`"
}
```

Everything gets put on the event loop and renders as responses come back.

```json
{
  "likes": 42,
  "followers": [
    {
      "id": 1,
      "name": "Scott",
      "likes": 32
    },
    {
      "id": 2,
      "name": "Dave",
      "likes": 98
    }
  ]
}
```

Tests
-----

```sh
$ npm test
```
