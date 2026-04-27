'use strict';

module.exports = {
  async up(queryInterface, Sequelize)
  {
    await queryInterface.createTable('events', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED
      },
      user_id: {
        allowNull: true,
        type: Sequelize.INTEGER.UNSIGNED,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      event_type: {
        allowNull: false,
        type: Sequelize.STRING(80)
      },
      payload: {
        allowNull: false,
        type: Sequelize.JSON,
        defaultValue: {}
      },
      ip_address: {
        allowNull: true,
        type: Sequelize.STRING(64)
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

    await queryInterface.createTable('ai_messages', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED
      },
      user_id: {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      role: {
        allowNull: false,
        type: Sequelize.ENUM('user', 'assistant')
      },
      content: {
        allowNull: false,
        type: Sequelize.TEXT
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

    await queryInterface.addIndex('events', ['user_id', 'event_type']);
    await queryInterface.addIndex('events', ['created_at']);
    await queryInterface.addIndex('ai_messages', ['user_id', 'created_at']);
  },

  async down(queryInterface)
  {
    await queryInterface.dropTable('ai_messages');
    await queryInterface.dropTable('events');
  }
};
