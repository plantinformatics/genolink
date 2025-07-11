module.exports = (sequelize, DataTypes) => {
  const Fig = sequelize.define("Fig", {
    fig_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
  });

  Fig.associate = (models) => {
    Fig.hasMany(models.FigAccessionLink, {
      foreignKey: "fig_id",
      as: "accessionLinks",
    });
  };

  return Fig;
};
