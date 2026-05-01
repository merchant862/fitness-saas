'use strict';

const { listAdminUsers } = require('../../services/adminService');

async function adminUsersExportController(req, res, next)
{
  try
  {
    const users = await listAdminUsers({
      search: String(req.query.search || '').trim().slice(0, 120),
      status: String(req.query.status || '').trim(),
      goal: String(req.query.goal || '').trim(),
      limit: 1000
    });

    const rows = [
      ['email', 'name', 'role', 'status', 'goal', 'level', 'environment', 'access_expires_at', 'onboarded_at', 'created_at'],
      ...users.map((user) =>
      {
        return [
          user.email,
          user.name || '',
          user.role,
          user.status,
          user.profile?.goal || '',
          user.profile?.level || '',
          user.profile?.environment || '',
          user.accessExpiresAt ? user.accessExpiresAt.toISOString() : '',
          user.onboardingCompletedAt ? user.onboardingCompletedAt.toISOString() : '',
          user.createdAt ? user.createdAt.toISOString() : ''
        ];
      })
    ];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="fitaccess-users-${new Date().toISOString().slice(0, 10)}.csv"`);

    return res.status(200).send(rows.map(toCsvRow).join('\n'));
  }
  catch (error)
  {
    next(error);
  }
}

function toCsvRow(row)
{
  return row.map((value) =>
  {
    const text = String(value ?? '');

    return `"${text.replace(/"/g, '""')}"`;
  }).join(',');
}

module.exports = adminUsersExportController;
