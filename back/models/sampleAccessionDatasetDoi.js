module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "SampleAccessionDatasetDoi",
    {
      SampleAccessionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: "SampleAccessions", key: "id" },
        onDelete: "CASCADE",
      },
      DatasetDoiId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: "DatasetDois", key: "id" },
        onDelete: "CASCADE",
      },
    },
    { timestamps: false },
  );
};
