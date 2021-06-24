import ObjectTools from './object-tools';
import Operators from './operators';
import { isVersionLessThan } from './orm';
import QueryUtils from './query';

/**
 * Extract all where conditions along the include tree, and bubbles them up to the top in-place.
 * This allows to work around a sequelize quirk that cause nested 'where' to fail when they
 * refer to relation fields from an intermediary include (ie '$book.id$').
 *
 * This happens when forest admin filters on relations are used.
 *
 * @see https://sequelize.org/master/manual/eager-loading.html#complex-where-clauses-at-the-top-level
 * @see https://github.com/ForestAdmin/forest-express-sequelize/blob/7d7ad0/src/services/filters-parser.js#L104
 */
function bubbleWheresInPlace(operators, options) {
  const parentIncludeList = options.include ?? [];

  parentIncludeList.forEach((include) => {
    bubbleWheresInPlace(operators, include);

    if (include.where) {
      const newWhere = ObjectTools.mapKeysDeep(include.where, (key) => (
        key[0] === '$' && key[key.length - 1] === '$'
          ? `$${include.as}.${key.substring(1)}`
          : `$${include.as}.${key}$`
      ));

      options.where = QueryUtils.mergeWhere(operators, options.where, newWhere);
      delete include.where;
    }
  });
}

/**
 * Includes can be expressed in different ways in sequelize, which is inconvenient to
 * remove duplicate associations.
 * This convert all valid ways to perform eager loading into [{model: X, as: 'x'}].
 *
 * This is necessary as we have no control over which way customer use when writing SmartFields
 * search handlers.
 *
 * Among those:
 * - { include: [Book] }
 * - { include: [{ association: 'book' }] }
 * - { include: ['book'] }
 * - { include: [[{ as: 'book' }]] }
 * - { include: [[{ model: Book }]] }
 */
function normalizeInclude(model, include) {
  if (include.sequelize) {
    return {
      model: include,
      as: Object
        .keys(model.associations)
        .find((association) => model.associations[association].target.name === include.name),
    };
  }

  if (typeof include === 'string' && model.associations[include]) {
    return { as: include, model: model.associations[include].target };
  }

  if (typeof include === 'object') {
    if (typeof include.association === 'string' && model.associations[include.association]) {
      include.as = include.association;
      delete include.association;
    }

    if (typeof include.as === 'string' && !include.model && model.associations[include.as]) {
      const includeModel = model.associations[include.as].target;
      include.model = includeModel;
    }

    if (include.model && !include.as) {
      include.as = Object
        .keys(model.associations)
        .find((association) => model.associations[association].target.name === include.model.name);
    }
  }

  // Recurse
  if (include.include) {
    include.include = include.include.map(
      (childInclude) => normalizeInclude(include.model, childInclude),
    );
  }

  return include;
}

/**
 * Remove duplications in a queryOption.include array in-place.
 * Using multiple times the same association yields invalid SQL when using sequelize <= 4.x
 */
function removeDuplicateAssociations(model, includeList) {
  // Remove duplicates
  includeList.sort((include1, include2) => (include1.as < include2.as ? -1 : 1));
  for (let i = 1; i < includeList.length; i += 1) {
    if (includeList[i - 1].as === includeList[i].as) {
      const newInclude = { ...includeList[i - 1], ...includeList[i] };

      if (includeList[i - 1].attributes && includeList[i].attributes) {
        // Keep 'attributes' only when defined on both sides.
        newInclude.attributes = [...new Set([
          ...includeList[i - 1].attributes,
          ...includeList[i].attributes,
        ])];
      } else {
        delete newInclude.attributes;
      }

      if (includeList[i - 1].include || includeList[i].include) {
        newInclude.include = [
          ...(includeList[i - 1].include ?? []),
          ...(includeList[i].include ?? []),
        ];
      }

      includeList[i - 1] = newInclude;
      includeList.splice(i, 1);
      i -= 1;
    }
  }

  // Recurse
  includeList.forEach((include) => {
    if (include.include) {
      const association = model.associations[include.as];
      removeDuplicateAssociations(association.target, include.include);
    }
  });
}

exports.postProcess = (model, rawOptions) => {
  if (!rawOptions.include) return rawOptions;

  const options = rawOptions;
  const operators = Operators.getInstance({ Sequelize: model.sequelize.constructor });

  if (isVersionLessThan(model.sequelize.constructor, '5.0.0')) {
    options.include = options.include.map((include) => normalizeInclude(model, include));
    bubbleWheresInPlace(operators, options);
    removeDuplicateAssociations(model, options.include);
  } else {
    bubbleWheresInPlace(operators, options);
  }

  return options;
};
