import Sequelize from 'sequelize';
import Interface, { scopeManager } from 'forest-express';
import LineStatGetter from '../../src/services/line-stat-getter';

describe('services > line-stat-getter > chart inputs', () => {
  const user = { renderingId: 1 };
  const dialects = ['postgres', 'mysql', 'mariadb', 'mssql', 'sqlite'];
  const aggregators = ['Count', 'Sum', 'Avg', 'Min', 'Max'];
  const defaultFields = [
    { field: 'id', type: 'Number' },
    { field: 'createdAt', type: 'Date' },
  ];

  const setup = (dialect, fields = defaultFields) => {
    jest.restoreAllMocks();
    const dialectModule = ['sqlite', 'mariadb'].includes(dialect) ? {} : undefined;
    const sequelize = new Sequelize({ dialect, dialectModule });
    const model = sequelize.define('user', {
      id: { type: Sequelize.INTEGER, primaryKey: true },
      createdAt: { type: Sequelize.DATE },
    });

    Interface.Schemas = {
      schemas: {
        user: {
          name: 'user',
          idField: 'id',
          primaryKeys: ['id'],
          fields,
        },
      },
    };

    const findAll = jest.spyOn(model, 'findAll').mockResolvedValue([]);
    jest.spyOn(scopeManager, 'getScopeForUser').mockResolvedValue(null);

    const buildSql = () => {
      const [[findAllOptions]] = findAll.mock.calls;
      return sequelize.getQueryInterface().queryGenerator
        .selectQuery(model.getTableName(), findAllOptions, model);
    };

    return { model, findAll, buildSql };
  };

  const lineParams = (extra) => ({
    type: 'Line',
    sourceCollectionName: 'user',
    groupByFieldName: 'createdAt',
    aggregator: 'Count',
    timeRange: 'Day',
    timezone: 'Europe/Paris',
    filter: null,
    ...extra,
  });

  const deeplyNested = () => JSON.parse(`${'{"x":'.repeat(10000)}0${'}'.repeat(10000)}`);

  const perform = ({ model, params }) =>
    new LineStatGetter(model, params, { Sequelize }, user).perform();

  describe('when the group by field is not a column of the collection', () => {
    [
      ['an unknown field name', 'unknownField', '"unknownField"'],
      ['a name with quotes and parentheses', 'createdAt", (SELECT secret FROM users) --',
        '"createdAt\\", (SELECT secret FROM users) --"'],
      ['a field of another collection', 'other:createdAt', '"other:createdAt"'],
      ['an empty name', '', '""'],
      ['a missing name', undefined, 'undefined'],
      ['a non-string name', ['createdAt'], 'object'],
      ['an object without toString', { toString: null }, 'object'],
      ['a deeply nested object', deeplyNested(), 'object'],
    ].forEach(([description, groupByFieldName, describedName]) => {
      ['postgres', 'mysql', 'mssql'].forEach((dialect) => {
        it(`refuses ${description} on ${dialect} without querying the database`, async () => {
          expect.assertions(2);
          const { model, findAll } = setup(dialect);

          await expect(perform({
            model,
            params: lineParams({ groupByFieldName, timeRange: 'Week' }),
          })).rejects.toMatchObject({
            message: `Invalid group by field ${describedName}`,
            status: 400,
          });

          expect(findAll).not.toHaveBeenCalled();
        });
      });
    });
  });

  describe('when the group by field is not a real column', () => {
    [
      ['a smart field', 'displayName', [
        ...defaultFields,
        { field: 'displayName', type: 'String', isVirtual: true },
      ]],
      ['a relationship field', 'car', [
        ...defaultFields,
        { field: 'car', type: 'Number', reference: 'cars._id' },
      ]],
      ['a "collection:field" name', 'car:id', [
        ...defaultFields,
        { field: 'car', type: 'Number', reference: 'cars._id' },
      ]],
      ['a declared field whose name contains ":"', 'created:at', [
        ...defaultFields,
        { field: 'created:at', type: 'Date' },
      ]],
    ].forEach(([description, groupByFieldName, fields]) => {
      it(`refuses ${description} without querying the database`, async () => {
        expect.assertions(2);
        const { model, findAll } = setup('postgres', fields);

        await expect(perform({ model, params: lineParams({ groupByFieldName }) }))
          .rejects.toMatchObject({
            message: `Invalid group by field "${groupByFieldName}"`,
            status: 400,
          });

        expect(findAll).not.toHaveBeenCalled();
      });
    });
  });

  describe('when the aggregator is not allowed', () => {
    [
      ['an expression instead of a function name', 'count("user"."id")), (SELECT secret FROM users) --'],
      ['an unknown aggregator', 'Counts'],
      ['an aggregator with trailing spaces', 'count '],
      ['a missing aggregator', undefined],
      ['a non-string aggregator', { name: 'count' }],
      ['an object without toString', { toString: null }],
      ['an array of objects without toString', [{ toString: null }]],
      ['a deeply nested object', deeplyNested()],
    ].forEach(([description, aggregator]) => {
      it(`refuses ${description} without querying the database`, async () => {
        expect.assertions(2);
        const { model, findAll } = setup('postgres');

        await expect(perform({ model, params: lineParams({ aggregator }) }))
          .rejects.toMatchObject({ status: 400 });

        expect(findAll).not.toHaveBeenCalled();
      });
    });

    it('answers a 400 BadRequestError with a neutral message', async () => {
      expect.assertions(1);
      const { model } = setup('postgres');

      await expect(perform({ model, params: lineParams({ aggregator: 'Median' }) }))
        .rejects.toMatchObject({
          name: 'BadRequestError',
          message: 'Invalid aggregator "Median"',
        });
    });
  });

  describe('when the chart is valid', () => {
    aggregators.forEach((aggregator) => {
      dialects.forEach((dialect) => {
        it(`builds the ${aggregator} chart on ${dialect} as before`, async () => {
          expect.assertions(2);
          const { model, findAll, buildSql } = setup(dialect);

          await perform({ model, params: lineParams({ aggregator }) });

          expect(findAll).toHaveBeenCalledTimes(1);
          expect(buildSql()).toContain(`${aggregator.toLowerCase()}(`);
        });
      });
    });

    [
      ['postgres', 'Day', 'to_char(date_trunc(\'Day\', timezone(\'Europe/Paris\', '
        + '"user"."createdAt")), \'YYYY-MM-DD 00:00:00\') AS "date"'],
      ['postgres', 'Week', 'to_char(date_trunc(\'Week\', timezone(\'Europe/Paris\', '
        + '"user"."createdAt")), \'YYYY-MM-DD 00:00:00\') AS "date"'],
      ['mysql', 'Day', 'DATE_FORMAT(`user`.`createdAt`, \'%Y-%m-%d 00:00:00\') AS `date`'],
      ['mysql', 'Week', 'DATE_FORMAT(DATE_SUB(`user`.`createdAt`, INTERVAL '
        + '((7 + WEEKDAY(`user`.`createdAt`)) % 7) DAY), \'%Y-%m-%d 00:00:00\') AS `date`'],
      ['mssql', 'Day', 'FORMAT([user].[createdAt], N\'yyyy-MM-dd 00:00:00\') AS [date]'],
      ['mssql', 'Week', 'FORMAT(DATEADD(DAY, -DATEPART(dw,[user].[createdAt]),'
        + '[user].[createdAt]), \'yyyy-MM-dd 00:00:00\') AS [date]'],
      ['sqlite', 'Day', 'STRFTIME(\'%Y-%m-%d\', `user`.`createdAt`) AS `date`'],
      ['sqlite', 'Week', 'STRFTIME(\'%Y-%W\', `user`.`createdAt`) AS `date`'],
    ].forEach(([dialect, timeRange, expectedSql]) => {
      it(`keeps the ${timeRange} date grouping on ${dialect}`, async () => {
        expect.assertions(1);
        const { model, buildSql } = setup(dialect);

        await perform({ model, params: lineParams({ timeRange }) });

        expect(buildSql()).toContain(expectedSql);
      });
    });

    it('keeps accepting an aggregator whatever its case', async () => {
      expect.assertions(2);
      const { model, findAll, buildSql } = setup('postgres');

      await perform({ model, params: lineParams({ aggregator: 'COUNT' }) });

      expect(findAll).toHaveBeenCalledTimes(1);
      expect(buildSql()).toContain('count(');
    });

    it('keeps grouping by the column name when it differs from the field name', async () => {
      expect.assertions(2);
      const { model, buildSql } = setup('postgres', [
        { field: 'id', type: 'Number' },
        { field: 'createdAt', type: 'Date', columnName: 'creation_date' },
      ]);

      await perform({ model, params: lineParams({}) });

      expect(buildSql()).toContain('"user"."creation_date"');
      expect(buildSql()).not.toContain('createdAt');
    });
  });
});
