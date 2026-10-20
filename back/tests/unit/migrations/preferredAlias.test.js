const migration = require("../../../migrations/20261020010000-add-preferred-alias");

describe("PreferredAlias migration", () => {
  test("adds a nullable, non-unique string column", async () => {
    const queryInterface = { addColumn: jest.fn().mockResolvedValue(undefined) };
    const Sequelize = { STRING: jest.fn((length) => ({ length })) };

    await migration.up(queryInterface, Sequelize);

    expect(queryInterface.addColumn).toHaveBeenCalledWith(
      "SampleAccessions",
      "PreferredAlias",
      {
        allowNull: true,
        type: { length: 255 },
      },
    );
  });
});
