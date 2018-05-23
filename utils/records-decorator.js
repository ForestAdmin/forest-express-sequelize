'use strict';

var _ = require('lodash');

function decorateForSearch(records, fieldsSearched, searchValue) {
  var matchFields = {};
  records.forEach(function (record, index) {
    fieldsSearched.forEach(function (fieldName) {
      var value = record[fieldName];
      if (value) {
        value = value.toString();
        var match = fieldsSearched.includes(fieldName) && value.match(new RegExp(searchValue, 'i'));
        if (match) {
          if (!matchFields[index]) {
            matchFields[index] = {
              id: record.id,
              search: [],
            };
          }
          matchFields[index]['search'].push(fieldName);
        }
      }
    });
  });

  if (_.isEmpty(matchFields)) {
    matchFields = null;
  }

  return matchFields;
}

exports.decorateForSearch = decorateForSearch;
