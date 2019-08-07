function ApimapFieldTypeDetector(column, options) {
  const DataTypes = options.sequelize;

  this.perform = () => {
    if (column.type instanceof DataTypes.STRING ||
      column.type instanceof DataTypes.TEXT ||
      column.type instanceof DataTypes.UUID ||
      column.type instanceof DataTypes.UUIDV1 ||
      column.type instanceof DataTypes.UUIDV4 ||
      (DataTypes.CITEXT && column.type instanceof DataTypes.CITEXT) ||
      column.type === 'citext') { // TODO: Remove 'citext' once Sequelize 4 has been unsupported.
      return 'String';
    } else if (column.type instanceof DataTypes.ENUM) {
      return 'Enum';
    } else if (column.type instanceof DataTypes.BOOLEAN) {
      return 'Boolean';
    } else if (column.type instanceof DataTypes.DATEONLY) {
      return 'Dateonly';
    } else if (column.type instanceof DataTypes.DATE) {
      return 'Date';
    } else if (column.type instanceof DataTypes.INTEGER ||
      column.type instanceof DataTypes.FLOAT ||
      column.type instanceof DataTypes['DOUBLE PRECISION'] ||
      column.type instanceof DataTypes.BIGINT ||
      column.type instanceof DataTypes.DECIMAL) {
      return 'Number';
    } else if (column.type instanceof DataTypes.JSONB ||
      column.type instanceof DataTypes.JSON) {
      return 'Json';
    } else if (column.type instanceof DataTypes.TIME) {
      return 'Time';
    } else if (column.type instanceof DataTypes.GEOMETRY &&
      column.type.type === 'POINT') {
      return 'Point';
    // NOTICE: Detect Array types (Array(String), Array(Integer), ...)
    } else if (column.type.type) {
      return [new ApimapFieldTypeDetector({ type: column.type.type }, options).perform()];
    }
    return null;
  };
}

module.exports = ApimapFieldTypeDetector;
