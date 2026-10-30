import Sequelize from 'sequelize';
import Interface, { scopeManager } from 'forest-express';
import LineStatGetter from '../../src/services/line-stat-getter';

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
          fields: [{ field: 'id', type: 'Number' }, { field: 'createdAt', type: 'Date' }],
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
    [...supportedTimezones, 'America/Ciudad_Juarez', 'America/Coyhaique'].forEach((timezone) => {
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

    it('groups the dates in the requested zone on a host whose own zone Intl cannot name', async () => {
      expect.assertions(1);
      const { model, buildSql } = setup('postgres');
      const { DateTimeFormat } = Intl;
      // Node reports no host zone when started with TZ=UTC0 or TZ=:/etc/localtime.
      jest.spyOn(Intl, 'DateTimeFormat').mockImplementation((...args) => (args.length
        ? new DateTimeFormat(...args)
        : { resolvedOptions: () => ({ timeZone: undefined }) }));

      await new LineStatGetter(model, lineParams({ timezone: 'Asia/Tokyo' }), { Sequelize }, user).perform();

      expect(buildSql()).toContain('timezone(\'Asia/Tokyo\', "user"."createdAt")');
    });

    it('reads a one-item timezone list as that zone', async () => {
      expect.assertions(1);
      const { model, buildSql } = setup('postgres');

      await new LineStatGetter(model, lineParams({ timezone: ['Europe/Paris'] }), { Sequelize }, user).perform();

      expect(buildSql()).toContain('timezone(\'Europe/Paris\', "user"."createdAt")');
    });

    [
      ['no timezone', undefined, 'Missing timezone'],
      ['an empty timezone', '', 'Missing timezone'],
      ['an unknown zone name', 'Europe/Atlantis', 'Invalid timezone: "Europe/Atlantis"'],
      ['a timezone containing a space', 'Europe Paris', 'Invalid timezone: "Europe Paris"'],
      ['several timezones', ['Europe/Paris', 'UTC'], 'Invalid timezone: "Europe/Paris,UTC"'],
      ['a timezone that is not a string', { name: 'Europe/Paris' }, 'Invalid timezone: "[object Object]"'],
    ].forEach(([description, timezone, message]) => {
      it(`refuses ${description} without querying the database`, async () => {
        expect.assertions(2);
        const { model, findAll } = setup('postgres');

        await expect(
          new LineStatGetter(model, lineParams({ timezone }), { Sequelize }, user).perform(),
        ).rejects.toThrow(message);
        expect(findAll).not.toHaveBeenCalled();
      });
    });

    it('answers "Missing timezone" with a 400 status when a date filter comes without timezone', async () => {
      expect.assertions(2);
      const { model, findAll } = setup('postgres');
      const filter = { field: 'createdAt', operator: 'today', value: null };

      await expect(
        new LineStatGetter(model, lineParams({ filter }), { Sequelize }, user).perform(),
      ).rejects.toMatchObject({ message: 'Missing timezone', status: 400 });
      expect(findAll).not.toHaveBeenCalled();
    });

    it('answers "Missing timezone" with a 400 status when a date scope comes without timezone', async () => {
      expect.assertions(2);
      const { model, findAll } = setup('postgres');
      scopeManager.getScopeForUser.mockResolvedValue({ field: 'createdAt', operator: 'today', value: null });

      await expect(
        new LineStatGetter(model, lineParams({}), { Sequelize }, user).perform(),
      ).rejects.toMatchObject({ message: 'Missing timezone', status: 400 });
      expect(findAll).not.toHaveBeenCalled();
    });

    it('answers an invalid timezone with a 400 status', async () => {
      expect.assertions(1);
      const { model } = setup('postgres');

      await expect(
        new LineStatGetter(model, lineParams({ timezone: 'Europe/Atlantis' }), { Sequelize }, user).perform(),
      ).rejects.toMatchObject({ name: 'BadRequestError', status: 400 });
    });

    it('answers a missing timezone with a 400 status', async () => {
      expect.assertions(1);
      const { model } = setup('postgres');

      await expect(
        new LineStatGetter(model, lineParams({}), { Sequelize }, user).perform(),
      ).rejects.toMatchObject({ name: 'BadRequestError', status: 400 });
    });
  });

  ['mysql', 'mariadb', 'mssql', 'sqlite'].forEach((dialect) => {
    describe(`with ${dialect}`, () => {
      [...supportedTimezones, undefined, 'Europe Paris'].forEach((timezone) => {
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
