'use strict';

module.exports = {
  async up(queryInterface, Sequelize)
  {
    const table = await queryInterface.describeTable('payment_methods');

    if (!table.billing_attempts)
    {
      await queryInterface.addColumn('payment_methods', 'billing_attempts', {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED,
        defaultValue: 0
      });
    }

    if (!table.next_retry_at)
    {
      await queryInterface.addColumn('payment_methods', 'next_retry_at', {
        allowNull: true,
        type: Sequelize.DATE
      });
    }

    if (!table.billing_locked_at)
    {
      await queryInterface.addColumn('payment_methods', 'billing_locked_at', {
        allowNull: true,
        type: Sequelize.DATE
      });
    }

    if (!table.last_failed_at)
    {
      await queryInterface.addColumn('payment_methods', 'last_failed_at', {
        allowNull: true,
        type: Sequelize.DATE
      });
    }

    if (!table.failure_reason)
    {
      await queryInterface.addColumn('payment_methods', 'failure_reason', {
        allowNull: true,
        type: Sequelize.STRING(500)
      });
    }

    await queryInterface.addIndex('payment_methods', ['status', 'next_charged_at', 'next_retry_at'], {
      name: 'payment_methods_billing_due_idx'
    }).catch(() => {});

    await queryInterface.addIndex('payment_methods', ['billing_locked_at'], {
      name: 'payment_methods_billing_locked_idx'
    }).catch(() => {});
  },

  async down(queryInterface)
  {
    await queryInterface.removeIndex('payment_methods', 'payment_methods_billing_locked_idx').catch(() => {});
    await queryInterface.removeIndex('payment_methods', 'payment_methods_billing_due_idx').catch(() => {});
    await queryInterface.removeColumn('payment_methods', 'failure_reason').catch(() => {});
    await queryInterface.removeColumn('payment_methods', 'last_failed_at').catch(() => {});
    await queryInterface.removeColumn('payment_methods', 'billing_locked_at').catch(() => {});
    await queryInterface.removeColumn('payment_methods', 'next_retry_at').catch(() => {});
    await queryInterface.removeColumn('payment_methods', 'billing_attempts').catch(() => {});
  }
};
