'use strict';

module.exports = (sequelize, DataTypes) =>
{
  const PaymentMethod = sequelize.define('PaymentMethod', {
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'user_id'
    },
    customerId: {
      type: DataTypes.STRING(120),
      field: 'customer_id'
    },
    cardLast4: {
      type: DataTypes.STRING(4),
      allowNull: false,
      field: 'card_last4'
    },
    lastChargedAt: {
      type: DataTypes.DATE,
      field: 'last_charged_at'
    },
    nextChargedAt: {
      type: DataTypes.DATE,
      field: 'next_charged_at'
    },
    status: {
      type: DataTypes.ENUM('active', 'failed', 'replaced'),
      allowNull: false,
      defaultValue: 'active'
    }
  }, {
    tableName: 'payment_methods',
    underscored: true
  });

  PaymentMethod.associate = (models) =>
  {
    PaymentMethod.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return PaymentMethod;
};
