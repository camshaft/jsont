jsont
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
  next(null, input.reverse());
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

jsont.use('userLikes', function(id, next) {
  api.likes(id, next);
});

jsont.use('userFollowers', function(id, next) {
  api.followers(id, next);
});

jsont.use('length', function(likes, next) {
  next(null, likes ? likes.length : 0);
});

jsont.use('partial', function(data, partial, next) {
  // load your partial here
  jsont.render(partial, data, next);
})
```

```json
{
  "likes": "`id | userLikes | length`",
  "followers": "`id | userFollowers | map | partial:follower`"
}
```

Everything gets put on the event loop and renders as responses come back.

```json
{
  "likes": 42,
  "followers": [
    {
      "id": 1,
      "name": "Scott"
    },
    {
      "id": 2,
      "name": "Dave"
    }
  ]
}
```

Tests
-----

```sh
$ npm test
```
