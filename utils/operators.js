'use strict';

function Operators(options) {
  if (options && options.sequelize && options.sequelize.Op) {
    var Op = options.sequelize.Op;
    return {
      AND: Op.and,
      EQ: Op.eq,
      GT: Op.gt,
      GTE: Op.gte,
      IN: Op.in,
      LIKE: Op.like,
      LT: Op.lt,
      LTE: Op.lte,
      NE: Op.ne,
      NOT: Op.not,
      NOT_LIKE: Op.notLike,
      OR: Op.or,
    };
  }

  return {
    AND: '$and',
    EQ: '$eq',
    GT: '$gt',
    GTE: '$gte',
    IN: '$in',
    LIKE: '$like',
    LT: '$lt',
    LTE: '$lte',
    NE: '$ne',
    NOT: '$not',
    NOT_LIKE: '$notLike',
    OR: '$or',
  };
}

module.exports = Operators;
