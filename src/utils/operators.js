let instance = null;

function Operators(options) {
  if (instance) return instance;

  if (options && options.sequelize && options.sequelize.Op) {
    const { Op } = options.sequelize;
    this.AND = Op.and;
    this.EQ = Op.eq;
    this.GT = Op.gt;
    this.GTE = Op.gte;
    this.IN = Op.in;
    this.LIKE = Op.like;
    this.LT = Op.lt;
    this.LTE = Op.lte;
    this.NE = Op.ne;
    this.NOT = Op.not;
    this.NOT_LIKE = Op.notLike;
    this.OR = Op.or;
  } else {
    this.AND = '$and';
    this.EQ = '$eq';
    this.GT = '$gt';
    this.GTE = '$gte';
    this.IN = '$in';
    this.LIKE = '$like';
    this.LT = '$lt';
    this.LTE = '$lte';
    this.NE = '$ne';
    this.NOT = '$not';
    this.NOT_LIKE = '$notLike';
    this.OR = '$or';
  }

  instance = this;
  return this;
}

module.exports = Operators;
