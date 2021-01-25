import Interface from 'forest-express';
import sinon from 'sinon';
import chai from 'chai';

const ResourceGetter = require('../../src/services/resource-getter');
const {
  sequelize,
  dataTypes,
} = require('sequelize-test-helpers');

chai.use(require('sinon-chai'));

const { expect } = chai;

const Owner = sequelize.define('owner', {
  name: { type: dataTypes.STRING },
});
Object.defineProperty(Owner, 'name', {
  writable: true,
  value: 'owner',
});

const Project = sequelize.define('project', {
  name: { type: dataTypes.STRING },
  ownerId: { type: dataTypes.INTEGER },
});
Object.defineProperty(Project, 'name', {
  writable: true,
  value: 'project',
});

Interface.Schemas = {
  schemas: {
    owner: {
      name: 'owner',
      idField: 'id',
      primaryKeys: ['id'],
      isCompositePrimary: false,
      fields: [
        { field: 'id', type: 'Number' },
        { field: 'name', type: 'STRING' },
      ],
    },
    project: {
      name: 'project',
      idField: 'id',
      primaryKeys: ['id'],
      isCompositePrimary: false,
      fields: [
        { field: 'id', type: 'Number' },
        { field: 'name', type: 'STRING' },
        { field: 'ownerId', type: 'Number', reference: 'owner.ownerId' },
      ],
    },
  },
};

describe('services > resources-creator', () => {
  describe('perform', () => {
    it('should correctly create record', async () => {
      const result = {
        id: 1,
        name: 'foo',
      };

      sinon.stub(ResourceGetter, 'default').callsFake(sinon.stub().returns({
        perform: sinon.stub().returns(result)
      }));
      Owner.build.returns({
        id: 1,
        name: 'foo',
        validate: sinon.stub().resolves(),
        save: sinon.stub().resolves(result),
      });
      const ResourceCreator = require('../../src/services/resource-creator');
      const owner = await new ResourceCreator(Owner, result).perform();

      expect(Owner.build).to.have.been.called;
    });

    // it('should correctly create record with belongsTo association', async () => {
    //   expect.assertions(1);
    //
    // });
  });
});
