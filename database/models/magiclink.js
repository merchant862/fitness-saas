'use strict';

module.exports = (sequelize, DataTypes) =>
{
  const MagicLink = sequelize.define('MagicLink', {
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
    },
    userAgent: {
      type: DataTypes.STRING(255),
      field: 'user_agent'
    }
  }, {
    tableName: 'magic_links',
    underscored: true
  });

  MagicLink.associate = (models) =>
  {
    MagicLink.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return MagicLink;
};
