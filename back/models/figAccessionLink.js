module.exports = (sequelize, DataTypes) => {
  const FigAccessionLink = sequelize.define(
    "FigAccessionLink",
    {
      accession_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      fig_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ["accession_id", "fig_id"],
        },
      ],
    }
  );

  FigAccessionLink.associate = (models) => {
    FigAccessionLink.belongsTo(models.Fig, {
      foreignKey: "fig_id",
      as: "fig",
    });
  };

  return FigAccessionLink;
};
