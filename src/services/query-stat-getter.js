
function QueryStatGetter(params, opts) {
  this.perform = function perform() {
    let rawQuery = params.query.trim();
    const bind = params.contextVariables || {};


    if (params.record_id && !rawQuery.includes('$$recordId')) {
      rawQuery = rawQuery.replace(/\\?/g, '$$$$recordId');
      bind.recordId = params.record_id;
    }

    // WARNING: Choosing the first connection might generate issues if the model
    //          does not belongs to this database.
    return Object.values(opts.connections)[0].query(rawQuery, {
      type: opts.Sequelize.QueryTypes.SELECT,
      bind,
    });
  };
}

module.exports = QueryStatGetter;
