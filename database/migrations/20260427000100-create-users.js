'use strict';

module.exports = {
  async up(queryInterface, Sequelize)
  {
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED
      },
      email: {
        allowNull: false,
        type: Sequelize.STRING(191),
        unique: true
      },
      name: {
        allowNull: true,
        type: Sequelize.STRING(120)
      },
      role: {
        allowNull: false,
        type: Sequelize.ENUM('user', 'admin'),
        defaultValue: 'user'
      },
      status: {
        allowNull: false,
        type: Sequelize.ENUM('pending', 'active', 'suspended'),
        defaultValue: 'pending'
      },
      access_expires_at: {
        allowNull: true,
        type: Sequelize.DATE
      },
      last_login_at: {
        allowNull: true,
        type: Sequelize.DATE
      },
      onboarding_completed_at: {
        allowNull: true,
        type: Sequelize.DATE
      },
      tags: {
        allowNull: false,
        type: Sequelize.JSON,
        defaultValue: []
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

    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['status']);
  },

  async down(queryInterface)
  {
    await queryInterface.dropTable('users');
  }
};
