import _ from 'lodash';
import { Schemas } from 'forest-express';
import Operators from '../utils/operators';
import BaseStatGetter from './base-stat-getter';
import OperatorDateIntervalParser from './operator-date-interval-parser';

// jshint sub: true
function ValueStatGetter(model, params, options) {
  BaseStatGetter.call(this, model, params, options);

  const OPERATORS = new Operators(options);

  const schema = Schemas.schemas[model.name];
  function getAggregate() {
    return params.aggregate.toLowerCase();
  }

  function getAggregateField() {
    // NOTICE: As MySQL cannot support COUNT(table_name.*) syntax, fieldName cannot be '*'.
    const fieldName = params.aggregate_field
      || schema.primaryKeys[0]
      || schema.fields[0].field;
    return `${schema.name}.${fieldName}`;
  }

  function getIncludes() {
    const includes = [];
    _.values(model.associations).forEach((association) => {
      if (['HasOne', 'BelongsTo'].indexOf(association.associationType) > -1) {
        includes.push({
          model: association.target.unscoped(),
          as: association.associationAccessor,
          attributes: [],
        });
      }
    });

    return includes;
  }

  function getIntervalDateFilterForPrevious() {
    let intervalDateFilter;

    params.filters.forEach((filter) => {
      const operatorValueParser =
        new OperatorDateIntervalParser(filter.value, params.timezone, options);
      if (operatorValueParser.hasPreviousInterval()) {
        intervalDateFilter = filter;
      }
    });
    return intervalDateFilter;
  }

  this.perform = () => {
    let countCurrent;
    const aggregateField = getAggregateField();
    const aggregate = getAggregate();
    const filters = this.getFilters();
    const filterDateIntervalForPrevious = getIntervalDateFilterForPrevious();

    return model
      .unscoped()
      .aggregate(aggregateField, aggregate, {
        include: getIncludes(),
        where: filters,
      })
      .then((count) => {
        countCurrent = count || 0;

        // NOTICE: Search for previous interval value only if the filterType is
        //         'AND', it would not be pertinent for a 'OR' filterType.
        if (filterDateIntervalForPrevious && params.filterType === 'and') {
          const operatorValueParser = new OperatorDateIntervalParser(
            filterDateIntervalForPrevious.value,
            params.timezone,
            options,
          );
          const conditions = filters[OPERATORS.AND];
          conditions.forEach((condition) => {
            if (condition[filterDateIntervalForPrevious.field]) {
              condition[filterDateIntervalForPrevious.field] =
                operatorValueParser.getIntervalDateFilterForPreviousInterval();
            }
          });
          return model
            .unscoped()
            .aggregate(aggregateField, aggregate, {
              include: getIncludes(),
              where: filters,
            })
            .then(currentCount => currentCount || 0);
        }
        return undefined;
      })
      .then(countPrevious => ({
        value: {
          countCurrent,
          countPrevious,
        },
      }));
  };
}

module.exports = ValueStatGetter;
