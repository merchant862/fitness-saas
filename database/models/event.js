'use strict';

module.exports = (sequelize, DataTypes) =>
{
  const Event = sequelize.define('Event', {
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      field: 'user_id'
    },
    eventType: {
      type: DataTypes.STRING(80),
      allowNull: false,
      field: 'event_type'
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    },
    ipAddress: {
      type: DataTypes.STRING(64),
      field: 'ip_address'
    },
    userAgent: {
      type: DataTypes.STRING(512),
      field: 'user_agent'
    }
  }, {
    tableName: 'events',
    underscored: true
  });

  Event.associate = (models) =>
  {
    Event.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return Event;
};
