'use strict';

module.exports = {
  async up(queryInterface, Sequelize)
  {
    await queryInterface.createTable('weight_logs', {
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
      weight: {
        allowNull: false,
        type: Sequelize.DECIMAL(6, 2)
      },
      logged_at: {
        allowNull: false,
        type: Sequelize.DATEONLY
      },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    await queryInterface.createTable('workout_completions', {
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
      workout_key: {
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

    await queryInterface.addIndex('weight_logs', ['user_id', 'logged_at'], { unique: true });
    await queryInterface.addIndex('workout_completions', ['user_id', 'completed_at']);
  },

  async down(queryInterface)
  {
    await queryInterface.dropTable('workout_completions');
    await queryInterface.dropTable('weight_logs');
  }
};
