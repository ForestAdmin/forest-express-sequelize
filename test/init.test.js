jest.mock('forest-express', () => ({
  init: jest.fn(),
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));
const forestExpressMock = require('forest-express');

jest.mock('../package.json');
const packageJsonMock = require('../package.json');

const forestExpressSequelize = require('../src');

describe('forest-express-sequelize > init', () => {
  const mockPackageJsonVersion = (version) => {
    packageJsonMock.version = version;
  };

  const createForestExpressInitSpy = (implementation) => {
    jest.resetAllMocks();
    const spy = jest.spyOn(forestExpressMock, 'init');
    spy.mockImplementation(implementation);
  };

  const initForestExpressSequelize = (options) =>
    forestExpressSequelize.init({
      objectMapping: {},
      connections: {},
      ...options,
    });

  describe('when the given configuration is correct', () => {
    it('should call forest-express init function', () => {
      expect.assertions(2);

      jest.resetAllMocks();
      initForestExpressSequelize();

      expect(forestExpressMock.init).toHaveBeenCalledTimes(1);
      expect(forestExpressMock.init).toHaveBeenCalledWith(expect.any(Object));
    });

    describe('when forest-express init is called with exports', () => {
      it('should contains an instance of objectMapping and connections options', () => {
        expect.assertions(2);

        createForestExpressInitSpy(({ opts }) => {
          expect(opts).toHaveProperty('Sequelize');
          expect(opts).toHaveProperty('connections');
        });

        initForestExpressSequelize();
      });

      describe('should contains a function getLianaName', () => {
        it('should return "forest-express-sequelize"', () => {
          expect.assertions(2);

          createForestExpressInitSpy((exports) => {
            expect(exports.getLianaName).toStrictEqual(expect.any(Function));
            expect(exports.getLianaName()).toStrictEqual('forest-express-sequelize');
          });

          initForestExpressSequelize();
        });
      });

      describe('should contains a function getLianaVersion', () => {
        it('should return null if bad version is provided', () => {
          expect.assertions(2);

          mockPackageJsonVersion('a bad version');

          createForestExpressInitSpy((exports) => {
            expect(exports.getLianaVersion).toStrictEqual(expect.any(Function));
            expect(exports.getLianaVersion()).toBeNull();
          });

          initForestExpressSequelize();
        });

        it('should return the liana version', () => {
          expect.assertions(2);

          const LIANA_VERSION = '1.0.0';

          mockPackageJsonVersion(LIANA_VERSION);

          createForestExpressInitSpy((exports) => {
            expect(exports.getLianaVersion).toStrictEqual(expect.any(Function));
            expect(exports.getLianaVersion()).toStrictEqual(LIANA_VERSION);
          });

          initForestExpressSequelize();
        });
      });

      describe('should contains a function getOrmVersion', () => {
        it('should return objectMapping version', () => {
          expect.assertions(2);

          const OMV = '1.0.0';

          createForestExpressInitSpy((exports) => {
            expect(exports.getOrmVersion).toStrictEqual(expect.any(Function));
            expect(exports.getOrmVersion()).toStrictEqual(OMV);
          });

          initForestExpressSequelize({ objectMapping: { version: OMV } });
        });
      });

      describe('should contains a function getDatabaseType', () => {
        it('should return the database type for a single database', () => {
          expect.assertions(2);

          const DBS_NAME = 'a-sgbd';
          createForestExpressInitSpy((exports) => {
            expect(exports.getDatabaseType).toStrictEqual(expect.any(Function));
            expect(exports.getDatabaseType()).toStrictEqual(DBS_NAME);
          });

          initForestExpressSequelize({
            objectMapping: {},
            connections: { database1: { options: { dialect: DBS_NAME } } },
          });
        });

        it('should return "multiple" type for a multiple databases setup', () => {
          expect.assertions(2);

          const SGBG_NAME = 'a-sgbd';
          createForestExpressInitSpy((exports) => {
            expect(exports.getDatabaseType).toStrictEqual(expect.any(Function));
            expect(exports.getDatabaseType()).toStrictEqual('multiple');
          });

          initForestExpressSequelize({
            objectMapping: {},
            connections: {
              database1: { options: { dialect: SGBG_NAME } },
              database2: { options: { dialect: SGBG_NAME } },
            },
          });
        });
      });

      describe('should contains a function getModelName', () => {
        it('should return a name of a model', () => {
          expect.assertions(2);

          const MODEL_NAME = 'aModelName';

          createForestExpressInitSpy((exports) => {
            expect(exports.getModelName).toStrictEqual(expect.any(Function));
            expect(exports.getModelName({ name: MODEL_NAME })).toStrictEqual(MODEL_NAME);
          });

          initForestExpressSequelize();
        });
      });

      describe('when providing a correct connections option', () => {
        it('should pass a useMultipleDatabases option set to false when a single connection is provided', () => {
          expect.assertions(1);

          createForestExpressInitSpy(({ opts }) => {
            expect(opts.useMultipleDatabases).toStrictEqual(false);
          });

          initForestExpressSequelize({ connections: { database1: { models: {} } } });
        });

        it('should pass a useMultipleDatabases option set to true when multiples connections are provided', () => {
          expect.assertions(1);

          createForestExpressInitSpy(({ opts }) => {
            expect(opts.useMultipleDatabases).toStrictEqual(true);
          });

          initForestExpressSequelize({
            connections: {
              database1: {},
              database2: {},
            },
          });
        });
      });

      it('should contain a list of integrations', () => {
        expect.assertions(11);

        createForestExpressInitSpy(({
          Stripe,
          Closeio,
          Intercom,
          Mixpanel,
          Layer,
        }) => {
          expect(Stripe).toBeInstanceOf(Object);
          expect(Stripe.getCustomer).toBeInstanceOf(Function);
          expect(Stripe.getCustomerByUserField).toBeInstanceOf(Function);

          expect(Intercom).toBeInstanceOf(Object);
          expect(Intercom.getCustomer).toBeInstanceOf(Function);

          expect(Closeio).toBeInstanceOf(Object);
          expect(Closeio.getCustomer).toBeInstanceOf(Function);

          expect(Mixpanel).toBeInstanceOf(Object);
          expect(Mixpanel.getUser).toBeInstanceOf(Function);

          expect(Layer).toBeInstanceOf(Object);
          expect(Layer.getUser).toBeInstanceOf(Function);
        });

        initForestExpressSequelize();
      });
    });
  });

  describe('when the given configuration is incorrect', () => {
    describe('when objectMapping option is missing', () => {
      it('should log an error', async () => {
        expect.assertions(1);
        jest.resetAllMocks();

        const spy = jest.spyOn(forestExpressMock.logger, 'error');
        initForestExpressSequelize({ objectMapping: null });
        expect(spy).toHaveBeenCalledWith('The objectMapping option appears to be missing. Please make sure it is set correctly.');
      });

      it('should not throw an error', () => {
        expect.assertions(1);

        expect(() => initForestExpressSequelize({ objectMapping: null })).not.toThrow();
      });

      it('should return a promised function', async () => {
        expect.assertions(2);

        const result = initForestExpressSequelize({ objectMapping: null });
        expect(result).toBeInstanceOf(Promise);
        expect(await result).toBeInstanceOf(Function);
      });
    });

    describe('when sequelize option is provided', () => {
      it('should log a warning', async () => {
        expect.assertions(1);
        jest.resetAllMocks();

        const spy = jest.spyOn(forestExpressMock.logger, 'warn');
        initForestExpressSequelize({ sequelize: {} });
        expect(spy).toHaveBeenCalledWith('The sequelize option is not supported anymore. Please remove this option.');
      });
    });
  });
});
