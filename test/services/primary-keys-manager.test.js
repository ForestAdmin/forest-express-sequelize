import Sequelize, { Op } from 'sequelize';
import PrimaryKeyManager from '../../src/services/primary-keys-manager';

describe('services > primary-keys-manager', () => {
  const modelBase = {
    sequelize: { constructor: Sequelize },
  };

  describe('getPrimaryKeyValues', () => {
    it('should throw if the number of primary keys does not match the provided packed key', () => {
      expect.assertions(1);
      const model = { ...modelBase, primaryKeys: { id: {} } };
      const keyManager = new PrimaryKeyManager(model);
      expect(() => keyManager._getPrimaryKeyValues('1|1')).toThrow('Invalid packed primary key');
    });

    it('should return one value for non composite key', () => {
      expect.assertions(1);
      const model = { ...modelBase, primaryKeys: { id: {} } };
      const keyManager = new PrimaryKeyManager(model);
      const primaryKeyValues = keyManager._getPrimaryKeyValues('1');
      expect(primaryKeyValues).toStrictEqual(['1']);
    });
    it('should return two values for composite key string with two values', () => {
      expect.assertions(1);
      const model = { ...modelBase, primaryKeys: { userId: {}, bookId: {} } };
      const keyManager = new PrimaryKeyManager(model);
      const primaryKeyValues = keyManager._getPrimaryKeyValues('1|2');
      expect(primaryKeyValues).toStrictEqual(['1', '2']);
    });
    it('should return null if `null` string is present', () => {
      expect.assertions(1);
      const model = { ...modelBase, primaryKeys: { userId: {}, bookId: {} } };
      const keyManager = new PrimaryKeyManager(model);
      const primaryKeyValues = keyManager._getPrimaryKeyValues('1|null');
      expect(primaryKeyValues).toStrictEqual(['1', null]);
    });
  });

  describe('getRecordsConditions', () => {
    it('should throw if there is no primary key on the model', () => {
      expect.assertions(1);
      const model = { ...modelBase, primaryKeys: { } };
      const keyManager = new PrimaryKeyManager(model);
      expect(() => keyManager.getRecordsConditions(['1'])).toThrow('No primary key was found');
    });
    it('should return a condition that will not match for empty array', () => {
      expect.assertions(1);
      const model = { ...modelBase, primaryKeys: { id: {} } };
      const keyManager = new PrimaryKeyManager(model);
      const conditions = keyManager.getRecordsConditions([]);
      expect(conditions.val).toStrictEqual('(0=1)');
    });
    it('should return a where condition with one key for non composite key', () => {
      expect.assertions(1);
      const model = { ...modelBase, primaryKeys: { id: {} } };
      const keyManager = new PrimaryKeyManager(model);
      const conditions = keyManager.getRecordsConditions(['1']);
      expect(conditions).toStrictEqual({ id: '1' });
    });
    it('should return a where condition with two keys for composite key', () => {
      expect.assertions(1);
      const model = { ...modelBase, primaryKeys: { actorId: {}, filmId: {} } };
      const keyManager = new PrimaryKeyManager(model);
      const conditions = keyManager.getRecordsConditions(['1|2']);
      expect(conditions).toStrictEqual({ actorId: '1', filmId: '2' });
    });
    it('should return a where condition with one key for non composite key (2)', () => {
      expect.assertions(1);
      const model = { ...modelBase, primaryKeys: { actorId: {} } };
      const keyManager = new PrimaryKeyManager(model);
      const conditions = keyManager.getRecordsConditions(['1', '2']);
      expect(conditions).toStrictEqual({ actorId: ['1', '2'] });
    });
    it('should return a where condition with two keys for composite key (2)', () => {
      expect.assertions(1);
      const model = { ...modelBase, primaryKeys: { actorId: {}, filmId: {} } };
      const keyManager = new PrimaryKeyManager(model);
      const conditions = keyManager.getRecordsConditions(['1|2', '3|4']);
      expect(conditions).toStrictEqual({ [Op.or]: [{ actorId: '1', filmId: '2' }, { actorId: '3', filmId: '4' }] });
    });
  });

  describe('annotateRecords', () => {
    it('should create a simple key for non composite record', () => {
      expect.assertions(1);
      const model = { ...modelBase, primaryKeys: { actorId: {} } };
      const record = { actorId: '1' };
      const keyManager = new PrimaryKeyManager(model);
      keyManager.annotateRecords([record]);
      expect(record.forestCompositePrimary).toBeUndefined();
    });

    it('should create a composite key for composite record', () => {
      expect.assertions(1);
      const model = { ...modelBase, primaryKeys: { actorId: {}, filmId: {} } };
      const record = { actorId: '1', filmId: '2' };
      const keyManager = new PrimaryKeyManager(model, null, record);
      keyManager.annotateRecords([record]);
      expect(record.forestCompositePrimary).toStrictEqual('1|2');
    });
  });
});
