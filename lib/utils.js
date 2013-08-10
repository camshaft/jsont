/**
 * Set a value at path on obj
 */

exports.set = function(path, value, obj) {
  var length = path.length - 1;
  var tmp = obj;
  var key;

  for (var i = 0; i <= length; i++) {
    key = path[i];
    if (i !== length) tmp = tmp[key];
    else tmp[key] = value;
  }
  return obj;
};
