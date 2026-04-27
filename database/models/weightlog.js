'use strict';

module.exports = (sequelize, DataTypes) =>
{
  const WeightLog = sequelize.define('WeightLog', {
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'user_id'
    },
    weight: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false
    },
    loggedAt: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'logged_at'
    }
  }, {
    tableName: 'weight_logs',
    underscored: true
  });

  WeightLog.associate = (models) =>
  {
    WeightLog.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return WeightLog;
};
