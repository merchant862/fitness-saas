'use strict';

module.exports = (sequelize, DataTypes) =>
{
  const UserSession = sequelize.define('UserSession', {
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'user_id'
    },
    jwtId: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      field: 'jwt_id'
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
    tableName: 'user_sessions',
    underscored: true
  });

  UserSession.associate = (models) =>
  {
    UserSession.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return UserSession;
};
