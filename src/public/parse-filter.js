function makeParseFilter(FiltersParser, publicExports) {
  /**
   * @param {*} filter
   * @param {*} modelSchema
   * @param {string} timezone
   * @returns {Promise<any>} Sequelize condition
   */
  return function parseFilter(filter, modelSchema, timezone) {
    if (!publicExports.opts) throw new Error('Liana must be initialized before using parseFilter');

    const parser = new FiltersParser(modelSchema, timezone, publicExports.opts);

    return parser.perform(JSON.stringify(filter));
  };
}

module.exports = makeParseFilter;
