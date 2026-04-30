'use strict';

module.exports = {
  async up(queryInterface, Sequelize)
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
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      provider: {
        allowNull: false,
        type: Sequelize.STRING(50),
        defaultValue: 'responsecrm'
      },
      external_customer_id: {
        type: Sequelize.STRING(120)
      },
      external_order_id: {
        type: Sequelize.STRING(120)
      },
      external_transaction_id: {
        type: Sequelize.STRING(120)
      },
      card_last4: {
        allowNull: false,
        type: Sequelize.STRING(4)
      },
      last_charged_at: {
        type: Sequelize.DATE
      },
      next_charge_at: {
        type: Sequelize.DATE
      },
      status: {
        allowNull: false,
        type: Sequelize.ENUM('active', 'failed', 'replaced'),
        defaultValue: 'active'
      },
      metadata: {
        allowNull: false,
        type: Sequelize.JSON,
        defaultValue: {}
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

    await queryInterface.addIndex('payment_methods', ['user_id', 'status']);
    await queryInterface.addIndex('payment_methods', ['external_order_id']);
  },

  async down(queryInterface)
  {
    await queryInterface.dropTable('payment_methods');
  }
};
