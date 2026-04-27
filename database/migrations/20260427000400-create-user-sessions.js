'use strict';

module.exports = {
  async up(queryInterface, Sequelize)
  {
    await queryInterface.createTable('user_sessions', {
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
      jwt_id: {
        allowNull: false,
        type: Sequelize.STRING(64),
        unique: true
      },
      revoked_at: {
        allowNull: true,
        type: Sequelize.DATE
      },
      expires_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      ip_address: {
        allowNull: true,
        type: Sequelize.STRING(64)
      },
      user_agent: {
        allowNull: true,
        type: Sequelize.STRING(255)
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

    await queryInterface.addIndex('user_sessions', ['user_id']);
    await queryInterface.addIndex('user_sessions', ['expires_at']);
  },

  async down(queryInterface)
  {
    await queryInterface.dropTable('user_sessions');
  }
};
