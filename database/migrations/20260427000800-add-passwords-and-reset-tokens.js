'use strict';

module.exports = {
  async up(queryInterface, Sequelize)
  {
    await queryInterface.addColumn('users', 'password_hash', {
      allowNull: true,
      type: Sequelize.STRING(255),
      after: 'status'
    });

    await queryInterface.createTable('password_reset_tokens', {
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
      token_hash: {
        allowNull: false,
        type: Sequelize.STRING(128),
        unique: true
      },
      expires_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      used_at: {
        allowNull: true,
        type: Sequelize.DATE
      },
      request_ip: {
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

    await queryInterface.addIndex('password_reset_tokens', ['user_id']);
    await queryInterface.addIndex('password_reset_tokens', ['expires_at']);
  },

  async down(queryInterface)
  {
    await queryInterface.dropTable('password_reset_tokens');
    await queryInterface.removeColumn('users', 'password_hash');
  }
};
