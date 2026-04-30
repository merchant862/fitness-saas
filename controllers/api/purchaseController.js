'use strict';

const { sendResendEmail } = require('../../apis/resendApi');
const { createPurchaseAccessLink } = require('../../services/authService');
const { trackEvent } = require('../../services/eventService');
const { chargeUpsellOrder, sanitizeMetadata, savePaymentMethod } = require('../../services/paymentService');
const { isEmail } = require('../../utils/securityUtils');
const { magicLinkEmail } = require('../../utils/emailTemplateUtils');

async function grantUpsellAccess(req, res, next)
{
  try
  {
    if (process.env.UPSELL_WEBHOOK_TOKEN && req.headers['x-webhook-token'] !== process.env.UPSELL_WEBHOOK_TOKEN)
    {
      return res.status(401).json({ error: 'Invalid webhook token' });
    }

    const email = req.body.email;

    if (!isEmail(email))
    {
      return res.status(422).json({ error: 'Valid customer email is required' });
    }

    const paymentResult = await chargeUpsellOrder(req.body);

    const result = await createPurchaseAccessLink(req, {
      email,
      days: Number(req.body.accessDays || process.env.DEFAULT_ACCESS_DAYS || 30),
      source: 'upsell',
      metadata: {
        productId: req.body.productId || null,
        orderId: req.body.orderId || null,
        funnelId: req.body.funnelId || null,
        amount: req.body.amount || null,
        currency: req.body.currency || null,
        responseCrmCustomerId: paymentResult.crmResult.customerId || null,
        responseCrmOrderId: paymentResult.crmResult.orderId || null,
        responseCrmTransactionId: paymentResult.crmResult.transactionId || null
      }
    });

    await savePaymentMethod(result.user.id, {
      cardLast4: paymentResult.cardLast4,
      externalCustomerId: paymentResult.crmResult.customerId,
      externalOrderId: paymentResult.crmResult.orderId,
      externalTransactionId: paymentResult.crmResult.transactionId,
      lastChargedAt: paymentResult.chargedAt,
      nextChargeAt: paymentResult.nextChargeAt,
      metadata: {
        source: 'upsell_purchase',
        orderId: req.body.orderId || null
      }
    });

    await sendResendEmail(magicLinkEmail({
      email: result.email,
      token: result.token
    }));

    await trackEvent(req, 'upsell_purchase_access_granted', {
      productId: req.body.productId || null,
      orderId: req.body.orderId || null,
      accessExpiresAt: result.accessExpiresAt,
      payment: sanitizeMetadata({
        responseCrmOrderId: paymentResult.crmResult.orderId,
        responseCrmTransactionId: paymentResult.crmResult.transactionId,
        cardLast4: paymentResult.cardLast4,
        chargedAt: paymentResult.chargedAt,
        nextChargeAt: paymentResult.nextChargeAt
      })
    }, result.user.id);

    return res.status(202).json({
      message: 'FitAccess membership email queued.',
      email: result.email,
      accessExpiresAt: result.accessExpiresAt,
      payment: {
        cardLast4: paymentResult.cardLast4,
        chargedAt: paymentResult.chargedAt,
        nextChargeAt: paymentResult.nextChargeAt
      }
    });
  }
  catch (error)
  {
    next(error);
  }
}

module.exports = {
  grantUpsellAccess
};
