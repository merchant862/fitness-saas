'use strict';

module.exports = {
  async up(queryInterface, Sequelize)
  {
    const tables = await tableNames(queryInterface);

    if (!tables.includes('app_settings'))
    {
      await queryInterface.createTable('app_settings', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER.UNSIGNED
        },
        setting_key: {
          allowNull: false,
          unique: true,
          type: Sequelize.STRING(120)
        },
        setting_value: {
          allowNull: false,
          type: Sequelize.TEXT
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
    }

    if (!tables.includes('user_login_sessions'))
    {
      await queryInterface.createTable('user_login_sessions', {
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
        session_token_hash: {
          allowNull: false,
          unique: true,
          type: Sequelize.STRING(64)
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

      await queryInterface.addIndex('user_login_sessions', ['user_id', 'revoked_at', 'expires_at'], {
        name: 'user_login_sessions_user_active_idx'
      }).catch(() => {});
      await queryInterface.addIndex('user_login_sessions', ['expires_at'], {
        name: 'user_login_sessions_expires_idx'
      }).catch(() => {});
    }

    const now = new Date();
    await queryInterface.bulkInsert('app_settings', [{
      setting_key: 'member_device_limit',
      setting_value: '1',
      created_at: now,
      updated_at: now
    }]).catch(() => {});
  },

  async down(queryInterface)
  {
    await queryInterface.dropTable('user_login_sessions').catch(() => {});
    await queryInterface.dropTable('app_settings').catch(() => {});
  }
};

async function tableNames(queryInterface)
{
  const tables = await queryInterface.showAllTables();
  return tables.map((table) => typeof table === 'object' ? table.tableName || Object.values(table)[0] : table);
}
