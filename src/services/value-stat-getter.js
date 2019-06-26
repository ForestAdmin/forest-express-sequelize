import _ from 'lodash';
import { Schemas } from 'forest-express';
import Operators from '../utils/operators';
import OperatorDateIntervalParser from './operator-date-interval-parser';
import ConditionsParser from './conditions-parser';

function ValueStatGetter(model, params, options) {
  const OPERATORS = new Operators(options);
  const operatorDateIntervalParser = new OperatorDateIntervalParser(params.timezone, options);

  const schema = Schemas.schemas[model.name];
  function getAggregate() {
    return params.aggregate.toLowerCase();
  }

  function getAggregateField() {
    // NOTICE: As MySQL cannot support COUNT(table_name.*) syntax, fieldName
    //         cannot be '*'.
    const fieldName = params.aggregate_field || schema.primaryKeys[0] || schema.fields[0].field;
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

  this.perform = () => {
    let countCurrent;
    const aggregateField = getAggregateField();
    const aggregate = getAggregate();
    const conditionsParser = new ConditionsParser(params.filters, params.timezone, options);
    const where = conditionsParser.perform();
    const rawPreviousInterval = conditionsParser.getPreviousIntervalCondition();

    return model
      .unscoped()
      .aggregate(aggregateField, aggregate, {
        include: getIncludes(),
        where,
      })
      .then((count) => {
        countCurrent = count || 0;

        if (rawPreviousInterval) {
          const formatedPreviousDateInterval = operatorDateIntervalParser
            .getPreviousDateIntervalFilter(rawPreviousInterval.operator, rawPreviousInterval.value);

          if (where[OPERATORS.AND]) {
            where[OPERATORS.AND].forEach((condition) => {
              if (condition[rawPreviousInterval.field]) {
                // NOTICE: Might not work on super edgy cases (when the 'rawPreviousInterval.field'
                //        appears twice ont the filters)
                condition[rawPreviousInterval.field] = formatedPreviousDateInterval;
              }
            });
          } else {
            where[rawPreviousInterval.field] = formatedPreviousDateInterval;
          }

          return model
            .unscoped()
            .aggregate(aggregateField, aggregate, {
              include: getIncludes(),
              where,
            })
            .then(resultCount => resultCount || 0);
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
