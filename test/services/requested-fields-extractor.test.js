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
    };

    const result = extractRequestedFields(fields, model);

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
    };

    const result = extractRequestedFields(fields, model);

    expect(result).toStrictEqual(['id', 'name']);
  });

  it('should include all associations\' requested fields', () => {
    expect.assertions(1);

    const fields = {
      user: 'name',
      address: 'street',
    };

    const model = {
      name: 'user',
      primaryKeys: { id: null, uid: null },
      associations: {
        address: {
          name: 'address',
        },
      },
    };

    const result = extractRequestedFields(fields, model);

    expect(result).toStrictEqual(['id', 'name', 'address.street']);
  });

  it('should remove associations from fields if there are explicit fields requested', () => {
    expect.assertions(1);

    const fields = {
      user: 'name,address,account',
      address: 'street',
    };

    const model = {
      name: 'user',
      primaryKeys: { id: null, uid: null },
      associations: {
        address: {
          name: 'address',
        },
      },
    };

    const result = extractRequestedFields(fields, model);

    expect(result).toStrictEqual([
      'id',
      'name',
      'account',
      'address.street',
    ]);
  });
});
