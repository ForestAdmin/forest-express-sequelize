import { pick } from 'lodash';
import { logger } from 'forest-express';
import Operators from '../utils/operators';
import QueryUtils from '../utils/query';
import QueryOptions from './query-options';

const TO_ONE = ['BelongsTo', 'HasOne'];

/**
 * Empties a to-one related record that its own collection's scope hides, when the server flags
 * that scope as applying to related records. The root record is kept: a scope on accounts
 * restricts which accounts are seen, never which cards exist.
 *
 * Each related collection is checked with one query under its own scope, restricted to the
 * loaded records' primary keys, so values compare as they do when listing that collection.
 * A relation whose check fails is served empty rather than failing the request, which may
 * follow a write that is already saved.
 */
async function redactRelatedRecords(model, records, user, timezone) {
  const associations = Object.values(model.associations)
    .filter((association) => TO_ONE.includes(association.associationType));

  await Promise.all(associations.map(async ({ as, target }) => {
    const loaded = records.filter((record) => record?.[as]);
    if (!loaded.length) return;

    const primaryKeys = Object.keys(target.primaryKeys);
    const keyOf = (record) => JSON.stringify(primaryKeys.map((key) => record[key]));
    let visibleKeys;

    try {
      // Not flagged, or without a primary key to match the loaded records: served as stored.
      const scope = await QueryOptions.getRelatedScope(target, user, timezone);
      if (!scope) return;

      const operators = Operators.getInstance({ Sequelize: target.sequelize.constructor });
      // Built from the raw key values, so composite keys need no packing into strings.
      const idsWhere = primaryKeys.length === 1
        ? { [primaryKeys[0]]: [...new Set(loaded.map((record) => record[as][primaryKeys[0]]))] }
        : { [operators.OR]: loaded.map((record) => pick(record[as], primaryKeys)) };

      const visible = await target.unscoped().findAll({
        where: QueryUtils.mergeWhere(operators, idsWhere, scope.where),
        ...(scope.include && { include: scope.include }),
        attributes: primaryKeys,
      });
      visibleKeys = new Set(visible.map(keyOf));
    } catch (error) {
      logger.warn(
        `Related ${target.name} records served empty, their scope could not be checked: ${error.message}`,
      );
      visibleKeys = new Set();
    }

    loaded
      .filter((record) => !visibleKeys.has(keyOf(record[as])))
      .forEach((record) => {
        record[as] = null;
        if (record.dataValues) record.dataValues[as] = null;
      });
  }));

  return records;
}

module.exports = redactRelatedRecords;
