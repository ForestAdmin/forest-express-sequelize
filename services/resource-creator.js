'use strict';
var ResourceGetter = require('./resource-getter');

function ResourceCreator(model, params) {

  this.perform = function () {
    return model.create(params)
      .then(function (record) {
        return new ResourceGetter(model, { recordId: record.id });
      });
  };
}

module.exports = ResourceCreator;
