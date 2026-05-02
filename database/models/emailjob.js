'use strict';

module.exports = (sequelize, DataTypes) =>
{
  const EmailJob = sequelize.define('EmailJob', {
    toEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'to_email'
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    html: {
      type: DataTypes.TEXT('long'),
      allowNull: false
    },
    text: {
      type: DataTypes.TEXT('long')
    },
    attachments: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'sent', 'failed'),
      allowNull: false,
      defaultValue: 'pending'
    },
    attempts: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    maxAttempts: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 5,
      field: 'max_attempts'
    },
    availableAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'available_at'
    },
    lockedAt: {
      type: DataTypes.DATE,
      field: 'locked_at'
    },
    sentAt: {
      type: DataTypes.DATE,
      field: 'sent_at'
    },
    lastError: {
      type: DataTypes.TEXT,
      field: 'last_error'
    }
  }, {
    tableName: 'email_jobs',
    underscored: true
  });

  return EmailJob;
};
