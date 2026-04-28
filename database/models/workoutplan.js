'use strict';

module.exports = (sequelize, DataTypes) =>
{
  const WorkoutPlan = sequelize.define('WorkoutPlan', {
    key: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true
    },
    goal: {
      type: DataTypes.ENUM('weight_loss', 'muscle_gain', 'general_fitness'),
      allowNull: false
    },
    level: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
      allowNull: false
    },
    environment: {
      type: DataTypes.ENUM('home', 'gym'),
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
      defaultValue: 12,
      field: 'duration_weeks'
    },
    sessionsPerWeek: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 4,
      field: 'sessions_per_week'
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
    tableName: 'workout_plans',
    underscored: true
  });

  WorkoutPlan.associate = (models) =>
  {
    WorkoutPlan.hasMany(models.WorkoutSession, { foreignKey: 'workoutPlanId', as: 'sessions' });
  };

  return WorkoutPlan;
};
