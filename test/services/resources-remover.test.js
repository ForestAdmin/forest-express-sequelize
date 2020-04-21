import Interface from 'forest-express';
import Sequelize, { Op } from 'sequelize';
import ResourcesRemover from '../../src/services/resources-remover';
import { InvalidParameterError } from '../../src/services/errors';

describe('services > resources-remover', () => {
  describe('perform', () => {
    it('should throw error if ids is not an array or empty', () => {
      expect.assertions(3);
      expect(() => new ResourcesRemover(null, []).perform()).toThrow(InvalidParameterError);
      expect(() => new ResourcesRemover(null, 'foo').perform()).toThrow(InvalidParameterError);
      expect(() => new ResourcesRemover(null, {}).perform()).toThrow(InvalidParameterError);
    });

    it('should remove resources with a single primary key', async () => {
      expect.assertions(1);
      function Actor() {
        this.name = 'actor';
        this.primaryKeys = { id: {} };
        this.destroy = (condition) => {
          expect(condition).toStrictEqual({ where: { id: ['1', '2'] } });
        };
      }
      Interface.Schemas = { schemas: { actor: { idField: 'id' } } };
      await new ResourcesRemover(new Actor(), ['1', '2']).perform();
    });

    it('should remove resources with composite keys', async () => {
      expect.assertions(1);
      function ActorFilm() {
        this.name = 'actorFilm';
        this.primaryKeys = { actorId: {}, filmId: {} };
        this.destroy = (condition) => {
          expect(condition).toStrictEqual({
            where: {
              [Op.or]: [
                { actorId: '1', filmId: '2' },
                { actorId: '3', filmId: '4' },
              ],
            },
          });
        };
      }
      Interface.Schemas = {
        schemas: {
          actorFilm: {
            isCompositePrimary: true,
            primaryKeys: ['actorId', 'filmId'],
          },
        },
      };
      const sequelizeOptions = { sequelize: Sequelize };
      await new ResourcesRemover(new ActorFilm(), ['1|2', '3|4'], sequelizeOptions).perform();
    });
  });
});
