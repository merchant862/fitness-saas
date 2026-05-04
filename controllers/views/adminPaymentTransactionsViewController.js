'use strict';

const { listPaymentTransactions } = require('../../services/paymentTransactionService');

async function adminPaymentTransactionsViewController(req, res, next)
{
  try
  {
    const filters = normalizeFilters(req.query);
    const result = await listPaymentTransactions(filters);

    return res.status(200).render('../views/admin/payment-transactions.ejs', {
      adminData: {
        currentUser: req.user,
        transactions: result.transactions,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset
        },
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
    type: allowed(query.type, ['upsell', 'renewal', 'card_update', 'card_verification']),
    status: allowed(query.status, ['approved', 'declined', 'failed']),
    limit: Number(query.limit || 50),
    offset: Number(query.offset || 0)
  };
}

function allowed(value, options)
{
  const text = String(value || '').trim();
  return options.includes(text) ? text : '';
}

module.exports = adminPaymentTransactionsViewController;
