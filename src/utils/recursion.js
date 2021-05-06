import _ from 'lodash';

function mapKeysDeep(object, callback) {
  if (Array.isArray(object)) {
    return object.map((child) => this.mapKeysDeep(child, callback));
  }

  if (_.isPlainObject(object)) {
    const newObject = {};

    Object
      .getOwnPropertyNames(object)
      .forEach((name) => {
        newObject[callback(name)] = this.mapKeysDeep(object[name], callback);
      });

    Object
      .getOwnPropertySymbols(object)
      .forEach((symbol) => {
        newObject[symbol] = this.mapKeysDeep(object[symbol], callback);
      });

    return newObject;
  }

  return object;
}

exports.mapKeysDeep = mapKeysDeep;
