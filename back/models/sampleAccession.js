module.exports = (sequelize, DataTypes) => {
  const SampleAccession = sequelize.define(
    "SampleAccession",
    {
      Accession: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      Sample: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      Status: {
        type: DataTypes.ENUM("Completed", "Pending", "Excluded", "TBC"),
        allowNull: false,
        defaultValue: "TBC",
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ["Accession", "Sample"],
        },
      ],
    }
  );

  return SampleAccession;
};
