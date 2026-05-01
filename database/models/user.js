'use strict';

module.exports = (sequelize, DataTypes) =>
{
  const User = sequelize.define('User', {
    email: {
      type: DataTypes.STRING(191),
      allowNull: false,
      unique: true
    },
    name: DataTypes.STRING(120),
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      allowNull: false,
      defaultValue: 'user'
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'suspended'),
      allowNull: false,
      defaultValue: 'pending'
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      field: 'password_hash'
    },
    accessExpiresAt: {
      type: DataTypes.DATE,
      field: 'access_expires_at'
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      field: 'last_login_at'
    },
    onboardingCompletedAt: {
      type: DataTypes.DATE,
      field: 'onboarding_completed_at'
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  }, {
    tableName: 'users',
    underscored: true
  });

  User.associate = (models) =>
  {
    User.hasOne(models.UserProfile, { foreignKey: 'userId', as: 'profile' });
    User.hasMany(models.AccessCode, { foreignKey: 'userId', as: 'accessCodes' });
    User.hasMany(models.PasswordResetToken, { foreignKey: 'userId', as: 'passwordResetTokens' });
    User.hasMany(models.WeightLog, { foreignKey: 'userId', as: 'weightLogs' });
    User.hasMany(models.WorkoutCompletion, { foreignKey: 'userId', as: 'workoutCompletions' });
    User.hasMany(models.MealCompletion, { foreignKey: 'userId', as: 'mealCompletions' });
    User.hasMany(models.Event, { foreignKey: 'userId', as: 'events' });
    User.hasMany(models.AiMessage, { foreignKey: 'userId', as: 'aiMessages' });
    User.hasMany(models.PaymentMethod, { foreignKey: 'userId', as: 'paymentMethods' });
  };

  return User;
};
