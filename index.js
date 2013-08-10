/**
 * Module dependencies
 */

var Ractive = require('Ractive');
var JSONt = require('jsont');
var template = require('./template');

module.exports = function(defaultDemo) {
  var jsont = JSONt();

  var ractive = new Ractive({
    el: document.getElementById('main'),
    template: template,
    data: {
      demos: [
        {id: 'default', name: 'Basic'},
        {id: 'github-api', name: 'GitHub API'},
        {id: 'triangular', name: 'Triangular Numbers'}
      ],
      demo: getHash(defaultDemo)
    }
  });

  ractive.observe('demo', function(demo) {
    try {
      ractive.set(getDemoData(demo));
      window.location.hash = demo;
    } catch (err) {
      ractive.set('error', err.stack);
    }
  });

  ractive.observe('input', update);
  ractive.observe('helpers', update);
  ractive.observe('data', update);

  function update() {
    try {
      var input = ractive.get('input');
      var data = ractive.get('data');
      var helpers = eval(ractive.get('helpers'));

      var render = jsont(input, {});

      if (typeof helpers === 'function') helpers(render);
      if (!data) return;

      var opts = JSON.parse(data);

      var start = Date.now();
      render(opts, function(err, out) {
        ractive.set('runtime', Date.now() - start);
        if (err) return ractive.set('error', err.stack);
        else ractive.set('error', false);
        ractive.set('out', JSON.stringify(out, null, '  '));
      });
    } catch (err) {
      ractive.set('error', err.stack);
    }
  };
};

function getHash(defaultVal) {
  if (window.location.hash) return window.location.hash.slice(1);
  return defaultVal;
};

function getDemoData(demo) {
  return {
    input: requireJSON('./'+demo+'-template'),
    data: requireJSON('./'+demo+'-options'),
    helpers: 'module.exports = ' + require('./'+demo+'-helpers').toString()
  };
};

function requireJSON(file) {
  return JSON.stringify(require(file), null, '  ');
};
