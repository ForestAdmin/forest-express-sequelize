'use strict';
var Interface = require('forest-express');

function QueryStatGetter(params, opts) {
  var QUERY_OPTIONS_SELECT = { type: opts.sequelize.QueryTypes.SELECT };

  this.perform = function () {
    var rawQuery = params.query;

    if (!rawQuery) {
      Interface.logger
        .error('Cannot execute an empty SQL query using Live Query feature.');
      return [];
    }

    if (params.record_id) {
      rawQuery = rawQuery.replace('?', params.record_id);
    }

    // WARNING: Choosing the first connection might generate issues if the model
    //          does not belongs to this database.
    return opts.connections[0].query(rawQuery, QUERY_OPTIONS_SELECT);
  };
}

module.exports = QueryStatGetter;
