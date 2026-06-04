'use strict';

module.exports = (sequelize, DataTypes) =>
{
  const UserLoginSession = sequelize.define('UserLoginSession', {
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'user_id'
    },
    sessionTokenHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      field: 'session_token_hash'
    },
    revokedAt: {
      type: DataTypes.DATE,
      field: 'revoked_at'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at'
    },
    ipAddress: {
      type: DataTypes.STRING(64),
      field: 'ip_address'
    },
    userAgent: {
      type: DataTypes.STRING(255),
      field: 'user_agent'
    }
  }, {
    tableName: 'user_login_sessions',
    underscored: true
  });

  UserLoginSession.associate = (models) =>
  {
    UserLoginSession.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return UserLoginSession;
};
