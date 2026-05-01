'use strict';

module.exports = {
  async up(queryInterface, Sequelize)
  {
    const table = await queryInterface.describeTable('payment_methods');

    if (!table.customer_id)
    {
      await queryInterface.addColumn('payment_methods', 'customer_id', {
        allowNull: true,
        type: Sequelize.STRING(120),
        after: 'user_id'
      });
    }
  },

  async down(queryInterface)
  {
    const table = await queryInterface.describeTable('payment_methods');

    if (table.customer_id)
    {
      await queryInterface.removeColumn('payment_methods', 'customer_id');
    }
  }
};
