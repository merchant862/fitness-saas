'use strict';

module.exports = {
  async up(queryInterface, Sequelize)
  {
    await queryInterface.createTable('workout_plans', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED
      },
      key: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING(120)
      },
      goal: {
        allowNull: false,
        type: Sequelize.ENUM('weight_loss', 'muscle_gain', 'general_fitness')
      },
      level: {
        allowNull: false,
        type: Sequelize.ENUM('beginner', 'intermediate', 'advanced')
      },
      environment: {
        allowNull: false,
        type: Sequelize.ENUM('home', 'gym')
      },
      title: {
        allowNull: false,
        type: Sequelize.STRING(160)
      },
      description: {
        allowNull: true,
        type: Sequelize.TEXT
      },
      duration_weeks: {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED,
        defaultValue: 12
      },
      sessions_per_week: {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED,
        defaultValue: 4
      },
      tips: {
        allowNull: false,
        type: Sequelize.JSON,
        defaultValue: []
      },
      is_active: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    await queryInterface.createTable('workout_sessions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED
      },
      workout_plan_id: {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED,
        references: { model: 'workout_plans', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      key: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING(140)
      },
      week_number: {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED
      },
      day_of_week: {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED
      },
      day_label: {
        allowNull: false,
        type: Sequelize.STRING(40)
      },
      title: {
        allowNull: false,
        type: Sequelize.STRING(160)
      },
      duration_minutes: {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED
      },
      calories: {
        allowNull: true,
        type: Sequelize.INTEGER.UNSIGNED
      },
      focus: {
        allowNull: false,
        type: Sequelize.STRING(120)
      },
      exercises: {
        allowNull: false,
        type: Sequelize.JSON,
        defaultValue: []
      },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    await queryInterface.createTable('meal_plans', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED
      },
      key: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING(120)
      },
      goal: {
        allowNull: false,
        type: Sequelize.ENUM('weight_loss', 'muscle_gain', 'general_fitness')
      },
      title: {
        allowNull: false,
        type: Sequelize.STRING(160)
      },
      description: {
        allowNull: true,
        type: Sequelize.TEXT
      },
      duration_weeks: {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED,
        defaultValue: 4
      },
      daily_calories: {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED
      },
      macros: {
        allowNull: false,
        type: Sequelize.JSON,
        defaultValue: {}
      },
      tips: {
        allowNull: false,
        type: Sequelize.JSON,
        defaultValue: []
      },
      is_active: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    await queryInterface.createTable('meal_days', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED
      },
      meal_plan_id: {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED,
        references: { model: 'meal_plans', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      key: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING(140)
      },
      week_number: {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED
      },
      day_of_week: {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED
      },
      day_label: {
        allowNull: false,
        type: Sequelize.STRING(40)
      },
      focus: {
        allowNull: false,
        type: Sequelize.STRING(120)
      },
      meals: {
        allowNull: false,
        type: Sequelize.JSON,
        defaultValue: {}
      },
      shopping_list: {
        allowNull: false,
        type: Sequelize.JSON,
        defaultValue: []
      },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    await queryInterface.addIndex('workout_plans', ['goal', 'level', 'environment']);
    await queryInterface.addIndex('workout_sessions', ['workout_plan_id', 'week_number', 'day_of_week']);
    await queryInterface.addIndex('meal_plans', ['goal']);
    await queryInterface.addIndex('meal_days', ['meal_plan_id', 'week_number', 'day_of_week']);
  },

  async down(queryInterface)
  {
    await queryInterface.dropTable('meal_days');
    await queryInterface.dropTable('meal_plans');
    await queryInterface.dropTable('workout_sessions');
    await queryInterface.dropTable('workout_plans');
  }
};
