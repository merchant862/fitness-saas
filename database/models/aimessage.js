'use strict';

module.exports = (sequelize, DataTypes) =>
{
  const AiMessage = sequelize.define('AiMessage', {
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'user_id'
    },
    role: {
      type: DataTypes.ENUM('user', 'assistant'),
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  }, {
    tableName: 'ai_messages',
    underscored: true
  });

  AiMessage.associate = (models) =>
  {
    AiMessage.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return AiMessage;
};
