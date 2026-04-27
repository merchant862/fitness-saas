'use strict';

const { sendResendEmail } = require('../../apis/resendApi');
const { createAccessCode } = require('../../services/authService');
const { extendAccessCode, listAccessCodes, revokeAccessCode } = require('../../services/accessCodeService');
const { isEmail } = require('../../utils/securityUtils');
const { accessCodeEmail } = require('../../utils/emailTemplateUtils');

async function index(req, res, next)
{
  try
  {
    const codes = await listAccessCodes(req.query.limit);
    return res.status(200).json({ accessCodes: codes });
  }
  catch (error)
  {
    next(error);
  }
}

async function create(req, res, next)
{
  try
  {
    const { email, days, source, sendEmail } = req.body;

    if (!isEmail(email))
    {
      return res.status(422).json({ error: 'Valid email is required' });
    }

    const result = await createAccessCode({
      email,
      days: Number(days || process.env.DEFAULT_ACCESS_DAYS || 30),
      source: source || 'manual'
    });

    if (sendEmail)
    {
      await sendResendEmail(accessCodeEmail({
        email: result.accessCode.email,
        code: result.plainCode,
        expiresAt: result.accessCode.expiresAt
      }));
    }

    return res.status(201).json({
      accessCode: result.accessCode,
      plainCode: result.plainCode
    });
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
      return res.status(404).json({ error: 'Access code not found' });
    }
    return res.status(200).json({ accessCode: code });
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
      return res.status(404).json({ error: 'Access code not found' });
    }
    return res.status(200).json({ accessCode: code });
  }
  catch (error)
  {
    next(error);
  }
}

module.exports = {
  create,
  extend,
  index,
  revoke
};
