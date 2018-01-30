'use strict';

function Operators(options) {
  if (options && options.sequelize && options.sequelize.Op) {
    var Op = options.sequelize.Op;
    return {
      AND: Op.and,
      EQ: Op.eq,
      GT: Op.gt,
      GTE: Op.gte,
      LIKE: Op.like,
      LT: Op.lt,
      LTE: Op.lte,
      NE: Op.ne,
      NOT_LIKE: Op.notLike,
      OR: Op.or,
    };
  }

  return {
    AND: '$and',
    EQ: '$eq',
    GT: '$gt',
    GTE: '$gte',
    LIKE: '$like',
    LT: '$lt',
    LTE: '$lte',
    NE: '$ne',
    NOT_LIKE: '$notLike',
    OR: '$or',
  };
}

module.exports = Operators;
