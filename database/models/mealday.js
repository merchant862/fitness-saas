'use strict';

module.exports = (sequelize, DataTypes) =>
{
  const MealDay = sequelize.define('MealDay', {
    mealPlanId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'meal_plan_id'
    },
    key: {
      type: DataTypes.STRING(140),
      allowNull: false,
      unique: true
    },
    weekNumber: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'week_number'
    },
    dayOfWeek: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'day_of_week'
    },
    dayLabel: {
      type: DataTypes.STRING(40),
      allowNull: false,
      field: 'day_label'
    },
    focus: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    meals: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    },
    shoppingList: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      field: 'shopping_list'
    }
  }, {
    tableName: 'meal_days',
    underscored: true
  });

  MealDay.associate = (models) =>
  {
    MealDay.belongsTo(models.MealPlan, { foreignKey: 'mealPlanId', as: 'plan' });
  };

  return MealDay;
};
