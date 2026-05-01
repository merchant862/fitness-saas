'use strict';

const { adminRoute } = require('../../utils/adminPaths');

async function adminLoginViewController(req, res, next)
{
  try
  {
    if (req.user?.role === 'admin')
    {
      return res.redirect(adminRoute());
    }

    return renderAdminLogin(res);
  }
  catch (error)
  {
    next(error);
  }
}

function renderAdminLogin(res, options = {})
{
  return res.status(options.status || 200).render('../views/login.ejs', {
    message: options.message || null,
    error: options.error || null,
    pageTitle: 'FitAccess | Admin Sign In',
    loginHeading: 'Admin Sign-In',
    loginIntro: 'Use your administrator email and password to continue.',
    formAction: adminRoute('/sign-in'),
    forgotPasswordUrl: null,
    submitLabel: 'Sign In'
  });
}

module.exports = adminLoginViewController;
module.exports.renderAdminLogin = renderAdminLogin;
