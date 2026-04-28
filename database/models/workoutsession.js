'use strict';

module.exports = (sequelize, DataTypes) =>
{
  const WorkoutSession = sequelize.define('WorkoutSession', {
    workoutPlanId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'workout_plan_id'
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
    title: {
      type: DataTypes.STRING(160),
      allowNull: false
    },
    durationMinutes: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'duration_minutes'
    },
    calories: DataTypes.INTEGER.UNSIGNED,
    focus: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    exercises: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    }
  }, {
    tableName: 'workout_sessions',
    underscored: true
  });

  WorkoutSession.associate = (models) =>
  {
    WorkoutSession.belongsTo(models.WorkoutPlan, { foreignKey: 'workoutPlanId', as: 'plan' });
  };

  return WorkoutSession;
};
