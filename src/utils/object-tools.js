import _ from 'lodash';

/** Do object1 and object2 have at least one common key or Symbol? */
exports.objectShareKeys = (object1, object2) => {
  const keys1 = [...Object.getOwnPropertyNames(object1), ...Object.getOwnPropertySymbols(object1)];
  const keys2 = [...Object.getOwnPropertyNames(object2), ...Object.getOwnPropertySymbols(object2)];
  const common = keys1.filter((key) => keys2.includes(key));

  return common.length > 0;
};

/**
 * Clone object recursively while rewriting keys with the callback function.
 * Symbols are copied without modification (Sequelize.Ops are javascript symbols).
 *
 * @example
 * mapKeysDeep({a: {b: 1}}, key => `_${key}_`);
 * => {_a_: {_b_: 1}}
 */
exports.mapKeysDeep = (object, callback) => {
  if (Array.isArray(object)) {
    return object.map((child) => exports.mapKeysDeep(child, callback));
  }

  if (_.isPlainObject(object)) {
    const newObject = {};

    Object.getOwnPropertyNames(object).forEach((name) => {
      newObject[callback(name)] = exports.mapKeysDeep(object[name], callback);
    });

    Object.getOwnPropertySymbols(object).forEach((symbol) => {
      newObject[symbol] = exports.mapKeysDeep(object[symbol], callback);
    });

    return newObject;
  }

  return object;
};
