'use strict';

function decorateForSearch(records, fieldsSearched, searchValue) {
  if (records[0] && records[0].dataValues) {
    records = records.map((record) => record.get({ plain: true }));
  }
  var matchFields = {};
  records.forEach((record, index) => {
    Object.keys(record).forEach(attributeName => {
      var value = record[attributeName];
      if (value) {
        value = value.toString();
        var match = fieldsSearched.includes(attributeName) && value.match(new RegExp(searchValue, 'i'));
        if (match) {
          if (!matchFields[index]) {
            matchFields[index] = {
              id: record.id,
              search: [],
            };
          }
          matchFields[index]['search'].push(attributeName);
        }
      }
    });
  });

  return matchFields;
}

exports.decorateForSearch = decorateForSearch;
