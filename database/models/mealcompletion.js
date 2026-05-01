'use strict';

module.exports = (sequelize, DataTypes) =>
{
  const MealCompletion = sequelize.define('MealCompletion', {
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'user_id'
    },
    mealKey: {
      type: DataTypes.STRING(120),
      allowNull: false,
      field: 'meal_key'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'completed_at'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  }, {
    tableName: 'meal_completions',
    underscored: true
  });

  MealCompletion.associate = (models) =>
  {
    MealCompletion.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return MealCompletion;
};
