import Sequelize from 'sequelize';
import Interface, { scopeManager } from 'forest-express';
import HasManyGetter from '../../src/services/has-many-getter';
import ResourceGetter from '../../src/services/resource-getter';
import ResourcesExporter from '../../src/services/resources-exporter';
import ResourcesGetter from '../../src/services/resources-getter';

describe('services > related record scopes', () => {
  // Sequelize is created here without connection to a database
  const sequelize = new Sequelize({ dialect: 'postgres' });
  const Account = sequelize.define('accounts', { organization: Sequelize.STRING });
  const Holder = sequelize.define('holders', { region: Sequelize.STRING });
  const Card = sequelize.define('cards', { panLast4: Sequelize.STRING });
  const Owner = sequelize.define('owners', {});
  const Organization = sequelize.define('organizations', { name: Sequelize.STRING });
  Account.belongsTo(Organization, { as: 'tenant' });
  Card.belongsTo(Account, { as: 'account' });
  Card.belongsTo(Holder, { as: 'holder' });
  Owner.hasMany(Card, { as: 'cards' });

  const cardIncludes = [{ model: Account, as: 'account' }, { model: Holder, as: 'holder' }];
  const user = { id: 1, renderingId: 1 };
  const timezone = 'Europe/Paris';
  const fields = { cards: 'id,panLast4,account,holder', account: 'id', holder: 'id' };
  const accountScope = { field: 'organization', operator: 'equal', value: 'own' };

  const schema = (name, ownFields) => ({
    name,
    idField: 'id',
    primaryKeys: ['id'],
    fields: [{ field: 'id', type: 'Number', columnName: 'id' }, ...ownFields],
  });

  function buildCards() {
    return [
      { id: 1, account: { id: 10 }, holder: { id: 20 } },
      { id: 2, account: { id: 11 }, holder: { id: 21 } },
      { id: 3, account: null, holder: { id: 20 } },
    ].map((values) => Card.build(values, { include: cardIncludes }));
  }

  const relatedIds = (records) => records.map((record) => [
    record.id, record.account?.id ?? null, record.holder?.id ?? null,
  ]);

  // forest-express exposes the flag lookup from the release that follows this change.
  if (!scopeManager.scopeAppliesToRelatedRecords) {
    scopeManager.scopeAppliesToRelatedRecords = async () => false;
  }

  function setup({ flagged, scope = accountScope }) {
    // Assigned in place: forest-express resolves nested smart fields through the same object.
    Interface.Schemas.schemas = {
      cards: schema('cards', [
        { field: 'panLast4', type: 'String', columnName: 'panLast4' },
        { field: 'account', type: 'Number', reference: 'accounts.id' },
        { field: 'holder', type: 'Number', reference: 'holders.id' },
      ]),
      accounts: schema('accounts', [
        { field: 'organization', type: 'String', columnName: 'organization' },
        { field: 'tenant', type: 'Number', reference: 'organizations.id' },
      ]),
      organizations: schema('organizations', [{ field: 'name', type: 'String', columnName: 'name' }]),
      holders: schema('holders', [{ field: 'region', type: 'String', columnName: 'region' }]),
      owners: schema('owners', [{ field: 'cards', type: ['Number'], reference: 'cards.id' }]),
    };

    jest.spyOn(scopeManager, 'getScopeForUser').mockImplementation(async (_user, collectionName) => (
      collectionName === 'accounts' ? JSON.stringify(scope) : null
    ));
    jest.spyOn(scopeManager, 'scopeAppliesToRelatedRecords')
      .mockImplementation(async (_user, collectionName) => flagged.includes(collectionName));
    jest.spyOn(Account, 'findAll').mockResolvedValue([Account.build({ id: 10 })]);
    jest.spyOn(Holder, 'findAll').mockResolvedValue([]);
  }

  describe('when the related collection scope is flagged', () => {
    it('empties a related record outside the scope on list and keeps the row', async () => {
      expect.hasAssertions();
      setup({ flagged: ['accounts'] });
      jest.spyOn(Card, 'findAll').mockResolvedValue(buildCards());

      const [records] = await new ResourcesGetter(Card, {}, { timezone, fields }, user).perform();

      expect(relatedIds(records)).toStrictEqual([[1, 10, 20], [2, null, 21], [3, null, 20]]);
      expect(records[1].toJSON().account).toBeNull();
      expect(Account.findAll).toHaveBeenCalledTimes(1);
      const [{ where, attributes }] = Account.findAll.mock.calls[0];
      expect(attributes).toStrictEqual(['id']);
      expect(where).toStrictEqual({ id: [10, 11], organization: { [Sequelize.Op.eq]: 'own' } });
      expect(Holder.findAll).not.toHaveBeenCalled();
      jest.restoreAllMocks();
    });

    it('empties a related record outside the scope on get and still returns the record', async () => {
      expect.hasAssertions();
      setup({ flagged: ['accounts'] });
      jest.spyOn(Card, 'findOne').mockResolvedValue(buildCards()[1]);

      const record = await new ResourceGetter(Card, { recordId: 2, timezone }, user).perform();

      expect(relatedIds([record])).toStrictEqual([[2, null, 21]]);
      jest.restoreAllMocks();
    });

    it('empties a related record outside the scope on related list', async () => {
      expect.hasAssertions();
      setup({ flagged: ['accounts'] });
      const owner = Owner.build({ id: 1, cards: [] }, { include: [{ model: Card, as: 'cards' }] });
      owner.cards = buildCards();
      jest.spyOn(Owner, 'findOne').mockResolvedValue(owner);
      const params = {
        timezone, fields, associationName: 'cards', recordId: 1,
      };

      const [records] = await new HasManyGetter(Owner, Card, {}, params, user).perform();

      expect(relatedIds(records)).toStrictEqual([[1, 10, 20], [2, null, 21], [3, null, 20]]);
      jest.restoreAllMocks();
    });

    it('empties a related record outside the scope in each CSV batch', async () => {
      expect.hasAssertions();
      setup({ flagged: ['accounts'] });
      jest.spyOn(Card, 'findAll').mockResolvedValue(buildCards());
      const batches = [];

      await new ResourcesExporter(Card, {}, { timezone, fields }, null, user)
        .perform(async (records) => { batches.push(relatedIds(records)); });

      expect(batches).toStrictEqual([[[1, 10, 20], [2, null, 21], [3, null, 20]]]);
      jest.restoreAllMocks();
    });
  });

  it('checks a scope that reaches through a relation of the related collection', async () => {
    expect.hasAssertions();
    setup({ flagged: ['accounts'], scope: { field: 'tenant:name', operator: 'equal', value: 'own' } });
    jest.spyOn(Card, 'findAll').mockResolvedValue(buildCards());

    const [records] = await new ResourcesGetter(Card, {}, { timezone, fields }, user).perform();

    expect(relatedIds(records)).toStrictEqual([[1, 10, 20], [2, null, 21], [3, null, 20]]);
    const [{ where, include }] = Account.findAll.mock.calls[0];
    expect(where).toStrictEqual({ id: [10, 11], '$tenant.name$': { [Sequelize.Op.eq]: 'own' } });
    expect(include).toStrictEqual([expect.objectContaining({ as: 'tenant' })]);
    jest.restoreAllMocks();
  });

  it('serves related records as before when their scope is not flagged', async () => {
    expect.hasAssertions();
    setup({ flagged: [] });
    jest.spyOn(Card, 'findAll').mockResolvedValue(buildCards());

    const [records] = await new ResourcesGetter(Card, {}, { timezone, fields }, user).perform();

    expect(relatedIds(records)).toStrictEqual([[1, 10, 20], [2, 11, 21], [3, null, 20]]);
    expect(Account.findAll).not.toHaveBeenCalled();
    jest.restoreAllMocks();
  });
});
