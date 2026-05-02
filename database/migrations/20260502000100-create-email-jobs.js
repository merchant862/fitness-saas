'use strict';

module.exports = {
  async up(queryInterface, Sequelize)
  {
    await queryInterface.createTable('email_jobs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED
      },
      to_email: {
        allowNull: false,
        type: Sequelize.STRING(255)
      },
      subject: {
        allowNull: false,
        type: Sequelize.STRING(255)
      },
      html: {
        allowNull: false,
        type: Sequelize.TEXT('long')
      },
      text: {
        allowNull: true,
        type: Sequelize.TEXT('long')
      },
      attachments: {
        allowNull: false,
        type: Sequelize.JSON,
        defaultValue: []
      },
      status: {
        allowNull: false,
        type: Sequelize.ENUM('pending', 'processing', 'sent', 'failed'),
        defaultValue: 'pending'
      },
      attempts: {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED,
        defaultValue: 0
      },
      max_attempts: {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED,
        defaultValue: 5
      },
      available_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      locked_at: {
        allowNull: true,
        type: Sequelize.DATE
      },
      sent_at: {
        allowNull: true,
        type: Sequelize.DATE
      },
      last_error: {
        allowNull: true,
        type: Sequelize.TEXT
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('email_jobs', ['status', 'available_at']);
    await queryInterface.addIndex('email_jobs', ['to_email']);
  },

  async down(queryInterface)
  {
    await queryInterface.dropTable('email_jobs');
  }
};
