'use strict';
function OperatorValueParser() {

  this.perform = function (model, fieldName, value) {
    var ret = null;

    if (value[0] === '!') {
      ret = { $ne: value.substring(1) };
    } else if (value[0] === '>') {
      ret = { $gt: value.substring(1) };
    } else if (value[0] === '<') {
      ret = { $lt: value.substring(1) };
    } else if (value[0] === '*' && value[value.length - 1] === '*') {
      ret = { $like: '%' + value.substring(1, value.length - 1) + '%' };
    } else if (value[0] === '*') {
      ret = { $like: '%' + value.substring(1) };
    } else if (value[value.length - 1] === '*') {
      ret = { $like: value.substring(1) + '%' };
    } else if (value === '$present') {
      ret = { $ne: null };
    } else if (value === '$blank') {
      ret = null;
    } else {
      ret = value;
    }

    return ret;
  };
}

module.exports = OperatorValueParser;
