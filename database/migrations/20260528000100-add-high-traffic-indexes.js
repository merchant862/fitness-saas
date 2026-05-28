'use strict';

const INDEXES = [
  {
    table: 'users',
    name: 'users_role_status_created_idx',
    fields: ['role', 'status', 'created_at']
  },
  {
    table: 'users',
    name: 'users_role_onboarded_created_idx',
    fields: ['role', 'onboarding_completed_at', 'created_at']
  },
  {
    table: 'access_codes',
    name: 'access_codes_status_created_idx',
    fields: ['status', 'created_at']
  },
  {
    table: 'access_codes',
    name: 'access_codes_created_idx',
    fields: ['created_at']
  },
  {
    table: 'events',
    name: 'events_user_created_idx',
    fields: ['user_id', 'created_at']
  },
  {
    table: 'events',
    name: 'events_user_event_created_idx',
    fields: ['user_id', 'event_type', 'created_at']
  },
  {
    table: 'email_jobs',
    name: 'email_jobs_status_locked_idx',
    fields: ['status', 'locked_at']
  },
  {
    table: 'payment_methods',
    name: 'payment_methods_user_status_created_idx',
    fields: ['user_id', 'status', 'created_at']
  },
  {
    table: 'payment_methods',
    name: 'payment_methods_user_created_idx',
    fields: ['user_id', 'created_at']
  },
  {
    table: 'payment_methods',
    name: 'payment_methods_due_order_idx',
    fields: ['status', 'next_charged_at', 'id']
  },
  {
    table: 'payment_transactions',
    name: 'payment_transactions_type_status_created_idx',
    fields: ['type', 'status', 'created_at']
  },
  {
    table: 'payment_transactions',
    name: 'payment_transactions_status_created_idx',
    fields: ['status', 'created_at']
  },
  {
    table: 'payment_transactions',
    name: 'payment_transactions_method_status_created_idx',
    fields: ['payment_method_id', 'status', 'created_at']
  },
  {
    table: 'payment_transactions',
    name: 'payment_transactions_created_idx',
    fields: ['created_at']
  },
  {
    table: 'workout_completions',
    name: 'workout_completions_user_workout_idx',
    fields: ['user_id', 'workout_key']
  },
  {
    table: 'user_profiles',
    name: 'user_profiles_goal_user_idx',
    fields: ['goal', 'user_id']
  }
];

module.exports = {
  async up(queryInterface)
  {
    for (const index of INDEXES)
    {
      if (await tableExists(queryInterface, index.table))
      {
        await queryInterface.addIndex(index.table, index.fields, { name: index.name }).catch(() => {});
      }
    }
  },

  async down(queryInterface)
  {
    for (const index of [...INDEXES].reverse())
    {
      await queryInterface.removeIndex(index.table, index.name).catch(() => {});
    }
  }
};

async function tableExists(queryInterface, tableName)
{
  const tables = await queryInterface.showAllTables();
  return tables.map(normalizeTableName).includes(tableName);
}

function normalizeTableName(table)
{
  if (typeof table === 'string')
  {
    return table;
  }

  return table.tableName || table.table_name || String(table);
}
