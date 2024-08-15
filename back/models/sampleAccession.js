module.exports = (sequelize, DataTypes) => {
  const SampleAccession = sequelize.define('SampleAccession', {
    Accession: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    Sample: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
  }, {
    indexes: [
      {
        unique: true,
        fields: ['Accession', 'Sample']
      }
    ]
  });

  return SampleAccession;
};
