'use strict';

module.exports = (sequelize, DataTypes) =>
{
  const PaymentTransaction = sequelize.define('PaymentTransaction', {
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'user_id'
    },
    type: {
      type: DataTypes.ENUM('upsell', 'renewal', 'card_update', 'card_verification'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('approved', 'declined', 'failed'),
      allowNull: false
    },
    customerId: {
      type: DataTypes.STRING(120),
      field: 'customer_id'
    },
    responseCrmOrderId: {
      type: DataTypes.STRING(120),
      field: 'response_crm_order_id'
    },
    responseCrmTransactionId: {
      type: DataTypes.STRING(120),
      field: 'response_crm_transaction_id'
    },
    idempotencyKey: {
      type: DataTypes.STRING(191),
      field: 'idempotency_key'
    },
    cardLast4: {
      type: DataTypes.STRING(4),
      field: 'card_last4'
    },
    chargedAt: {
      type: DataTypes.DATE,
      field: 'charged_at'
    },
    failureReason: {
      type: DataTypes.STRING(500),
      field: 'failure_reason'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  }, {
    tableName: 'payment_transactions',
    underscored: true
  });

  PaymentTransaction.associate = (models) =>
  {
    PaymentTransaction.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return PaymentTransaction;
};
