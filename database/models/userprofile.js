'use strict';

module.exports = (sequelize, DataTypes) =>
{
  const UserProfile = sequelize.define('UserProfile', {
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
      field: 'user_id'
    },
    goal: DataTypes.ENUM('weight_loss', 'muscle_gain', 'general_fitness'),
    level: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
    environment: DataTypes.ENUM('home', 'gym'),
    currentWeight: {
      type: DataTypes.DECIMAL(6, 2),
      field: 'current_weight'
    },
    targetWeight: {
      type: DataTypes.DECIMAL(6, 2),
      field: 'target_weight'
    },
    workoutDays: {
      type: DataTypes.INTEGER.UNSIGNED,
      field: 'workout_days'
    },
    preferences: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  }, {
    tableName: 'user_profiles',
    underscored: true
  });

  UserProfile.associate = (models) =>
  {
    UserProfile.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return UserProfile;
};
