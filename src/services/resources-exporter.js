const _ = require('lodash');
const ResourcesGetter = require('./resources-getter');
const HasManyGetter = require('./has-many-getter');

const BATCH_INITIAL_PAGE = 1;
const BATCH_SIZE = 1000;

function ResourcesExporter(model, options, params, association, user) {
  const primaryKeys = _.keys((association || model).primaryKeys);
  params.sort = primaryKeys[0] || 'id';
  params.page = { size: BATCH_SIZE };

  function getter() {
    if (association) {
      return new HasManyGetter(model, association, options, params, user);
    }
    return new ResourcesGetter(model, options, params, user);
  }

  function retrieveBatch(dataSender, pageNumber) {
    params.page.number = pageNumber;
    return getter()
      .perform()
      .then((results) => {
        const records = results[0];

        return dataSender(records)
          .then(() => {
            if (records.length === BATCH_SIZE) {
              return retrieveBatch(dataSender, pageNumber + 1);
            }
            return null;
          });
      });
  }

  this.perform = (dataSender) => retrieveBatch(dataSender, BATCH_INITIAL_PAGE);
}

module.exports = ResourcesExporter;
