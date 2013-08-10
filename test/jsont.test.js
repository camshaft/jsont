var jsont = require('..');
var fs = require('fs');
var join = require('path').join;
var expect = require('expect.js');

var dir = join(__dirname, 'cases');
var cases = fs.readdirSync(dir);

describe('jsont', function(){
  cases.forEach(function(test){
    var name = test.replace(/[-.]/g, ' ');
    var testdir = join(dir, test);
    it('should pass the ' + name + ' test', function(done){
      var instance = require(testdir)(jsont());

      var input = require(join(testdir, 'in'));
      var options;
      try {
        options = require(join(testdir, 'options'));
      } catch (e) {};

      var render = instance(input, options);

      var data = require(join(testdir, 'data'));
      var expected = require(join(testdir, 'out'));

      render(data, function(err, actual) {
        if (err) return done(err);
        expect(actual).to.eql(expected);
        done();
      });
    });
  });
});
