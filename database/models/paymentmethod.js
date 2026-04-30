'use strict';

module.exports = (sequelize, DataTypes) =>
{
  const PaymentMethod = sequelize.define('PaymentMethod', {
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'user_id'
    },
    provider: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'responsecrm'
    },
    externalCustomerId: {
      type: DataTypes.STRING(120),
      field: 'external_customer_id'
    },
    externalOrderId: {
      type: DataTypes.STRING(120),
      field: 'external_order_id'
    },
    externalTransactionId: {
      type: DataTypes.STRING(120),
      field: 'external_transaction_id'
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
    nextChargeAt: {
      type: DataTypes.DATE,
      field: 'next_charge_at'
    },
    status: {
      type: DataTypes.ENUM('active', 'failed', 'replaced'),
      allowNull: false,
      defaultValue: 'active'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
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
