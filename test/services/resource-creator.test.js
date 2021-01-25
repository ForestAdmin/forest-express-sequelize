import Interface from 'forest-express';

const {
  sequelize,
  dataTypes,
} = require('sequelize-test-helpers');

// simple
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
const Shadow = sequelize.define('shadow', {
  name: { type: dataTypes.STRING },
  ownerId: { type: dataTypes.INTEGER },
});
Object.defineProperty(Shadow, 'name', {
  writable: true,
  value: 'shadow',
});
Owner.associate = (models) => {
  Owner.hasMany(models.Project, {
    foreignKey: {
      name: 'ownerIdKey',
      field: 'owner_id',
    },
    as: 'ownerProjects',
  });
  Owner.hasOne(models.Shadow, {
    foreignKey: {
      name: 'ownerIdKey',
      field: 'owner_id',
    },
    as: 'ownerShadow',
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
Shadow.associate = (models) => {
  Shadow.belongsTo(models.Owner, {
    foreignKey: {
      name: 'ownerIdKey',
      field: 'owner_id',
    },
    as: 'owner',
  });
};

// fk pointing to non primary key
const User = sequelize.define('user', {
  name: { type: dataTypes.STRING },
  userId: { type: dataTypes.INTEGER },
});
Object.defineProperty(Owner, 'name', {
  writable: true,
  value: 'user',
});
const Team = sequelize.define('team', {
  name: { type: dataTypes.STRING },
  userId: { type: dataTypes.INTEGER },
});
Object.defineProperty(Team, 'name', {
  writable: true,
  value: 'team',
});
User.associate = (models) => {
  User.hasMany(models.Team, {
    foreignKey: {
      name: 'teamIdKey',
      field: 'team_id',
    },
    sourceKey: 'userId',
    as: 'userTeams',
  });
};
Team.associate = (models) => {
  Team.belongsTo(models.User, {
    foreignKey: {
      name: 'userIdKey',
      field: 'user_id',
    },
    targetKey: 'userId',
    as: 'user',
  });
};

// associations
const models = {
  Project, Owner, Shadow, User, Team,
};
Object.values(models).forEach((model) => model.associate(models));

// simple
Owner.associations = {
  project: {
    associationType: 'HasMany',
  },
  shadow: {
    associationType: 'HasOne',
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
Shadow.associations = {
  owner: {
    associationType: 'BelongsTo',
    targetKey: 'id',
    target: {
      name: 'owner',
    },
  },
};

// fk pointing to non primary key
User.associations = {
  team: {
    associationType: 'HasMany',
  },
};
Team.associations = {
  user: {
    associationType: 'BelongsTo',
    targetKey: 'userId',
    target: {
      name: 'user',
      findById: jest.fn(),
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
        { field: 'ownerId', type: 'Number', reference: 'owner.id' },
      ],
    },
    shadow: {
      name: 'shadow',
      idField: 'id',
      primaryKeys: ['id'],
      isCompositePrimary: false,
      fields: [
        { field: 'id', type: 'Number' },
        { field: 'name', type: 'STRING' },
        { field: 'ownerId', type: 'Number', reference: 'owner.id' },
      ],
    },
    user: {
      name: 'user',
      idField: 'userId',
      primaryKeys: ['userId'],
      isCompositePrimary: false,
      fields: [
        { field: 'id', type: 'Number' },
        { field: 'name', type: 'STRING' },
        { field: 'userId', type: 'Number' },
      ],
    },
    team: {
      name: 'project',
      idField: 'id',
      primaryKeys: ['id'],
      isCompositePrimary: false,
      fields: [
        { field: 'id', type: 'Number' },
        { field: 'name', type: 'STRING' },
        { field: 'userId', type: 'Number', reference: 'user.userId' },
      ],
    },
  },
};

describe('services > resources-creator', () => {
  describe('perform', () => {
    it('should correctly create record', async () => {
      expect.assertions(3);
      const params = {
        id: 1,
        name: 'foo',
      };
      const mockResult = {
        ...params,
        setShadow: jest.fn(),
        addProject: jest.fn(),
      };

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
      const buildSpy = jest.spyOn(Owner, 'build').mockReturnValue(mockRecordCreated);
      const addProjectSpy = jest.spyOn(mockResult, 'addProject');

      // need to be declared here for resource getter to be modified
      // eslint-disable-next-line global-require
      const ResourceCreator = require('../../src/services/resource-creator');
      const owner = await new ResourceCreator(Owner, params).perform();

      expect(buildSpy).toHaveBeenCalledWith(params);
      expect(addProjectSpy).toHaveBeenCalledWith(params.project);
      expect(owner).toBe(mockResult);
    });

    it('should fail on validation', async () => {
      expect.assertions(3);
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
        validate: jest.fn().mockRejectedValue(new Error('validation fail')),
        save: jest.fn().mockResolvedValue(mockResult),
      };
      const validateSpy = jest.spyOn(mockRecordCreated, 'validate');
      const buildSpy = jest.spyOn(Owner, 'build').mockReturnValue(mockRecordCreated);
      // need to be declared here for resource getter to be modified
      // eslint-disable-next-line global-require
      const ResourceCreator = require('../../src/services/resource-creator');
      await expect(new ResourceCreator(Owner, params).perform()).rejects.toMatchObject({
        message: 'validation fail',
        name: 'ErrorHTTP422',
        status: 422,
      });

      expect(buildSpy).toHaveBeenCalledWith(params);
      expect(validateSpy).toHaveBeenCalledWith();
    });

    it('should correctly create record with belongsTo association', async () => {
      expect.assertions(2);

      const params = {
        id: 1,
        name: 'bar',
        owner: 1,
      };
      const mockResult = params;
      const mockRecordCreated = {
        ...mockResult,
        validate: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(mockResult),
        setOwner: jest.fn(),
      };
      const buildSpy = jest.spyOn(Project, 'build').mockReturnValue(mockRecordCreated);
      const setOwnerSpy = jest.spyOn(mockRecordCreated, 'setOwner');

      jest.mock('../../src/services/resource-getter', () => ({
        __esModule: true, // this property makes it work
        default: jest.fn().mockReturnValue({
          perform: jest.fn().mockReturnValue(mockResult),
        }),
      }));
      // need to be declared here for resource getter to be modified
      // eslint-disable-next-line global-require
      const ResourceCreator = require('../../src/services/resource-creator');
      await new ResourceCreator(Project, params).perform();

      expect(buildSpy).toHaveBeenCalledWith(params);
      expect(setOwnerSpy).toHaveBeenCalledWith(params.owner, { save: false });
    });

    it('should correctly create record with hasOne association', async () => {
      expect.assertions(2);

      const params = {
        id: 1,
        name: 'bar',
        shadow: 1,
        project: 1,
      };
      const mockResult = {
        ...params,
        setShadow: jest.fn(),
        addProject: jest.fn(),
      };
      const mockRecordCreated = {
        ...mockResult,
        validate: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(mockResult),
      };
      const buildSpy = jest.spyOn(Owner, 'build').mockReturnValue(mockRecordCreated);
      const setShadowSpy = jest.spyOn(mockResult, 'setShadow');

      jest.mock('../../src/services/resource-getter', () => ({
        __esModule: true, // this property makes it work
        default: jest.fn().mockReturnValue({
          perform: jest.fn().mockReturnValue(mockResult),
        }),
      }));
      // need to be declared here for resource getter to be modified
      // eslint-disable-next-line global-require
      const ResourceCreator = require('../../src/services/resource-creator');
      await new ResourceCreator(Owner, params).perform();

      expect(buildSpy).toHaveBeenCalledWith(params);
      expect(setShadowSpy).toHaveBeenCalledWith(params.shadow);
    });

    it('should correctly create record with belongsTo association and unconventional pk', async () => {
      expect.assertions(3);

      const params = {
        id: 1,
        name: 'bar',
        user: 1,
      };
      const mockResult = params;
      const mockRecordCreated = {
        ...mockResult,
        validate: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(mockResult),
        setUser: jest.fn(),
      };
      const buildSpy = jest.spyOn(Team, 'build').mockReturnValue(mockRecordCreated);
      const setUserSpy = jest.spyOn(mockRecordCreated, 'setUser');

      jest.mock('../../src/services/resource-getter', () => ({
        __esModule: true, // this property makes it work
        default: jest.fn().mockReturnValue({
          perform: jest.fn().mockReturnValue(mockResult),
        }),
      }));
      const findByIdSpy = jest.spyOn(Team.associations.user.target, 'findById').mockReturnValue({
        id: 1,
        name: 'foo',
        userId: 1,
      });

      // need to be declared here for resource getter to be modified
      // eslint-disable-next-line global-require
      const ResourceCreator = require('../../src/services/resource-creator');
      await new ResourceCreator(Team, params).perform();

      expect(buildSpy).toHaveBeenCalledWith(params);
      expect(findByIdSpy).toHaveBeenCalledWith(params.user, undefined);
      expect(setUserSpy).toHaveBeenCalledWith(params.user, { save: false });
    });
  });
});
