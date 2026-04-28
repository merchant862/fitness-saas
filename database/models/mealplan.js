'use strict';

module.exports = (sequelize, DataTypes) =>
{
  const MealPlan = sequelize.define('MealPlan', {
    key: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true
    },
    goal: {
      type: DataTypes.ENUM('weight_loss', 'muscle_gain', 'general_fitness'),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    description: DataTypes.TEXT,
    durationWeeks: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 4,
      field: 'duration_weeks'
    },
    dailyCalories: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'daily_calories'
    },
    macros: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    },
    tips: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'meal_plans',
    underscored: true
  });

  MealPlan.associate = (models) =>
  {
    MealPlan.hasMany(models.MealDay, { foreignKey: 'mealPlanId', as: 'days' });
  };

  return MealPlan;
};
