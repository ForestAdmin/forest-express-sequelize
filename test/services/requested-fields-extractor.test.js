const extractRequestedFields = require('../../src/services/requested-fields-extractor');

describe('services > requested-fields-extractor', () => {
  it('should return null if fields is falsy', () => {
    expect.assertions(2);
    expect(extractRequestedFields(null, { name: 'user' })).toBeNull();
    expect(extractRequestedFields(undefined, { name: 'user' })).toBeNull();
  });

  it('should return null if the fields do not contain the given model\'s name', () => {
    expect.assertions(1);
    expect(extractRequestedFields({}, { name: 'user' })).toBeNull();
  });

  it('should include the first primary key', () => {
    expect.assertions(1);

    const fields = {
      user: 'name',
    };

    const model = {
      name: 'user',
      primaryKeys: { id: null, uid: null },
      associations: {},
      rawAttributes: {
        id: {},
        uid: {},
        name: {},
      },
    };

    const schemas = {
      user: {
        name: 'user',
        fields: [{
          field: 'name',
          isVirtual: false,
        }],
      },
    };

    const result = extractRequestedFields(fields, model, schemas);

    expect(result).toStrictEqual(['id', 'name']);
  });

  it('should include fields only once', () => {
    expect.assertions(1);

    const fields = {
      user: 'id,name,name',
    };

    const model = {
      name: 'user',
      primaryKeys: { id: null, uid: null },
      associations: {},
      rawAttributes: {
        id: {},
        uid: {},
        name: {},
      },
    };

    const schemas = {
      user: {
        name: 'user',
        fields: [{
          field: 'name',
          isVirtual: false,
        }],
      },
    };

    const result = extractRequestedFields(fields, model, schemas);

    expect(result).toStrictEqual(['id', 'name']);
  });

  it('should include field with same name as the model', () => {
    expect.assertions(1);

    const fields = {
      user: 'id,user',
    };

    const model = {
      name: 'user',
      primaryKeys: { id: null },
      associations: {},
      rawAttributes: {
        id: {},
        user: {},
      },
    };

    const schemas = {
      user: {
        name: 'user',
        fields: [{
          field: 'user',
          isVirtual: false,
        }],
      },
    };

    const result = extractRequestedFields(fields, model, schemas);

    expect(result).toStrictEqual(['id', 'user']);
  });

  it('should include all associations\' requested fields', () => {
    expect.assertions(1);

    const fields = {
      user: 'name',
      homeAddress: 'street',
    };

    const model = {
      name: 'user',
      primaryKeys: { id: null, uid: null },
      associations: {
        homeAddress: {
          name: 'homeAddress',
          target: {
            name: 'addresses',
          },
        },
      },
      rawAttributes: {
        id: {},
        uid: {},
        name: {},
      },
    };

    const schemas = {
      user: {
        name: 'user',
        fields: [{
          field: 'name',
          isVirtual: false,
        }],
      },
      addresses: {
        name: 'addresses',
        fields: [{
          field: 'street',
          isVirtual: false,
        }],
      },
    };

    const result = extractRequestedFields(fields, model, schemas);

    expect(result).toStrictEqual(['id', 'name', 'homeAddress.street']);
  });

  it('should remove associations from fields if there are explicit fields requested', () => {
    expect.assertions(1);

    const fields = {
      user: 'name,homeAddress,account',
      homeAddress: 'street',
    };

    const model = {
      name: 'user',
      primaryKeys: { id: null, uid: null },
      associations: {
        homeAddress: {
          name: 'homeAddress',
          target: {
            name: 'addresses',
          },
        },
      },
      rawAttributes: {
        id: {},
        uid: {},
        name: {},
        account: {},
      },
    };

    const schemas = {
      user: {
        name: 'user',
        fields: [{
          field: 'name',
          isVirtual: false,
        }],
      },
      addresses: {
        name: 'addresses',
        fields: [
          {
            field: 'street',
            isVirtual: false,
          },
        ],
      },
    };

    const result = extractRequestedFields(fields, model, schemas);

    expect(result).toStrictEqual([
      'id',
      'name',
      'account',
      'homeAddress.street',
    ]);
  });

  it('should include all fields from an association for which a smart field is requested', () => {
    expect.assertions(1);

    const fields = {
      user: 'name,homeAddress,account',
      homeAddress: 'street',
    };

    const model = {
      name: 'user',
      primaryKeys: { id: null, uid: null },
      associations: {
        homeAddress: {
          name: 'homeAddress',
          target: {
            name: 'addresses',
          },
        },
      },
      rawAttributes: {
        id: {},
        uid: {},
        name: {},
        account: {},
      },
    };

    const schemas = {
      user: {
        name: 'user',
        fields: [{
          field: 'name',
          isVirtual: false,
        }],
      },
      addresses: {
        name: 'addresses',
        fields: [
          {
            field: 'street',
            isVirtual: true,
          },
        ],
      },
    };

    const result = extractRequestedFields(fields, model, schemas);

    expect(result).toStrictEqual([
      'id',
      'name',
      'account',
      'homeAddress',
    ]);
  });

  it('should include requested smart field', () => {
    expect.assertions(1);

    const fields = {
      user: 'smartField',
    };

    const model = {
      name: 'user',
      primaryKeys: { id: null, uid: null },
      associations: {},
      rawAttributes: {
        id: {},
        uid: {},
      },
    };

    const schemas = {
      user: {
        name: 'user',
        fields: [{
          field: 'smartField',
          isVirtual: true,
        }, {
          field: 'anotherSmartField',
          isVirtual: true,
        }],
      },
    };

    const result = extractRequestedFields(fields, model, schemas);

    expect(result).toStrictEqual([
      'id',
      'smartField',
    ]);
  });
});
