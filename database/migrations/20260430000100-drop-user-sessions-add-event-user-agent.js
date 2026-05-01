'use strict';

module.exports = {
  async up(queryInterface, Sequelize)
  {
    const eventTable = await queryInterface.describeTable('events');

    if (!eventTable.user_agent)
    {
      await queryInterface.addColumn('events', 'user_agent', {
        allowNull: true,
        type: Sequelize.STRING(512),
        after: 'ip_address'
      });
    }

    const tables = await queryInterface.showAllTables();
    const tableNames = tables.map((table) => typeof table === 'object' ? table.tableName || table.Tables_in_fitness_saas || Object.values(table)[0] : table);

    if (tableNames.includes('user_sessions'))
    {
      await queryInterface.dropTable('user_sessions');
    }
  },

  async down(queryInterface, Sequelize)
  {
    const tables = await queryInterface.showAllTables();
    const tableNames = tables.map((table) => typeof table === 'object' ? table.tableName || table.Tables_in_fitness_saas || Object.values(table)[0] : table);

    if (!tableNames.includes('user_sessions'))
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
          references: { model: 'users', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        jwt_id: {
          allowNull: false,
          unique: true,
          type: Sequelize.STRING(64)
        },
        ip_address: {
          allowNull: true,
          type: Sequelize.STRING(64)
        },
        user_agent: {
          allowNull: true,
          type: Sequelize.STRING(255)
        },
        revoked_at: {
          allowNull: true,
          type: Sequelize.DATE
        },
        expires_at: {
          allowNull: false,
          type: Sequelize.DATE
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
    }

    const eventTable = await queryInterface.describeTable('events');

    if (eventTable.user_agent)
    {
      await queryInterface.removeColumn('events', 'user_agent');
    }
  }
};
