const sequelize = require('sequelize');
const Operators = require('../../src/utils/operators');

describe('utils > operators', () => {
  describe('with an old sequelize', () => {
    it('should return a valid operator', () => {
      expect.assertions(2);

      const Op = new Operators();
      expect(Op.AND).toStrictEqual('$and');
      expect(Op.CONTAINS).toStrictEqual('$contains');
      expect(Op.EQ).toStrictEqual('$eq');
      expect(Op.GT).toStrictEqual('$gt');
      expect(Op.GTE).toStrictEqual('$gte');
      expect(Op.IN).toStrictEqual('$in');
      expect(Op.LIKE).toStrictEqual('$like');
      expect(Op.LT).toStrictEqual('$lt');
      expect(Op.LTE).toStrictEqual('$lte');
      expect(Op.NE).toStrictEqual('$ne');
      expect(Op.NOT).toStrictEqual('$not');
      expect(Op.NOT_LIKE).toStrictEqual('$notLike');
      expect(Op.OR).toStrictEqual('$or');
    });
  });

  describe('with an up to date sequelize', () => {
    it('should return a valid operator', () => {
      expect.assertions(2);

      const Op = new Operators({ sequelize });
      expect(Op.AND).toStrictEqual(sequelize.Op.and);
      expect(Op.CONTAINS).toStrictEqual(sequelize.Op.contains);
      expect(Op.EQ).toStrictEqual(sequelize.Op.eq);
      expect(Op.GT).toStrictEqual(sequelize.Op.gt);
      expect(Op.GTE).toStrictEqual(sequelize.Op.gte);
      expect(Op.IN).toStrictEqual(sequelize.Op.in);
      expect(Op.LIKE).toStrictEqual(sequelize.Op.like);
      expect(Op.LT).toStrictEqual(sequelize.Op.lt);
      expect(Op.LTE).toStrictEqual(sequelize.Op.lte);
      expect(Op.NE).toStrictEqual(sequelize.Op.ne);
      expect(Op.NOT).toStrictEqual(sequelize.Op.not);
      expect(Op.NOT_LIKE).toStrictEqual(sequelize.Op.notLike);
      expect(Op.OR).toStrictEqual(sequelize.Op.or);
    });
  });
});
