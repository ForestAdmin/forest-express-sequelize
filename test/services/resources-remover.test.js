import Interface from 'forest-express';
import RessourcesRemover from '../../src/services/resources-remover';
import { InvalidParameterError } from '../../src/services/errors';

describe('services > resources-remover', () => {
  describe('perform', () => {
    it('should throw error if ids is not an array or empty', () => {
      expect.assertions(3);
      expect(() => new RessourcesRemover(null, []).perform()).toThrow(InvalidParameterError);
      expect(() => new RessourcesRemover(null, 'foo').perform()).toThrow(InvalidParameterError);
      expect(() => new RessourcesRemover(null, {}).perform()).toThrow(InvalidParameterError);
    });

    it('should remove resources with simple keys', async () => {
      expect.assertions(1);
      function Actor() {
        this.name = 'actor';
        this.primaryKeys = { id: {} };
        this.destroy = (condition) => {
          expect(condition).toStrictEqual({ where: { id: ['1', '2'] } });
        };
      }
      Interface.Schemas = { schemas: { actor: { idField: 'id' } } };
      await new RessourcesRemover(new Actor(), ['1', '2']).perform();
    });

    it('should remove resources with composite keys', async () => {
      expect.assertions(1);
      function ActorFilm() {
        this.name = 'actorFilm';
        this.primaryKeys = { actorId: {}, filmId: {} };
        this.destroy = (condition) => {
          expect(condition).toStrictEqual({ where: { actorId: ['1', '3'], filmId: ['2', '4'] } });
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
      await new RessourcesRemover(new ActorFilm(), ['1-2', '3-4']).perform();
    });
  });
});
