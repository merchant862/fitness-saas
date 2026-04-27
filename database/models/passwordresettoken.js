'use strict';

module.exports = (sequelize, DataTypes) =>
{
  const PasswordResetToken = sequelize.define('PasswordResetToken', {
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'user_id'
    },
    tokenHash: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
      field: 'token_hash'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at'
    },
    usedAt: {
      type: DataTypes.DATE,
      field: 'used_at'
    },
    requestIp: {
      type: DataTypes.STRING(64),
      field: 'request_ip'
    }
  }, {
    tableName: 'password_reset_tokens',
    underscored: true
  });

  PasswordResetToken.associate = (models) =>
  {
    PasswordResetToken.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return PasswordResetToken;
};
