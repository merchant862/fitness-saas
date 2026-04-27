'use strict';

const { sendResendEmail } = require('../../apis/resendApi');
const { createAccessCode } = require('../../services/authService');
const { extendAccessCode, revokeAccessCode } = require('../../services/accessCodeService');
const { isEmail } = require('../../utils/securityUtils');
const { accessCodeEmail } = require('../../utils/emailTemplateUtils');

async function create(req, res, next)
{
  try
  {
    const { email, days, sendEmail } = req.body;

    if (!isEmail(email))
    {
      return res.status(422).send('Valid email is required');
    }

    const result = await createAccessCode({
      email,
      days: Number(days || process.env.DEFAULT_ACCESS_DAYS || 30),
      source: 'admin'
    });

    if (sendEmail === 'on')
    {
      await sendResendEmail(accessCodeEmail({
        email: result.accessCode.email,
        code: result.plainCode,
        expiresAt: result.accessCode.expiresAt
      }));
    }

    return res.redirect('/admin/access-codes?created=1');
  }
  catch (error)
  {
    next(error);
  }
}

async function revoke(req, res, next)
{
  try
  {
    const code = await revokeAccessCode(req.params.id);

    if (!code)
    {
      return res.status(404).send('Access code not found');
    }
    return res.redirect('/admin/access-codes');
  }
  catch (error)
  {
    next(error);
  }
}

async function extend(req, res, next)
{
  try
  {
    const code = await extendAccessCode(req.params.id, req.body.days || 30);

    if (!code)
    {
      return res.status(404).send('Access code not found');
    }
    return res.redirect('/admin/access-codes');
  }
  catch (error)
  {
    next(error);
  }
}

module.exports = {
  create,
  extend,
  revoke
};
