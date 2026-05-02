'use strict';

module.exports = {
  async up(queryInterface, Sequelize)
  {
    await queryInterface.createTable('meal_completions', {
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
      meal_key: {
        allowNull: false,
        type: Sequelize.STRING(120)
      },
      completed_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      metadata: {
        allowNull: false,
        type: Sequelize.JSON,
        defaultValue: {}
      },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    if (!(await hasIndex(queryInterface, 'meal_completions', 'meal_completions_user_id_meal_key')))
    {
      await queryInterface.addIndex('meal_completions', ['user_id', 'meal_key'], { unique: true });
    }

    if (!(await hasIndex(queryInterface, 'meal_completions', 'meal_completions_user_id_completed_at')))
    {
      await queryInterface.addIndex('meal_completions', ['user_id', 'completed_at']);
    }
  },

  async down(queryInterface)
  {
    await queryInterface.dropTable('meal_completions');
  }
};

async function hasIndex(queryInterface, tableName, indexName)
{
  const indexes = await queryInterface.showIndex(tableName);

  return indexes.some(index => index.name === indexName);
}
