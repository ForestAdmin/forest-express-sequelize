const sequelize = require('sequelize');
const Operators = require('../../src/utils/operators');

describe('utils > operators', () => {
  describe('with an old sequelize', () => {
    it('should return a valid operator', () => {
      expect.assertions(2);

      const Op = new Operators();
      expect(Op.AND).toStrictEqual('$and');
      expect(Op.CONTAINS).toStrictEqual('$contains');
    });
  });

  describe('with an up to date sequelize', () => {
    it('should return a valid operator', () => {
      expect.assertions(2);

      const Op = new Operators({ sequelize });
      expect(Op.AND).toStrictEqual(sequelize.Op.AND);
      expect(Op.CONTAINS).toStrictEqual(sequelize.Op.CONTAINS);
    });
  });
});
