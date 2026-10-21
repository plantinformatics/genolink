const migration = require("../../../migrations/20261020000000-baseline-schema");

const Sequelize = {
  DATE: "DATE",
  ENUM: (...values) => ({ values }),
  INTEGER: "INTEGER",
  STRING: (length) => ({ length }),
};

const legacyColumns = {
  SampleAccessions: {
    id: {},
    Accession: {},
    Sample: {},
    Status: {},
    ServerUrl: {},
    createdAt: {},
    updatedAt: {},
  },
  DatasetDois: { id: {}, Doi: {}, createdAt: {}, updatedAt: {} },
  SampleAccessionDatasetDois: { SampleAccessionId: {}, DatasetDoiId: {} },
};

function queryInterface(tables = []) {
  return {
    showAllTables: jest.fn().mockResolvedValue(tables),
    describeTable: jest.fn((table) => Promise.resolve(legacyColumns[table])),
    createTable: jest.fn().mockResolvedValue(undefined),
    addIndex: jest.fn().mockResolvedValue(undefined),
  };
}

describe("baseline schema migration", () => {
  test("creates the baseline for an empty database", async () => {
    const qi = queryInterface(["SequelizeMeta"]);

    await migration.up(qi, Sequelize);

    expect(qi.createTable.mock.calls.map(([table]) => table)).toEqual([
      "SampleAccessions",
      "DatasetDois",
      "SampleAccessionDatasetDois",
    ]);
  });

  test("validates and adopts a complete legacy schema", async () => {
    const qi = queryInterface([
      "SampleAccessions",
      "DatasetDois",
      "SampleAccessionDatasetDois",
      "SequelizeMeta",
    ]);

    await migration.up(qi, Sequelize);

    expect(qi.describeTable).toHaveBeenCalledTimes(3);
    expect(qi.createTable).not.toHaveBeenCalled();
  });

  test("refuses to adopt a partial schema", async () => {
    const qi = queryInterface(["SampleAccessions"]);

    await expect(migration.up(qi, Sequelize)).rejects.toThrow(
      "partial or unexpected schema",
    );
    expect(qi.createTable).not.toHaveBeenCalled();
  });

  test("refuses to adopt a legacy table with missing columns", async () => {
    const qi = queryInterface([
      "SampleAccessions",
      "DatasetDois",
      "SampleAccessionDatasetDois",
    ]);
    qi.describeTable.mockImplementation((table) => {
      if (table === "SampleAccessions") {
        return Promise.resolve({ ...legacyColumns[table], ServerUrl: undefined });
      }
      return Promise.resolve(legacyColumns[table]);
    });

    await expect(migration.up(qi, Sequelize)).rejects.toThrow("ServerUrl");
    expect(qi.createTable).not.toHaveBeenCalled();
  });
});
