'use strict';

module.exports = {
  async up(queryInterface, Sequelize)
  {
    const table = await queryInterface.describeTable('users');

    if (!table.active_session_token_hash)
    {
      await queryInterface.addColumn('users', 'active_session_token_hash', {
        allowNull: true,
        type: Sequelize.STRING(64)
      });
    }

    if (!table.active_session_expires_at)
    {
      await queryInterface.addColumn('users', 'active_session_expires_at', {
        allowNull: true,
        type: Sequelize.DATE
      });
    }

    if (!table.active_session_started_at)
    {
      await queryInterface.addColumn('users', 'active_session_started_at', {
        allowNull: true,
        type: Sequelize.DATE
      });
    }

    if (!table.active_session_ip)
    {
      await queryInterface.addColumn('users', 'active_session_ip', {
        allowNull: true,
        type: Sequelize.STRING(64)
      });
    }

    if (!table.active_session_user_agent)
    {
      await queryInterface.addColumn('users', 'active_session_user_agent', {
        allowNull: true,
        type: Sequelize.STRING(255)
      });
    }

    await queryInterface.addIndex('users', ['active_session_token_hash'], {
      name: 'users_active_session_token_hash_idx'
    }).catch(() => {});
  },

  async down(queryInterface)
  {
    await queryInterface.removeIndex('users', 'users_active_session_token_hash_idx').catch(() => {});
    await queryInterface.removeColumn('users', 'active_session_user_agent').catch(() => {});
    await queryInterface.removeColumn('users', 'active_session_ip').catch(() => {});
    await queryInterface.removeColumn('users', 'active_session_started_at').catch(() => {});
    await queryInterface.removeColumn('users', 'active_session_expires_at').catch(() => {});
    await queryInterface.removeColumn('users', 'active_session_token_hash').catch(() => {});
  }
};
