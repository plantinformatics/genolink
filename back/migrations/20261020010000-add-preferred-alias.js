"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("SampleAccessions", "PreferredAlias", {
      allowNull: true,
      type: Sequelize.STRING(255),
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("SampleAccessions", "PreferredAlias");
  },
};
