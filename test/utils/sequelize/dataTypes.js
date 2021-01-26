import Noop from './types/Noop';
import NumericType from './types/NumericType';
import StringType from './types/StringType';
import basicTypes from './constants/basicTypes';
import numericTypes from './constants/numericTypes';
import stringTypes from './constants/stringTypes';
import deferrables from './constants/deferrables';

const basicDataTypes = basicTypes.reduce((acc, elem) => {
  acc[elem] = Noop;
  return acc;
}, {});

const numericDataTypes = numericTypes.reduce((acc, elem) => {
  acc[elem] = NumericType;
  return acc;
}, basicDataTypes);

const dataTypes = stringTypes.reduce((acc, elem) => {
  acc[elem] = StringType;
  return acc;
}, numericDataTypes);

const Deferrable = deferrables.reduce((acc, elem) => {
  acc[elem] = elem;
  return acc;
}, {});

export default {
  ...dataTypes,
  Deferrable,
};
