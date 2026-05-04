'use strict';

module.exports = {
  async up(queryInterface, Sequelize)
  {
    await queryInterface.createTable('payment_transactions', {
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
      payment_method_id: {
        allowNull: true,
        type: Sequelize.INTEGER.UNSIGNED,
        references: {
          model: 'payment_methods',
          key: 'id'
        },
        onDelete: 'SET NULL'
      },
      type: {
        allowNull: false,
        type: Sequelize.ENUM('upsell', 'renewal', 'card_update', 'card_verification')
      },
      status: {
        allowNull: false,
        type: Sequelize.ENUM('approved', 'declined', 'failed')
      },
      customer_id: {
        allowNull: true,
        type: Sequelize.STRING(120)
      },
      response_crm_order_id: {
        allowNull: true,
        type: Sequelize.STRING(120)
      },
      response_crm_transaction_id: {
        allowNull: true,
        type: Sequelize.STRING(120)
      },
      idempotency_key: {
        allowNull: true,
        type: Sequelize.STRING(191)
      },
      card_last4: {
        allowNull: true,
        type: Sequelize.STRING(4)
      },
      charged_at: {
        allowNull: true,
        type: Sequelize.DATE
      },
      next_charged_at: {
        allowNull: true,
        type: Sequelize.DATE
      },
      failure_reason: {
        allowNull: true,
        type: Sequelize.STRING(500)
      },
      metadata: {
        allowNull: false,
        type: Sequelize.JSON
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

    await queryInterface.addIndex('payment_transactions', ['user_id', 'created_at'], {
      name: 'payment_transactions_user_created_idx'
    });
    await queryInterface.addIndex('payment_transactions', ['response_crm_transaction_id'], {
      name: 'payment_transactions_crm_transaction_idx'
    });
    await queryInterface.addIndex('payment_transactions', ['idempotency_key'], {
      name: 'payment_transactions_idempotency_idx'
    });
  },

  async down(queryInterface)
  {
    await queryInterface.dropTable('payment_transactions');
  }
};
