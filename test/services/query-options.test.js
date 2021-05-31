import Sequelize from 'sequelize';
import Interface from 'forest-express';
import QueryOptions from '../../src/services/query-options';

describe('services > query-options', () => {
  describe('order', () => {
    const model = {
      name: 'actor',
      unscoped: () => model,
      sequelize: { constructor: Sequelize, options: { dialect: 'mysql' } },
      associations: {},
    };
    Interface.Schemas = { schemas: { actor: { idField: 'id' } } };

    it('should return null if there is no sort param', async () => {
      expect.assertions(1);
      const options = new QueryOptions(model);
      await options.sort();
      expect(options.sequelizeOptions.order).toBeUndefined();
    });

    it('should return should set order ASC by default', async () => {
      expect.assertions(1);
      const options = new QueryOptions(model);
      await options.sort('id');
      expect(options.sequelizeOptions.order).toStrictEqual([['id', 'ASC']]);
    });

    it('should return should set order DESC if there is a minus sign', async () => {
      expect.assertions(1);
      const options = new QueryOptions(model);
      await options.sort('-id');
      expect(options.sequelizeOptions.order).toStrictEqual([['id', 'DESC']]);
    });
  });
});
