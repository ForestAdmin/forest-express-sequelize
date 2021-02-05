import orm from './orm';

async function get(model, pk) {
  const record = await orm.findRecord(model, pk);
  if (!record) {
    throw new Error(`related ${model.name} with pk ${pk} does not exist.`);
  }
  return record;
}

exports.get = get;
