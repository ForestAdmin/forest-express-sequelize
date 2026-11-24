import { scopeManager } from 'forest-express';
import QueryOptions from './query-options';

const TO_ONE = ['BelongsTo', 'HasOne'];

/**
 * Empties a to-one related record that its own collection's scope hides, when the server flags
 * that scope as applying to related records. The root record is kept: a scope on accounts
 * restricts which accounts are seen, never which cards exist.
 *
 * Each related collection is checked with one query under its own scope, restricted to the
 * loaded records' primary keys, so values compare as they do when listing that collection.
 */
async function redactRelatedRecords(model, records, user, timezone) {
  const associations = Object.values(model.associations)
    .filter((association) => TO_ONE.includes(association.associationType));

  await Promise.all(associations.map(async ({ as, target }) => {
    const loaded = records.filter((record) => record?.[as]);
    // A forest-express release without the lookup reads as not flagged.
    if (!loaded.length || !await scopeManager.scopeAppliesToRelatedRecords?.(user, target.name)) {
      return;
    }

    const primaryKeys = Object.keys(target.primaryKeys);
    // Without a primary key the loaded records cannot be matched: they are served as before.
    if (!primaryKeys.length) return;

    const keyOf = (record) => primaryKeys.map((key) => String(record[key])).join('|');
    const ids = [...new Set(loaded.map((record) => (
      primaryKeys.length === 1 ? record[as][primaryKeys[0]] : keyOf(record[as])
    )))];

    const queryOptions = new QueryOptions(target);
    await queryOptions.filterByIds(ids);
    await queryOptions.filterByConditionTree(
      await scopeManager.getScopeForUser(user, target.name, true),
      timezone,
    );
    const visible = await target.unscoped()
      .findAll({ ...queryOptions.sequelizeOptions, attributes: primaryKeys });
    const visibleKeys = new Set(visible.map(keyOf));

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
