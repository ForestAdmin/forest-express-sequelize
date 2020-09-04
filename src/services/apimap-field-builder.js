const _ = require('lodash');
const ApimapFieldTypeDetector = require('./apimap-field-type-detector');

function ApimapFieldBuilder(model, column, options) {
  const DataTypes = options.sequelize;

  function isRequired() {
    // eslint-disable-next-line
    return column._autoGenerated !== true && column.allowNull === false;
  }

  function getValidations(automaticValue) {
    const validations = [];

    // NOTICE: Do not inspect validation for autogenerated fields, it would
    //         block the record creation/update.
    // eslint-disable-next-line
    if (automaticValue || column._autoGenerated === true) {
      return validations;
    }

    if (column.allowNull === false) {
      validations.push({
        type: 'is present',
      });
    }

    if (!column.validate) { return validations; }

    if (column.validate.min) {
      validations.push({
        type: 'is greater than',
        value: column.validate.min.args || column.validate.min,
        message: column.validate.min.msg,
      });
    }

    if (column.validate.max) {
      validations.push({
        type: 'is less than',
        value: column.validate.max.args || column.validate.max,
        message: column.validate.max.msg,
      });
    }

    if (column.validate.isBefore) {
      validations.push({
        type: 'is before',
        value: column.validate.isBefore.args || column.validate.isBefore,
        message: column.validate.isBefore.msg,
      });
    }

    if (column.validate.isAfter) {
      validations.push({
        type: 'is after',
        value: column.validate.isAfter.args || column.validate.isAfter,
        message: column.validate.isAfter.msg,
      });
    }

    if (column.validate.len) {
      const length = column.validate.len.args || column.validate.len;

      if (_.isArray(length) && !_.isNull(length[0]) && !_.isUndefined(length[0])) {
        validations.push({
          type: 'is longer than',
          value: length[0],
          message: column.validate.len.msg,
        });

        if (length[1]) {
          validations.push({
            type: 'is shorter than',
            value: length[1],
            message: column.validate.len.msg,
          });
        }
      } else {
        validations.push({
          type: 'is longer than',
          value: length,
          message: column.validate.len.msg,
        });
      }
    }

    if (column.validate.contains) {
      validations.push({
        type: 'contains',
        value: column.validate.contains.args || column.validate.contains,
        message: column.validate.contains.msg,
      });
    }

    if (column.validate.is && !_.isArray(column.validate.is)) {
      const value = column.validate.is.args || column.validate.is;

      validations.push({
        type: 'is like',
        value: value.toString(),
        message: column.validate.is.msg,
      });
    }

    return validations;
  }


  // NOTICE: Remove Sequelize.Utils.Literal wrapper to display actual value in UI.
  //         Keep only simple values, and hide expressions.
  //         Do not export literal values to UI by default.
  function unwrapLiteral(literalValue, columnType) {
    let value;

    if (_.isString(literalValue)) {
      if (['true', 'false'].includes(literalValue.toLowerCase())) {
        value = Boolean(literalValue);
      } else if (!_.isNaN(_.toNumber(literalValue))) {
        if (columnType instanceof DataTypes.NUMBER) {
          value = _.toNumber(literalValue);
        } else {
          value = literalValue;
        }
        // NOTICE: Only single quotes are widely considered valid to delimitate string values.
      } else if (literalValue.match(/^'.*'$/)) {
        value = literalValue.substring(1, literalValue.length - 1);
      }
    } else if (_.isBoolean(literalValue) || _.isNumber(literalValue)) {
      value = literalValue;
    }

    return value;
  }

  this.perform = () => {
    const schema = {
      field: column.fieldName,
      type: new ApimapFieldTypeDetector(column, options).perform(),
      // NOTICE: Necessary only for fields with different field and database
      //         column names
      columnName: column.field,
    };

    if (column.primaryKey === true) {
      schema.isPrimaryKey = true;
    }

    if (schema.type === 'Enum') {
      schema.enums = column.values;
    }

    // NOTICE: Create enums from sub-type (for ['Enum'] type).
    if (Array.isArray(schema.type) && schema.type[0] === 'Enum') {
      schema.enums = column.type.type.values;
    }

    if (isRequired()) {
      schema.isRequired = true;
    }

    const canHaveDynamicDefaultValue = ['Date', 'Dateonly'].indexOf(schema.type) !== -1
      || column.type instanceof DataTypes.UUID;
    const isDefaultValueFunction = (typeof column.defaultValue) === 'function'
      || (canHaveDynamicDefaultValue && (typeof column.defaultValue) === 'object');

    if (!_.isNull(column.defaultValue) && !_.isUndefined(column.defaultValue)) {
      // NOTICE: Prevent sequelize.Sequelize.NOW to be defined as the default value as the client
      //         does not manage it properly so far.
      if (isDefaultValueFunction) {
        schema.isRequired = false;
      // NOTICE: Do not use the primary keys default values to prevent issues with UUID fields
      //         (defaultValue: DataTypes.UUIDV4).
      } else if (!_.includes(_.keys(model.primaryKeys), column.fieldName)) {
        // FIXME: `column.defaultValue instanceof Sequelize.Utils.Literal` fails for unknown reason.
        if (_.isObject(column.defaultValue) && (column.defaultValue.constructor.name === 'Literal')) {
          schema.defaultValue = unwrapLiteral(column.defaultValue.val, column.type);
        } else {
          schema.defaultValue = column.defaultValue;
        }
      }
    }

    schema.validations = getValidations(isDefaultValueFunction);

    if (schema.validations.length === 0) {
      delete schema.validations;
    }

    return schema;
  };
}

module.exports = ApimapFieldBuilder;
