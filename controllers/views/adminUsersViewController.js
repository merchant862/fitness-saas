'use strict';

const { listAdminUsers } = require('../../services/adminService');

async function adminUsersViewController(req, res, next)
{
  try
  {
    const filters = normalizeFilters(req.query);
    const users = await listAdminUsers(filters);

    return res.status(200).render('../views/admin/users.ejs', {
      adminData: {
        currentUser: req.user,
        users,
        filters
      }
    });
  }
  catch (error)
  {
    next(error);
  }
}

function normalizeFilters(query)
{
  return {
    search: String(query.search || '').trim().slice(0, 120),
    status: allowed(query.status, ['active', 'pending', 'suspended']),
    goal: allowed(query.goal, ['weight_loss', 'muscle_gain', 'general_fitness']),
    limit: Number(query.limit || 25)
  };
}

function allowed(value, options)
{
  const text = String(value || '').trim();

  return options.includes(text) ? text : '';
}

module.exports = adminUsersViewController;
