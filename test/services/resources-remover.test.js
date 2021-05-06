import { scopeManager } from 'forest-express';
import Sequelize, { Op } from 'sequelize';
import { InvalidParameterError } from '../../src/services/errors';
import ResourcesRemover from '../../src/services/resources-remover';

describe('services > resources-remover', () => {
  const user = { renderingId: 1 };
  const params = { timezone: 'Europe/Paris' };

  describe('perform', () => {
    it('should throw error if ids is not an array or empty', async () => {
      expect.assertions(3);

      const spy = jest.spyOn(scopeManager, 'getScopeForUser').mockReturnValue(null);
      function Actor() {
        this.unscoped = () => this;
        this.sequelize = { constructor: Sequelize };
      }

      await expect(new ResourcesRemover(new Actor(), params, [], user).perform())
        .rejects
        .toBeInstanceOf(InvalidParameterError);

      await expect(new ResourcesRemover(new Actor(), params, 'foo', user).perform())
        .rejects
        .toBeInstanceOf(InvalidParameterError);

      await expect(new ResourcesRemover(new Actor(), params, {}, user).perform())
        .rejects
        .toBeInstanceOf(InvalidParameterError);

      spy.mockRestore();
    });

    it('should remove resources with a single primary key', async () => {
      expect.assertions(1);

      const spy = jest.spyOn(scopeManager, 'getScopeForUser').mockReturnValue(null);
      function Actor() {
        this.sequelize = { constructor: Sequelize };
        this.name = 'actor';
        this.primaryKeys = { id: {} };
        this.unscoped = () => this;
        this.associations = {};
        this.destroy = (condition) => {
          expect(condition).toStrictEqual({ where: { id: ['1', '2'] } });
        };
      }

      await new ResourcesRemover(new Actor(), params, ['1', '2'], user).perform();
      spy.mockRestore();
    });

    it('should remove resources with composite keys', async () => {
      expect.assertions(1);

      const spy = jest.spyOn(scopeManager, 'getScopeForUser').mockReturnValue(null);
      function ActorFilm() {
        this.sequelize = { constructor: Sequelize };
        this.name = 'actorFilm';
        this.primaryKeys = { actorId: {}, filmId: {} };
        this.unscoped = () => this;
        this.associations = {};
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

      await new ResourcesRemover(new ActorFilm(), params, ['1|2', '3|4'], user).perform();
      spy.mockRestore();
    });
  });
});
