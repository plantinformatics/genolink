module.exports = (sequelize, DataTypes) => {
  const DatasetDoi = sequelize.define(
    "DatasetDoi",
    {
      Doi: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
    },
    {
      indexes: [{ unique: true, fields: ["Doi"] }],
    },
  );

  DatasetDoi.associate = (db) => {
    DatasetDoi.belongsToMany(db.SampleAccession, {
      through: db.SampleAccessionDatasetDoi,
      foreignKey: "DatasetDoiId",
      otherKey: "SampleAccessionId",
      as: "SampleAccessions",
    });
  };

  return DatasetDoi;
};
