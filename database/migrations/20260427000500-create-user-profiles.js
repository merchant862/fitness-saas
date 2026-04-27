'use strict';

module.exports = {
  async up(queryInterface, Sequelize)
  {
    await queryInterface.createTable('user_profiles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED
      },
      user_id: {
        allowNull: false,
        unique: true,
        type: Sequelize.INTEGER.UNSIGNED,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      goal: {
        allowNull: true,
        type: Sequelize.ENUM('weight_loss', 'muscle_gain', 'general_fitness')
      },
      level: {
        allowNull: true,
        type: Sequelize.ENUM('beginner', 'intermediate', 'advanced')
      },
      environment: {
        allowNull: true,
        type: Sequelize.ENUM('home', 'gym')
      },
      current_weight: {
        allowNull: true,
        type: Sequelize.DECIMAL(6, 2)
      },
      target_weight: {
        allowNull: true,
        type: Sequelize.DECIMAL(6, 2)
      },
      workout_days: {
        allowNull: true,
        type: Sequelize.INTEGER.UNSIGNED
      },
      preferences: {
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
  },

  async down(queryInterface)
  {
    await queryInterface.dropTable('user_profiles');
  }
};
