import Sequelize from 'sequelize';
import Interface, { scopeManager } from 'forest-express';
import LineStatGetter from '../../src/services/line-stat-getter';
import { InvalidParameterError } from '../../src/services/errors';

describe('services > line-stat-getter', () => {
  const user = { renderingId: 1 };
  const supportedTimezones = ['Europe/Paris', 'America/New_York', 'UTC', 'Etc/GMT+2'];

  const setup = (dialect) => {
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
          fields: [{ field: 'id' }, { field: 'createdAt' }],
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
    filter: null,
    ...extra,
  });

  describe('with postgres', () => {
    supportedTimezones.forEach((timezone) => {
      it(`groups the dates in the ${timezone} time zone`, async () => {
        expect.assertions(2);
        const { model, findAll, buildSql } = setup('postgres');

        await new LineStatGetter(model, lineParams({ timezone }), { Sequelize }, user).perform();

        expect(findAll).toHaveBeenCalledTimes(1);
        expect(buildSql()).toContain(
          `to_char(date_trunc('Day', timezone('${timezone}', "user"."createdAt")), 'YYYY-MM-DD 00:00:00') AS "date"`,
        );
      });
    });

    it('accepts a zone name whatever its case', async () => {
      expect.assertions(1);
      const { model, buildSql } = setup('postgres');

      await new LineStatGetter(model, lineParams({ timezone: 'europe/paris' }), { Sequelize }, user).perform();

      expect(buildSql()).toContain('timezone(\'europe/paris\', "user"."createdAt")');
    });

    [
      ['no timezone', undefined],
      ['an empty timezone', ''],
      ['an unknown zone name', 'Europe/Atlantis'],
      ['a UTC offset', '+02:00'],
      ['several timezones', ['Europe/Paris', 'UTC']],
      ['a timezone that is not a string', { name: 'Europe/Paris' }],
    ].forEach(([description, timezone]) => {
      it(`refuses ${description} without querying the database`, async () => {
        expect.assertions(2);
        const { model, findAll } = setup('postgres');

        await expect(
          new LineStatGetter(model, lineParams({ timezone }), { Sequelize }, user).perform(),
        ).rejects.toThrow(new InvalidParameterError(
          'The timezone must be an IANA time zone name, such as "Europe/Paris".',
        ));
        expect(findAll).not.toHaveBeenCalled();
      });
    });

    it('answers an invalid timezone with a 422 status', async () => {
      expect.assertions(1);
      const { model } = setup('postgres');

      await expect(
        new LineStatGetter(model, lineParams({ timezone: 'Europe/Atlantis' }), { Sequelize }, user).perform(),
      ).rejects.toMatchObject({ name: 'InvalidParameterError', status: 422 });
    });
  });

  ['mysql', 'mariadb', 'mssql', 'sqlite'].forEach((dialect) => {
    describe(`with ${dialect}`, () => {
      [...supportedTimezones, undefined, 'Europe/Atlantis'].forEach((timezone) => {
        it(`builds the chart query when the timezone is ${JSON.stringify(timezone)}`, async () => {
          expect.assertions(2);
          const { model, findAll, buildSql } = setup(dialect);

          await new LineStatGetter(model, lineParams({ timezone }), { Sequelize }, user).perform();

          expect(findAll).toHaveBeenCalledTimes(1);
          expect(buildSql()).not.toContain('timezone(');
        });
      });
    });
  });
});
