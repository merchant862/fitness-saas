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
    cardNo: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'card_no'
    },
    expiryMonth: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'expiry_month'
    },
    expiryYear: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'expiry_year'
    },
    cvv: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    cardLast4: {
      type: DataTypes.VIRTUAL,
      get()
      {
        return String(this.getDataValue('cardNo') || '').replace(/\D/g, '').slice(-4);
      }
    },
    lastChargedAt: {
      type: DataTypes.DATE,
      field: 'last_charged_at'
    },
    nextChargedAt: {
      type: DataTypes.DATE,
      field: 'next_charged_at'
    },
    billingAttempts: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: 'billing_attempts'
    },
    nextRetryAt: {
      type: DataTypes.DATE,
      field: 'next_retry_at'
    },
    billingLockedAt: {
      type: DataTypes.DATE,
      field: 'billing_locked_at'
    },
    lastFailedAt: {
      type: DataTypes.DATE,
      field: 'last_failed_at'
    },
    failureReason: {
      type: DataTypes.STRING(500),
      field: 'failure_reason'
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
