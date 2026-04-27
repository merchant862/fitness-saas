'use strict';

module.exports = {
  async up(queryInterface, Sequelize)
  {
    await queryInterface.createTable('magic_links', {
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

    await queryInterface.addIndex('magic_links', ['user_id']);
    await queryInterface.addIndex('magic_links', ['expires_at']);
  },

  async down(queryInterface)
  {
    await queryInterface.dropTable('magic_links');
  }
};
