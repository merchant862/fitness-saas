'use strict';

module.exports = {
  async up(queryInterface, Sequelize)
  {
    const table = await queryInterface.describeTable('payment_methods');

    if (table.external_order_id)
    {
      await queryInterface.removeIndex('payment_methods', ['external_order_id']).catch(() => {});
    }

    if (table.next_charge_at && !table.next_charged_at)
    {
      await queryInterface.renameColumn('payment_methods', 'next_charge_at', 'next_charged_at');
    }

    const columnsToRemove = [
      'provider',
      'external_customer_id',
      'external_order_id',
      'external_transaction_id',
      'metadata'
    ];

    for (const column of columnsToRemove)
    {
      const latestTable = await queryInterface.describeTable('payment_methods');

      if (latestTable[column])
      {
        await queryInterface.removeColumn('payment_methods', column);
      }
    }

    const finalTable = await queryInterface.describeTable('payment_methods');

    if (!finalTable.next_charged_at)
    {
      await queryInterface.addColumn('payment_methods', 'next_charged_at', {
        type: Sequelize.DATE,
        allowNull: true,
        after: 'last_charged_at'
      });
    }
  },

  async down(queryInterface, Sequelize)
  {
    const table = await queryInterface.describeTable('payment_methods');

    if (!table.provider)
    {
      await queryInterface.addColumn('payment_methods', 'provider', {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'responsecrm',
        after: 'user_id'
      });
    }

    if (!table.external_customer_id)
    {
      await queryInterface.addColumn('payment_methods', 'external_customer_id', {
        type: Sequelize.STRING(120),
        allowNull: true,
        after: 'provider'
      });
    }

    if (!table.external_order_id)
    {
      await queryInterface.addColumn('payment_methods', 'external_order_id', {
        type: Sequelize.STRING(120),
        allowNull: true,
        after: 'external_customer_id'
      });
      await queryInterface.addIndex('payment_methods', ['external_order_id']);
    }

    if (!table.external_transaction_id)
    {
      await queryInterface.addColumn('payment_methods', 'external_transaction_id', {
        type: Sequelize.STRING(120),
        allowNull: true,
        after: 'external_order_id'
      });
    }

    if (!table.metadata)
    {
      await queryInterface.addColumn('payment_methods', 'metadata', {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
        after: 'status'
      });
    }

    const latestTable = await queryInterface.describeTable('payment_methods');

    if (latestTable.next_charged_at && !latestTable.next_charge_at)
    {
      await queryInterface.renameColumn('payment_methods', 'next_charged_at', 'next_charge_at');
    }
  }
};
