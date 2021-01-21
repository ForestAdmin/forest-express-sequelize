exports.primaryKeyIsForeignKey = (association) =>
  Object.values(association.source.rawAttributes).filter((attr) =>
    attr.field === association.source.primaryKeyField).length > 1;
