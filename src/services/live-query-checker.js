'use strict';
var ErrorHTTP422 = require('./errors').ErrorHTTP422;

function LiveQueryChecker() {
  var QUERY_SELECT = /^SELECT\s[^]*FROM\s[^]*$/i;

  this.perform = function (query) {
    if (!query) {
      throw new ErrorHTTP422('You cannot execute an empty SQL query.');
    }

    if (query.includes(';') && query.indexOf(';') < (query.length - 1)) {
      throw new ErrorHTTP422('You cannot chain SQL queries.');
    }

    if (!QUERY_SELECT.test(query)) {
      throw new ErrorHTTP422('Only SELECT queries are allowed.');
    }

    return;
  }
}

module.exports = LiveQueryChecker;
