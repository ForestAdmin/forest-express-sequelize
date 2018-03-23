'use strict';
var ErrorHTTP422 = require('./errors').ErrorHTTP422;

function QueryStatGetter(params, opts) {
  var QUERY_OPTIONS_SELECT = { type: opts.sequelize.QueryTypes.SELECT };
  var QUERY_SELECT = /^SELECT\s[^]*FROM\s[^]*$/i;

  function checkQuery(query) {
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

  this.perform = function () {
    var rawQuery = params.query.trim();

    checkQuery(rawQuery);

    if (params.record_id) {
      rawQuery = rawQuery.replace(new RegExp('\\?', 'g'), params.record_id);
    }

    // WARNING: Choosing the first connection might generate issues if the model
    //          does not belongs to this database.
    return opts.connections[0].query(rawQuery, QUERY_OPTIONS_SELECT);
  };
}

module.exports = QueryStatGetter;
