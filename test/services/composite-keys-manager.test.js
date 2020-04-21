import Sequelize, { Op } from 'sequelize';
import CompositeKeyManager from '../../src/services/composite-keys-manager';

describe('services > composite-keys-manager', () => {
  describe('getPrimaryKeyValues', () => {
    const compositeKeyManager = new CompositeKeyManager();
    it('should return one value for non composite key', () => {
      expect.assertions(1);
      const primaryKeyValues = compositeKeyManager.getPrimaryKeyValues('1');
      expect(primaryKeyValues).toStrictEqual(['1']);
    });
    it('should return two values for composite key string with two values', () => {
      expect.assertions(1);
      const primaryKeyValues = compositeKeyManager.getPrimaryKeyValues('1|2');
      expect(primaryKeyValues).toStrictEqual(['1', '2']);
    });
    it('should return null if `null` string is present', () => {
      expect.assertions(1);
      const primaryKeyValues = compositeKeyManager.getPrimaryKeyValues('1|null');
      expect(primaryKeyValues).toStrictEqual(['1', null]);
    });
  });

  describe('getRecordConditions', () => {
    it('should return a where condition with one key for non composite key', () => {
      expect.assertions(1);
      const model = { primaryKeys: { id: {} } };
      const compositeKeyManager = new CompositeKeyManager(model);
      const conditions = compositeKeyManager.getRecordConditions('1');
      expect(conditions).toStrictEqual({ id: '1' });
    });
    it('should return a where condition with two keys for composite key', () => {
      expect.assertions(1);
      const model = { primaryKeys: { actorId: {}, filmId: {} } };
      const compositeKeyManager = new CompositeKeyManager(model);
      const conditions = compositeKeyManager.getRecordConditions('1|2');
      expect(conditions).toStrictEqual({ actorId: '1', filmId: '2' });
    });
  });

  describe('getRecordsConditions', () => {
    const sequelizeOptions = { sequelize: Sequelize };
    it('should return a where condition with one key for non composite key', () => {
      expect.assertions(1);
      const model = { primaryKeys: { actorId: {} } };
      const compositeKeyManager = new CompositeKeyManager(model);
      const conditions = compositeKeyManager.getRecordsConditions(['1', '2'], sequelizeOptions);
      expect(conditions).toStrictEqual({ [Op.or]: [{ actorId: '1' }, { actorId: '2' }] });
    });
    it('should return a where condition with two keys for composite key', () => {
      expect.assertions(1);
      const model = { primaryKeys: { actorId: {}, filmId: {} } };
      const compositeKeyManager = new CompositeKeyManager(model);
      const conditions = compositeKeyManager.getRecordsConditions(['1|2', '3|4'], sequelizeOptions);
      expect(conditions).toStrictEqual({ [Op.or]: [{ actorId: '1', filmId: '2' }, { actorId: '3', filmId: '4' }] });
    });
  });

  describe('createCompositePrimary', () => {
    it('should create a simple key for non composite record', () => {
      expect.assertions(1);
      const model = { primaryKeys: { actorId: {} } };
      const record = { actorId: '1' };
      const compositeKeyManager = new CompositeKeyManager(model, null, record);
      const compositePrimary = compositeKeyManager.createCompositePrimary();
      expect(compositePrimary).toStrictEqual('1');
    });

    it('should create a composite key for composite record', () => {
      expect.assertions(1);
      const model = { primaryKeys: { actorId: {}, filmId: {} } };
      const record = { actorId: '1', filmId: '2' };
      const compositeKeyManager = new CompositeKeyManager(model, null, record);
      const compositePrimary = compositeKeyManager.createCompositePrimary();
      expect(compositePrimary).toStrictEqual('1|2');
    });
  });
});
