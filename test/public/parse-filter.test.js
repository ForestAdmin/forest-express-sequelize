const makeParseFilter = require('../../src/public/parse-filter');

describe('parseFilter', () => {
  function setup() {
    const perform = jest.fn();

    const FakeFiltersParser = jest.fn(function FakeClass() {
      this.perform = perform;
    });

    return { FakeFiltersParser, perform };
  }

  it('should create the parser and call perform', async () => {
    expect.assertions(3);

    const { FakeFiltersParser, perform } = setup();

    const opts = { Sequelize: 'fake' };
    const parseFilter = makeParseFilter(FakeFiltersParser, { opts });
    perform.mockResolvedValue('parsed-filter');

    const filter = { operator: 'equal', value: 'hello', field: 'label' };
    const modelSchema = { label: {} };
    const timezone = 'Europe/Paris';
    const result = await parseFilter(filter, modelSchema, timezone);

    expect(result).toBe('parsed-filter');
    expect(FakeFiltersParser).toHaveBeenCalledWith(modelSchema, timezone, opts);
    expect(perform).toHaveBeenCalledWith(JSON.stringify(filter));
  });

  it('should throw an error when the liana is not initialized', () => {
    expect.assertions(1);

    const { FakeFiltersParser } = setup();

    const parseFilter = makeParseFilter(FakeFiltersParser, {});

    expect(() => parseFilter({}, {}, 'Europe/Paris'))
      .toThrow('Liana must be initialized before using parseFilter');
  });
});
