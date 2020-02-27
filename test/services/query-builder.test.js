import Sequelize from 'sequelize';
import Interface from 'forest-express';
import QueryBuilder from '../../src/services/query-builder';

describe('services > query-builder', () => {
  describe('getOrder', () => {
    const sequelizeOptions = { sequelize: Sequelize };
    const model = { name: 'actor' };
    Interface.Schemas = { schemas: { actor: { idField: 'id' } } };

    it('should return null if there is no sort param', () => {
      expect.assertions(1);
      const order = new QueryBuilder(model, sequelizeOptions, {}).getOrder();
      expect(order).toBeNull();
    });

    it('should return should set order ASC by default', () => {
      expect.assertions(1);
      const order = new QueryBuilder(model, sequelizeOptions, { sort: 'id' }).getOrder();
      expect(order).toStrictEqual([['id', 'ASC']]);
    });

    it('should return should set order DESC if there is a minus sign', () => {
      expect.assertions(1);
      const order = new QueryBuilder(model, sequelizeOptions, { sort: '-id' }).getOrder();
      expect(order).toStrictEqual([['id', 'DESC']]);
    });
  });
});
