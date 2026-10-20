"use strict";

const BASELINE_TABLES = [
  "SampleAccessions",
  "DatasetDois",
  "SampleAccessionDatasetDois",
];

const REQUIRED_COLUMNS = {
  SampleAccessions: [
    "id",
    "Accession",
    "Sample",
    "Status",
    "ServerUrl",
    "createdAt",
    "updatedAt",
  ],
  DatasetDois: ["id", "Doi", "createdAt", "updatedAt"],
  SampleAccessionDatasetDois: ["SampleAccessionId", "DatasetDoiId"],
};

function normalizeTableName(table) {
  if (typeof table === "string") return table;
  return table.tableName || table.table_name;
}

async function validateLegacySchema(queryInterface) {
  for (const table of BASELINE_TABLES) {
    const columns = await queryInterface.describeTable(table);
    const missing = REQUIRED_COLUMNS[table].filter((name) => !columns[name]);

    if (missing.length > 0) {
      throw new Error(
        `Cannot adopt the Genolink migration baseline: ${table} is missing ` +
          `required column(s): ${missing.join(", ")}. Restore or repair the ` +
          "legacy schema before running migrations.",
      );
    }
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const existingTables = (await queryInterface.showAllTables())
      .map(normalizeTableName)
      .filter((table) => table !== "SequelizeMeta");
    const presentBaselineTables = BASELINE_TABLES.filter((table) =>
      existingTables.includes(table),
    );

    if (presentBaselineTables.length === BASELINE_TABLES.length) {
      await validateLegacySchema(queryInterface);
      return;
    }

    if (presentBaselineTables.length > 0 || existingTables.length > 0) {
      throw new Error(
        "Cannot initialize the Genolink migration baseline because the " +
          `database contains a partial or unexpected schema: ${existingTables.join(", ")}.`,
      );
    }

    await queryInterface.createTable("SampleAccessions", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      Accession: { allowNull: false, type: Sequelize.STRING(255) },
      Sample: { allowNull: true, type: Sequelize.STRING(255) },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
      Status: {
        allowNull: true,
        defaultValue: "TBC",
        type: Sequelize.ENUM("Completed", "Pending", "Excluded", "TBC"),
      },
      ServerUrl: { allowNull: true, type: Sequelize.STRING(2048) },
    });
    await queryInterface.addIndex("SampleAccessions", ["Accession", "Sample"], {
      name: "sample_accessions__accession__sample",
      unique: true,
    });

    await queryInterface.createTable("DatasetDois", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      Doi: { allowNull: false, type: Sequelize.STRING(255), unique: true },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
    await queryInterface.addIndex("DatasetDois", ["Doi"], {
      name: "dataset_dois__doi",
      unique: true,
    });

    await queryInterface.createTable("SampleAccessionDatasetDois", {
      SampleAccessionId: {
        allowNull: false,
        primaryKey: true,
        references: { model: "SampleAccessions", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        type: Sequelize.INTEGER,
      },
      DatasetDoiId: {
        allowNull: false,
        primaryKey: true,
        references: { model: "DatasetDois", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        type: Sequelize.INTEGER,
      },
    });
    await queryInterface.addIndex(
      "SampleAccessionDatasetDois",
      ["SampleAccessionId", "DatasetDoiId"],
      {
        name: "SampleAccessionDatasetDois_SampleAccessionId_DatasetDoiId_unique",
        unique: true,
      },
    );
  },

  async down() {
    throw new Error(
      "The Genolink baseline cannot be reverted because it may represent an " +
        "adopted database containing existing user data.",
    );
  },
};
