import Sequelize from 'sequelize';
import Operators from '../../src/utils/operators';

describe('utils > operators', () => {
  describe('with an old sequelize', () => {
    it('should return a valid operator', () => {
      expect.assertions(13);

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
      expect.assertions(13);

      const Op = new Operators({ Sequelize });
      expect(Op.AND).toStrictEqual(Sequelize.Op.and);
      expect(Op.CONTAINS).toStrictEqual(Sequelize.Op.contains);
      expect(Op.EQ).toStrictEqual(Sequelize.Op.eq);
      expect(Op.GT).toStrictEqual(Sequelize.Op.gt);
      expect(Op.GTE).toStrictEqual(Sequelize.Op.gte);
      expect(Op.IN).toStrictEqual(Sequelize.Op.in);
      expect(Op.LIKE).toStrictEqual(Sequelize.Op.like);
      expect(Op.LT).toStrictEqual(Sequelize.Op.lt);
      expect(Op.LTE).toStrictEqual(Sequelize.Op.lte);
      expect(Op.NE).toStrictEqual(Sequelize.Op.ne);
      expect(Op.NOT).toStrictEqual(Sequelize.Op.not);
      expect(Op.NOT_LIKE).toStrictEqual(Sequelize.Op.notLike);
      expect(Op.OR).toStrictEqual(Sequelize.Op.or);
    });
  });

  describe('getInstance', () => {
    it('should return the same object', () => {
      expect.assertions(1);

      const emptyOptions = {};
      const Op = Operators.getInstance(emptyOptions);

      expect(Op).toStrictEqual(Operators.getInstance(emptyOptions));
    });
  });
});
