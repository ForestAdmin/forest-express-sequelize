const Interface = require('forest-express');
const { STRING, INTEGER } = require('sequelize');
const { Op } = require('sequelize');
const databases = require('../databases');
const runWithConnection = require('../helpers/run-with-connection');
const ResourcesGetter = require('../../src/services/resources-getter');

function rot13(s) {
  return s.replace(/[A-Z]/gi, (c) =>
    'NOPQRSTUVWXYZABCDEFGHIJKLMnopqrstuvwxyzabcdefghijklm'[
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.indexOf(c)]);
}

async function setup(sequelize) {
  Interface.Schemas = { schemas: {} };

  // Shelves
  const Shelves = sequelize.define('shelves', {
    id: { type: INTEGER, primaryKey: true },
    floor: { field: 'floor', type: INTEGER },
  }, { tableName: 'shelves', timestamps: false });

  Interface.Schemas.schemas.shelves = {
    name: 'shelves',
    idField: 'id',
    primaryKeys: ['id'],
    isCompositePrimary: false,
    fields: [
      { field: 'id', type: 'Number' },
      { field: 'floor', columnName: 'floor', type: 'Number' },
    ],
  };

  // Books
  const Books = sequelize.define('books', {
    id: { type: INTEGER, primaryKey: true },
    title: { field: 'title', type: STRING },
  }, { tableName: 'books', timestamps: false });

  Interface.Schemas.schemas.books = {
    name: 'books',
    idField: 'id',
    primaryKeys: ['id'],
    isCompositePrimary: false,
    fields: [
      { field: 'id', type: 'Number' },
      { field: 'title', columnName: 'title', type: 'String' },
      {
        field: 'encrypted',
        isVirtual: true,
        type: 'String',
        get: (record) => rot13(record.title),
        search: (query, search) => {
          query.where[Op.and][0][Op.or].push({
            title: rot13(search),
          });
        },
      },
    ],
  };

  // Reviews
  const Reviews = sequelize.define('reviews', {
    id: { type: INTEGER, primaryKey: true },
    content: { field: 'content', type: STRING },
  }, { tableName: 'reviews', timestamps: false });

  Interface.Schemas.schemas.reviews = {
    name: 'reviews',
    idField: 'id',
    primaryKeys: ['id'],
    isCompositePrimary: false,
    fields: [
      { field: 'id', type: 'Number' },
      { field: 'content', columnName: 'content', type: 'String' },
      {
        field: 'floor',
        isVirtual: true,
        type: 'String',
        get: () => null,
        search: (query, search) => {
          query.include.push({
            association: 'book',
            include: [{ association: 'shelve' }],
          });

          query.where[Op.and][0][Op.or].push({
            '$book.shelve.floor$': Number.parseInt(search, 10),
          });
        },
      },
    ],
  };

  // Relations

  Books.belongsTo(Shelves, {
    foreignKey: { name: 'shelveId' },
    as: 'shelve',
  });

  Reviews.belongsTo(Books, {
    foreignKey: { name: 'bookId' },
    as: 'book',
  });


  await sequelize.sync({ force: true });

  await Shelves.create({ id: 1, floor: 666 });
  await Shelves.create({ id: 2, floor: 667 });

  await Books.create({ id: 1, shelveId: 1, title: 'nowhere' });

  await Reviews.create({ id: 1, bookId: 1, content: 'abc' });

  return { Shelves, Books, Reviews };
}

describe('integration > Smart field', () => {
  Object.values(databases).forEach((connectionManager) => {
    describe(`dialect ${connectionManager.getDialect()}`, () => {
      it('should not find books matching the encrypted field', async () => {
        expect.assertions(1);

        await runWithConnection(connectionManager, async (sequelize) => {
          const { Books } = await setup(sequelize);
          const params = {
            fields: { books: 'id,title,encrypted' },
            sort: 'id',
            page: { number: '1', size: '30' },
            timezone: 'Europe/Paris',
            search: 'hello',
          };

          const count = await new ResourcesGetter(Books, null, params).count();
          expect(count).toStrictEqual(0);
        });
      });

      it('should find books matching the encrypted field', async () => {
        expect.assertions(1);

        await runWithConnection(connectionManager, async (sequelize) => {
          const { Books } = await setup(sequelize);
          const params = {
            fields: { books: 'id,title,encrypted' },
            sort: 'id',
            page: { number: '1', size: '30' },
            timezone: 'Europe/Paris',
            search: 'abjurer',
          };

          const count = await new ResourcesGetter(Books, null, params).count();
          expect(count).toStrictEqual(1);
        });
      });

      it('should not find reviews on the floor 500', async () => {
        expect.assertions(1);

        await runWithConnection(connectionManager, async (sequelize) => {
          const { Reviews } = await setup(sequelize);
          const params = {
            fields: { books: 'id,title,encrypted' },
            sort: 'id',
            page: { number: '1', size: '30' },
            timezone: 'Europe/Paris',
            search: '500',
          };

          const count = await new ResourcesGetter(Reviews, null, params).count();
          expect(count).toStrictEqual(0);
        });
      });

      it('should find reviews on the floor 666', async () => {
        expect.assertions(1);

        await runWithConnection(connectionManager, async (sequelize) => {
          const { Reviews } = await setup(sequelize);
          const params = {
            fields: { books: 'id,title,encrypted' },
            sort: 'id',
            page: { number: '1', size: '30' },
            timezone: 'Europe/Paris',
            search: '666',
          };

          const count = await new ResourcesGetter(Reviews, null, params).count();
          expect(count).toStrictEqual(1);
        });
      });
    });
  });
});
