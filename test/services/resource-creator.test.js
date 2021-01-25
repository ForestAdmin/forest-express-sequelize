import Interface from 'forest-express';

const {
  sequelize,
  dataTypes,
} = require('sequelize-test-helpers');

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

Owner.associate = (models) => {
  Owner.hasMany(models.Project, {
    foreignKey: {
      name: 'ownerIdKey',
      field: 'owner_id',
    },
    as: 'ownerProjects',
  });
};

Project.associate = (models) => {
  Project.belongsTo(models.Owner, {
    foreignKey: {
      name: 'ownerIdKey',
      field: 'owner_id',
    },
    as: 'owner',
  });
};
const models = { Project, Owner };
Owner.associate(models);
Project.associate(models);

Owner.associations = {
  project: {
    associationType: 'HasMany',
  },
};

Project.associations = {
  owner: {
    associationType: 'BelongsTo',
    targetKey: 'id',
    target: {
      name: 'owner',
    },
  },
};

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
      expect.assertions(2);
      const params = {
        id: 1,
        name: 'foo',
      };
      const mockResult = params;

      jest.mock('../../src/services/resource-getter', () => ({
        __esModule: true, // this property makes it work
        default: jest.fn().mockReturnValue({
          perform: jest.fn().mockReturnValue(mockResult),
        }),
      }));
      const mockRecordCreated = {
        ...mockResult,
        validate: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(mockResult),
      };
      const buildSpy = jest.spyOn(Project, 'build').mockReturnValue(mockRecordCreated);

      // need to be declared here for resource getter to be modified
      // eslint-disable-next-line global-require
      const ResourceCreator = require('../../src/services/resource-creator');
      const owner = await new ResourceCreator(Owner, params).perform();

      expect(buildSpy).toHaveBeenCalledWith(params);
      expect(owner).toBe(mockResult);
    });

    it('should correctly create record with belongsTo association', async () => {
      expect.assertions(2);

      const projectParams = {
        id: 1,
        name: 'bar',
        owner: 1,
      };
      const mockProjectResult = projectParams;
      const mockRecordCreated = {
        ...mockProjectResult,
        validate: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(mockProjectResult),
        setOwner: jest.fn(),
      };
      const buildSpy = jest.spyOn(Project, 'build').mockReturnValue(mockRecordCreated);
      const setOwnerSpy = jest.spyOn(mockRecordCreated, 'setOwner');

      jest.mock('../../src/services/resource-getter', () => ({
        __esModule: true, // this property makes it work
        default: jest.fn().mockReturnValue({
          perform: jest.fn().mockReturnValue(mockProjectResult),
        }),
      }));
      // need to be declared here for resource getter to be modified
      // eslint-disable-next-line global-require
      const ResourceCreator = require('../../src/services/resource-creator');
      await new ResourceCreator(Project, projectParams).perform();

      expect(buildSpy).toHaveBeenCalledWith(projectParams);
      expect(setOwnerSpy).toHaveBeenCalledWith(projectParams.owner, { save: false });
    });
  });
});
