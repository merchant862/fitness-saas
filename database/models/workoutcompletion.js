'use strict';

module.exports = (sequelize, DataTypes) =>
{
  const WorkoutCompletion = sequelize.define('WorkoutCompletion', {
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'user_id'
    },
    workoutKey: {
      type: DataTypes.STRING(120),
      allowNull: false,
      field: 'workout_key'
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
    tableName: 'workout_completions',
    underscored: true
  });

  WorkoutCompletion.associate = (models) =>
  {
    WorkoutCompletion.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return WorkoutCompletion;
};
