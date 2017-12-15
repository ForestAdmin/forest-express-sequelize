'use strict';
const _ = require('lodash');

function QueryStatGetter(params, opts) {

  this.perform = function () {
    if (params.record_id) {
      params.query = params.query.replace('?', params.record_id);
    }

    return opts.connections[0].query(params.query, {
      type: opts.sequelize.QueryTypes.SELECT
    })
    .then(function (result) {
      return result;
    });
  };
}

module.exports = QueryStatGetter;
