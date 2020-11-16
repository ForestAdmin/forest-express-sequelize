const LiveQueryChecker = require('./live-query-checker');

function QueryStatGetter(params, opts) {
  const QUERY_OPTIONS_SELECT = { type: opts.Sequelize.QueryTypes.SELECT };

  this.perform = function perform() {
    let rawQuery = params.query.trim();

    new LiveQueryChecker().perform(rawQuery);

    if (params.record_id) {
      rawQuery = rawQuery.replace(new RegExp('\\?', 'g'), params.record_id);
    }

    // WARNING: Choosing the first connection might generate issues if the model
    //          does not belongs to this database.
    return Object.values(opts.connections)[0].query(rawQuery, QUERY_OPTIONS_SELECT);
  };
}

module.exports = QueryStatGetter;
