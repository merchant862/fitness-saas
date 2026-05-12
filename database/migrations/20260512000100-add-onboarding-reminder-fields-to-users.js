'use strict';

module.exports = {
  async up(queryInterface, Sequelize)
  {
    const table = await queryInterface.describeTable('users');

    if (!table.onboarding_reminders_sent)
    {
      await queryInterface.addColumn('users', 'onboarding_reminders_sent', {
        allowNull: false,
        type: Sequelize.INTEGER.UNSIGNED,
        defaultValue: 0
      });
    }

    if (!table.onboarding_last_reminded_at)
    {
      await queryInterface.addColumn('users', 'onboarding_last_reminded_at', {
        allowNull: true,
        type: Sequelize.DATE
      });
    }

    if (!table.onboarding_reminder_locked_at)
    {
      await queryInterface.addColumn('users', 'onboarding_reminder_locked_at', {
        allowNull: true,
        type: Sequelize.DATE
      });
    }

    await queryInterface.addIndex('users', [
      'role',
      'status',
      'onboarding_completed_at',
      'onboarding_reminders_sent',
      'onboarding_last_reminded_at',
      'created_at'
    ], {
      name: 'users_onboarding_reminder_due_idx'
    }).catch(() => {});

    await queryInterface.addIndex('users', ['onboarding_reminder_locked_at'], {
      name: 'users_onboarding_reminder_lock_idx'
    }).catch(() => {});

    await queryInterface.addIndex('payment_transactions', ['type', 'status', 'user_id'], {
      name: 'payment_transactions_type_status_user_idx'
    }).catch(() => {});
  },

  async down(queryInterface)
  {
    await queryInterface.removeIndex('payment_transactions', 'payment_transactions_type_status_user_idx').catch(() => {});
    await queryInterface.removeIndex('users', 'users_onboarding_reminder_lock_idx').catch(() => {});
    await queryInterface.removeIndex('users', 'users_onboarding_reminder_due_idx').catch(() => {});
    await queryInterface.removeColumn('users', 'onboarding_reminder_locked_at').catch(() => {});
    await queryInterface.removeColumn('users', 'onboarding_last_reminded_at').catch(() => {});
    await queryInterface.removeColumn('users', 'onboarding_reminders_sent').catch(() => {});
  }
};
