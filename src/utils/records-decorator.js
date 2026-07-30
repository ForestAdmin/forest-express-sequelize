const _ = require('lodash');

function hasCaseInsensitiveMatch(value, searchValue) {
  const normalizedValue = value.toString().toLowerCase();
  const normalizedSearchValue = searchValue.toString().toLowerCase();

  return normalizedValue.includes(normalizedSearchValue);
}

function decorateForSearch(records, fields, searchValue) {
  let matchFields = {};
  records.forEach((record, index) => {
    fields.forEach((fieldName) => {
      const value = record[fieldName];
      if (value) {
        if (hasCaseInsensitiveMatch(value, searchValue)) {
          if (!matchFields[index]) {
            matchFields[index] = {
              id: record.id,
              search: [],
            };
          }
          matchFields[index].search.push(fieldName);
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
