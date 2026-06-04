'use strict';

module.exports = {
  async up(queryInterface, Sequelize)
  {
    if (await tableExists(queryInterface, 'payment_transactions'))
    {
      await queryInterface.removeIndex('payment_transactions', 'payment_transactions_method_status_created_idx').catch(() => {});

      const paymentTransactions = await queryInterface.describeTable('payment_transactions');
      if (paymentTransactions.payment_method_id)
      {
        await queryInterface.removeColumn('payment_transactions', 'payment_method_id');
      }
      if (paymentTransactions.next_charged_at)
      {
        await queryInterface.removeColumn('payment_transactions', 'next_charged_at');
      }
    }

    if (await tableExists(queryInterface, 'payment_methods'))
    {
      await queryInterface.removeIndex('payment_methods', 'payment_methods_billing_locked_idx').catch(() => {});
      await queryInterface.removeIndex('payment_methods', 'payment_methods_billing_due_idx').catch(() => {});
      await queryInterface.removeIndex('payment_methods', 'payment_methods_due_order_idx').catch(() => {});
      await queryInterface.removeIndex('payment_methods', 'payment_methods_user_status_created_idx').catch(() => {});
      await queryInterface.removeIndex('payment_methods', 'payment_methods_user_created_idx').catch(() => {});
      await queryInterface.removeIndex('payment_methods', ['user_id', 'status']).catch(() => {});
      await queryInterface.dropTable('payment_methods');
    }
  },

  async down(queryInterface, Sequelize)
  {
    if (!(await tableExists(queryInterface, 'payment_methods')))
    {
      await queryInterface.createTable('payment_methods', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER.UNSIGNED
        },
        user_id: {
          allowNull: false,
          type: Sequelize.INTEGER.UNSIGNED,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        customer_id: {
          allowNull: true,
          type: Sequelize.STRING(120)
        },
        card_no: {
          allowNull: false,
          type: Sequelize.STRING(255)
        },
        expiry_month: {
          allowNull: false,
          type: Sequelize.STRING(255)
        },
        expiry_year: {
          allowNull: false,
          type: Sequelize.STRING(255)
        },
        cvv: {
          allowNull: false,
          type: Sequelize.STRING(255)
        },
        last_charged_at: {
          allowNull: true,
          type: Sequelize.DATE
        },
        next_charged_at: {
          allowNull: true,
          type: Sequelize.DATE
        },
        billing_attempts: {
          allowNull: false,
          defaultValue: 0,
          type: Sequelize.INTEGER.UNSIGNED
        },
        next_retry_at: {
          allowNull: true,
          type: Sequelize.DATE
        },
        billing_locked_at: {
          allowNull: true,
          type: Sequelize.DATE
        },
        last_failed_at: {
          allowNull: true,
          type: Sequelize.DATE
        },
        failure_reason: {
          allowNull: true,
          type: Sequelize.STRING(500)
        },
        status: {
          allowNull: false,
          defaultValue: 'active',
          type: Sequelize.ENUM('active', 'failed', 'replaced')
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE
        }
      });

      await queryInterface.addIndex('payment_methods', ['user_id', 'status'], {
        name: 'payment_methods_user_status_idx'
      }).catch(() => {});
      await queryInterface.addIndex('payment_methods', ['status', 'next_charged_at', 'next_retry_at'], {
        name: 'payment_methods_billing_due_idx'
      }).catch(() => {});
      await queryInterface.addIndex('payment_methods', ['billing_locked_at'], {
        name: 'payment_methods_billing_locked_idx'
      }).catch(() => {});
    }

    if (await tableExists(queryInterface, 'payment_transactions'))
    {
      const paymentTransactions = await queryInterface.describeTable('payment_transactions');
      if (!paymentTransactions.payment_method_id)
      {
        await queryInterface.addColumn('payment_transactions', 'payment_method_id', {
          allowNull: true,
          type: Sequelize.INTEGER.UNSIGNED,
          references: {
            model: 'payment_methods',
            key: 'id'
          },
          onDelete: 'SET NULL',
          after: 'user_id'
        });
      }
      if (!paymentTransactions.next_charged_at)
      {
        await queryInterface.addColumn('payment_transactions', 'next_charged_at', {
          allowNull: true,
          type: Sequelize.DATE,
          after: 'charged_at'
        });
      }
      await queryInterface.addIndex('payment_transactions', ['payment_method_id', 'status', 'created_at'], {
        name: 'payment_transactions_method_status_created_idx'
      }).catch(() => {});
    }
  }
};

async function tableExists(queryInterface, tableName)
{
  const tables = await queryInterface.showAllTables();
  return tables.map(normalizeTableName).includes(tableName);
}

function normalizeTableName(value)
{
  if (typeof value === 'string')
  {
    return value;
  }

  return value.tableName || value.table_name || Object.values(value)[0];
}
