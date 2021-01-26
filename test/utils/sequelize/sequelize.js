/* eslint-disable jest/prefer-spy-on */

import hooks from './constants/hooks';
import staticMethods from './constants/staticMethods';
import { syncMethods, asyncMethods } from './constants/staticModelMethods';

const sequelize = {
  define: (modelName, modelDefn, metaData = {}) => {
    const model = function model() {};
    model.modelName = modelName;
    Object.defineProperty(model, 'name', {
      writable: true,
      value: modelName,
    });

    const attachHook = (name) => (hook) => {
      if (!model.prototype.hooks) {
        model.prototype.hooks = metaData.hooks || {};
      }
      model.prototype.hooks[name] = hook;
    };

    const attachProp = (key) => {
      model.prototype[key] = modelDefn[key];
    };

    const addStatic = (key) => {
      model[key] = jest.fn();
    };

    hooks.forEach((hook) => {
      model[hook] = attachHook(hook);
    });

    model.addHook = (hookType, name, hook) => {
      if (typeof name === 'function') {
        attachHook(hookType)(name);
      }
      attachHook(hookType)(hook);
    };

    model.hook = model.addHook;

    syncMethods.forEach(addStatic);
    asyncMethods.forEach(addStatic);

    model.isHierarchy = jest.fn();

    model.prototype.update = jest.fn();
    model.prototype.reload = jest.fn();
    model.prototype.set = jest.fn();
    Object.keys(modelDefn).forEach(attachProp);

    model.prototype.indexes = metaData.indexes;
    model.prototype.scopes = metaData.scopes;
    model.prototype.validate = metaData.validate;
    return model;
  },
};

staticMethods.forEach((method) => {
  sequelize[method] = jest.fn();
});

export default sequelize;
