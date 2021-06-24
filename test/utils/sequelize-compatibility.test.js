const { postProcess } = require('../../src/utils/sequelize-compatibility');

const sequelize = { constructor: { version: '4.44.4' } };
const Model = {
  sequelize,
  name: 'model',
  associations: {
    submodelAlias: {
      target: {
        sequelize,
        name: 'submodel',
        associations: {
          subsubmodel1Alias: {
            target: {
              sequelize,
              name: 'subsubmodel2',
              associations: {},
            },
          },
          subsubmodel2Alias: {
            target: {
              sequelize,
              name: 'subsubmodel1',
              associations: {},
            },
          },
        },
      },
    },
  },
};

const SubModel = Model.associations.submodelAlias.target;
const SubSubModel1 = SubModel.associations.subsubmodel1Alias.target;
const SubSubModel2 = SubModel.associations.subsubmodel2Alias.target;


describe('utils > sequelize-compatibility', () => {
  describe('postProcess -> normalizeInclude', () => {
    it('should work when using the {model, as} syntax', () => {
      expect.assertions(1);

      const options = postProcess(Model, { include: [{ model: SubModel, as: 'submodelAlias' }] });
      expect(options).toStrictEqual({
        include: [{ as: 'submodelAlias', model: SubModel }],
      });
    });

    it('should work when using the {model} syntax', () => {
      expect.assertions(1);

      const options = postProcess(Model, { include: [{ model: SubModel }] });
      expect(options).toStrictEqual({
        include: [{ as: 'submodelAlias', model: SubModel }],
      });
    });

    it('should work when using the {as} syntax', () => {
      expect.assertions(1);

      const options = postProcess(Model, { include: [{ as: 'submodelAlias' }] });
      expect(options).toStrictEqual({
        include: [{ as: 'submodelAlias', model: SubModel }],
      });
    });

    it('should work when using the {association} syntax', () => {
      expect.assertions(1);

      const options = postProcess(Model, { include: [{ association: 'submodelAlias' }] });
      expect(options).toStrictEqual({
        include: [{ as: 'submodelAlias', model: SubModel }],
      });
    });

    it('should work when using the string syntax', () => {
      expect.assertions(1);

      const options = postProcess(Model, { include: ['submodelAlias'] });
      expect(options).toStrictEqual({
        include: [{ as: 'submodelAlias', model: SubModel }],
      });
    });

    it('should work when using the Model syntax', () => {
      expect.assertions(1);

      const options = postProcess(Model, { include: [SubModel] });
      expect(options).toStrictEqual({
        include: [{ as: 'submodelAlias', model: SubModel }],
      });
    });
  });

  describe('postProcess -> bubbleWhere', () => {
    it('work in a simple case', () => {
      expect.assertions(1);

      const options = postProcess(Model, {
        include: [{ as: 'submodelAlias', where: { id: 1 } }],
        where: { id: 1 },
      });

      expect(options).toStrictEqual({
        include: [{ as: 'submodelAlias', model: SubModel }],
        where: { id: 1, '$submodelAlias.id$': 1 },
      });
    });

    it('should work when the parent have no where condition', () => {
      expect.assertions(1);

      const options = postProcess(Model, {
        include: [{ as: 'submodelAlias', where: { id: 1 } }],
      });

      expect(options).toStrictEqual({
        include: [{ as: 'submodelAlias', model: SubModel }],
        where: { '$submodelAlias.id$': 1 },
      });
    });

    it('should work when multiple include have where conditions', () => {
      expect.assertions(1);

      const options = postProcess(Model, {
        include: [
          SubModel,
          'submodelAlias',
          { as: 'submodelAlias', where: { id: 1 } },
          { association: 'submodelAlias', where: { title: 'Title' } },
          { model: SubModel, where: { subTitle: 'subTitle' } },
        ],
        where: {
          '$submodelAlias.rating$': 34,
        },
      });

      expect(options).toStrictEqual({
        include: [{ as: 'submodelAlias', model: SubModel }],
        where: {
          '$submodelAlias.id$': 1,
          '$submodelAlias.title$': 'Title',
          '$submodelAlias.subTitle$': 'subTitle',
          '$submodelAlias.rating$': 34,
        },
      });
    });

    it('should work recursively', () => {
      expect.assertions(1);

      const options = postProcess(Model, {
        include: [
          SubModel,
          'submodelAlias',
          {
            as: 'submodelAlias',
            include: [
              {
                as: 'subsubmodel1Alias',
                model: SubSubModel1,
                where: { subsubTitle: 'subsubtitle1' },
              },
            ],
            where: { id: 1 },
          },
          { association: 'submodelAlias', where: { title: 'Title' } },
          {
            model: SubModel,
            include: [
              {
                model: SubSubModel2,
                where: { subsubTitle: 'subsubtitle2' },
              },
            ],
            where: { subTitle: 'subTitle' },
          },
        ],
        where: {
          '$submodelAlias.rating$': 34,
        },
      });

      expect(options).toStrictEqual({
        include: [
          {
            as: 'submodelAlias',
            model: SubModel,
            include: [
              { as: 'subsubmodel1Alias', model: SubSubModel1 },
              { as: 'subsubmodel2Alias', model: SubSubModel2 },
            ],
          },
        ],
        where: {
          '$submodelAlias.id$': 1,
          '$submodelAlias.title$': 'Title',
          '$submodelAlias.subTitle$': 'subTitle',
          '$submodelAlias.rating$': 34,
          '$submodelAlias.subsubmodel1Alias.subsubTitle$': 'subsubtitle1',
          '$submodelAlias.subsubmodel2Alias.subsubTitle$': 'subsubtitle2',
        },
      });
    });
  });
});
