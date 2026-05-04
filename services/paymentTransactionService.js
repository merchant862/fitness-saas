'use strict';

const { Op } = require('sequelize');
const { PaymentTransaction, User } = require('../database/models');
const { sanitizeMetadata } = require('./paymentService');

async function logPaymentTransaction(data)
{
  try
  {
    return await PaymentTransaction.create({
      userId: data.userId,
      paymentMethodId: data.paymentMethodId || null,
      type: data.type,
      status: data.status,
      customerId: data.customerId || null,
      responseCrmOrderId: data.responseCrmOrderId || null,
      responseCrmTransactionId: data.responseCrmTransactionId || null,
      idempotencyKey: data.idempotencyKey || null,
      cardLast4: data.cardLast4 || null,
      chargedAt: data.chargedAt || null,
      nextChargedAt: data.nextChargedAt || null,
      failureReason: data.failureReason ? String(data.failureReason).slice(0, 500) : null,
      metadata: sanitizeMetadata(data.metadata || {})
    });
  }
  catch (error)
  {
    console.error('payment_transaction_log_failed', error.message);
    return null;
  }
}

async function listPaymentTransactions(filters = {})
{
  const where = {};
  const userWhere = {};
  const limit = Math.min(Math.max(Number(filters.limit || 50), 1), 100);
  const offset = Math.max(Number(filters.offset || 0), 0);

  if (['upsell', 'renewal', 'card_update', 'card_verification'].includes(filters.type))
  {
    where.type = filters.type;
  }

  if (['approved', 'declined', 'failed'].includes(filters.status))
  {
    where.status = filters.status;
  }

  if (filters.search)
  {
    const value = String(filters.search).trim();
    userWhere.email = { [Op.like]: `${value.toLowerCase()}%` };
  }

  const include = [{
    model: User,
    as: 'user',
    attributes: ['id', 'email', 'name'],
    where: userWhere,
    required: Boolean(filters.search)
  }];

  const { rows, count } = await PaymentTransaction.findAndCountAll({
    where,
    include,
    distinct: true,
    order: [['createdAt', 'DESC']],
    limit,
    offset
  });

  return {
    transactions: rows.map(formatPaymentTransaction),
    total: count,
    limit,
    offset
  };
}

function formatPaymentTransaction(transaction)
{
  const plain = transaction.get ? transaction.get({ plain: true }) : transaction;

  return {
    ...plain,
    typeLabel: transactionTypeLabel(plain.type),
    statusLabel: statusLabel(plain.status),
    chargedAtLabel: formatDateTime(plain.chargedAt || plain.createdAt),
    nextChargedAtLabel: plain.nextChargedAt ? formatDateTime(plain.nextChargedAt) : '-'
  };
}

function transactionTypeLabel(type)
{
  const labels = {
    upsell: 'Initial membership',
    renewal: 'Monthly renewal',
    card_update: 'Card update charge',
    card_verification: 'Card verification'
  };

  return labels[type] || type || '-';
}

function statusLabel(status)
{
  const labels = {
    approved: 'Approved',
    declined: 'Declined',
    failed: 'Failed'
  };

  return labels[status] || status || '-';
}

function formatDateTime(value)
{
  if (!value)
  {
    return '-';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime()))
  {
    return '-';
  }

  return `${date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  })}, ${date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })}`;
}

module.exports = {
  listPaymentTransactions,
  logPaymentTransaction
};
