'use strict';

function QueryStatGetter(params, opts) {
  var QUERY_OPTIONS_SELECT = { type: opts.sequelize.QueryTypes.SELECT };

  this.perform = function () {
    var rawQuery = params.query;
    if (params.record_id) {
      rawQuery = rawQuery.replace('?', params.record_id);
    }

    // WARNING: Choosing the first connection might generate issues if the model
    //          does not belongs to this database.
    return opts.connections[0].query(rawQuery, QUERY_OPTIONS_SELECT);
  };
}

module.exports = QueryStatGetter;
