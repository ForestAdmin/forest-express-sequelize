const forestExpressSequelize = require('../src/index');

describe('index', () => {
  describe('exported Interface', () => {
    it('should export a collection function', () => {
      expect.assertions(2);

      expect(forestExpressSequelize.collection).toBeDefined();
      expect(forestExpressSequelize.collection).toBeInstanceOf(Function);
    });

    it('should export an errorHandler middleware', () => {
      expect.assertions(2);

      expect(forestExpressSequelize.errorHandler).toBeDefined();
      expect(forestExpressSequelize.errorHandler).toBeInstanceOf(Function);
    });

    it('should export an ensureAuthenticated middleware', () => {
      expect.assertions(2);

      expect(forestExpressSequelize.ensureAuthenticated).toBeDefined();
      expect(forestExpressSequelize.ensureAuthenticated).toBeInstanceOf(Function);
    });

    it('should export a list of serializers and deserializers', () => {
      expect.assertions(6);

      expect(forestExpressSequelize.StatSerializer).toBeDefined();
      expect(forestExpressSequelize.StatSerializer).toBeInstanceOf(Function);

      expect(forestExpressSequelize.ResourceSerializer).toBeDefined();
      expect(forestExpressSequelize.ResourceSerializer).toBeInstanceOf(Function);

      expect(forestExpressSequelize.ResourceDeserializer).toBeDefined();
      expect(forestExpressSequelize.ResourceDeserializer).toBeInstanceOf(Function);
    });

    it('should export Schemas & ResourcesRoute objects', () => {
      expect.assertions(4);

      expect(forestExpressSequelize.Schemas).toBeDefined();
      expect(forestExpressSequelize.Schemas).toBeInstanceOf(Object);

      expect(forestExpressSequelize.ResourcesRoute).toBeDefined();
      expect(forestExpressSequelize.ResourcesRoute).toBeInstanceOf(Object);
    });

    it('should export a list of records functions', () => {
      expect.assertions(20);

      expect(forestExpressSequelize.PermissionMiddlewareCreator).toBeDefined();
      expect(forestExpressSequelize.PermissionMiddlewareCreator).toBeInstanceOf(Function);

      expect(forestExpressSequelize.RecordsCounter).toBeDefined();
      expect(forestExpressSequelize.RecordsCounter).toBeInstanceOf(Function);

      expect(forestExpressSequelize.RecordsExporter).toBeDefined();
      expect(forestExpressSequelize.RecordsExporter).toBeInstanceOf(Function);

      expect(forestExpressSequelize.RecordsGetter).toBeDefined();
      expect(forestExpressSequelize.RecordsGetter).toBeInstanceOf(Function);

      expect(forestExpressSequelize.RecordGetter).toBeDefined();
      expect(forestExpressSequelize.RecordGetter).toBeInstanceOf(Function);

      expect(forestExpressSequelize.RecordUpdater).toBeDefined();
      expect(forestExpressSequelize.RecordUpdater).toBeInstanceOf(Function);

      expect(forestExpressSequelize.RecordCreator).toBeDefined();
      expect(forestExpressSequelize.RecordCreator).toBeInstanceOf(Function);

      expect(forestExpressSequelize.RecordRemover).toBeDefined();
      expect(forestExpressSequelize.RecordRemover).toBeInstanceOf(Function);

      expect(forestExpressSequelize.RecordsRemover).toBeDefined();
      expect(forestExpressSequelize.RecordsRemover).toBeInstanceOf(Function);

      expect(forestExpressSequelize.RecordSerializer).toBeDefined();
      expect(forestExpressSequelize.RecordSerializer).toBeInstanceOf(Function);
    });

    it('should export the PUBLIC_ROUTES', () => {
      expect.assertions(2);
      expect(forestExpressSequelize.PUBLIC_ROUTES).toBeDefined();
      expect(forestExpressSequelize.PUBLIC_ROUTES).toBeInstanceOf(Array);
    });
  });
});
