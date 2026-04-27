'use strict';

module.exports = {
  async up(queryInterface, Sequelize)
  {
    await queryInterface.createTable('access_codes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED
      },
      code_hash: {
        allowNull: false,
        type: Sequelize.STRING(128),
        unique: true
      },
      email: {
        allowNull: false,
        type: Sequelize.STRING(191)
      },
      user_id: {
        allowNull: true,
        type: Sequelize.INTEGER.UNSIGNED,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      status: {
        allowNull: false,
        type: Sequelize.ENUM('unused', 'redeemed', 'expired', 'revoked'),
        defaultValue: 'unused'
      },
      expires_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      redeemed_at: {
        allowNull: true,
        type: Sequelize.DATE
      },
      source: {
        allowNull: false,
        type: Sequelize.STRING(80),
        defaultValue: 'manual'
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

    await queryInterface.addIndex('access_codes', ['email']);
    await queryInterface.addIndex('access_codes', ['status']);
    await queryInterface.addIndex('access_codes', ['expires_at']);
  },

  async down(queryInterface)
  {
    await queryInterface.dropTable('access_codes');
  }
};
