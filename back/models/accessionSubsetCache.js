module.exports = (sequelize, DataTypes) => {
  const AccessionSubsetCache = sequelize.define(
    "AccessionSubsetCache",
    {
      accessionNumber: {
        type: DataTypes.STRING(255),
        allowNull: false,
        primaryKey: true,
      },
      instituteCode: {
        type: DataTypes.STRING(255),
        allowNull: false,
        primaryKey: true,
      },
      subsets: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      lastFetchedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      timestamps: true,
    },
  );

  return AccessionSubsetCache;
};
