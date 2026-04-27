'use strict';

module.exports = (sequelize, DataTypes) =>
{
  const AccessCode = sequelize.define('AccessCode', {
    codeHash: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
      field: 'code_hash'
    },
    email: {
      type: DataTypes.STRING(191),
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      field: 'user_id'
    },
    status: {
      type: DataTypes.ENUM('unused', 'redeemed', 'expired', 'revoked'),
      allowNull: false,
      defaultValue: 'unused'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at'
    },
    redeemedAt: {
      type: DataTypes.DATE,
      field: 'redeemed_at'
    },
    source: {
      type: DataTypes.STRING(80),
      allowNull: false,
      defaultValue: 'manual'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  }, {
    tableName: 'access_codes',
    underscored: true
  });

  AccessCode.associate = (models) =>
  {
    AccessCode.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return AccessCode;
};
