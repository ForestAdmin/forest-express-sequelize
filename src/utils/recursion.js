import _ from 'lodash';

function mapKeysDeep(obj, cb) {
  if (Array.isArray(obj)) {
    return obj.map((child) => this.mapKeysDeep(child, cb));
  }
  if (_.isPlainObject(obj)) {
    const newObj = {};

    Object
      .getOwnPropertyNames(obj)
      .forEach((name) => { newObj[cb(name)] = this.mapKeysDeep(obj[name], cb); });

    Object
      .getOwnPropertySymbols(obj)
      .forEach((s) => { newObj[s] = this.mapKeysDeep(obj[s], cb); });

    return newObj;
  }

  return obj;
}

exports.mapKeysDeep = mapKeysDeep;
