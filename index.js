/**
 * Module dependencies
 */

var Ractive = require('Ractive');
var jsont = require('jsont')();
var template = require('./template');

var ractive = new Ractive({
  el: document.getElementById('main'),
  template: template,
  data: {
    data: JSON.stringify(require('./default-options'), null, '  '),
    helpers: 'module.exports = ' + require('./default-helpers').toString(),
    input: JSON.stringify(require('./default-template'), null, '  ')
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

    var opts = JSON.parse(data);

    render(opts, function(err, out) {
      if (err) return ractive.set('error', err.stack);
      else ractive.set('error', false);
      ractive.set('out', JSON.stringify(out, null, '  '));
    });
  } catch (err) {
    ractive.set('error', err.stack);
  }
};
