async function loginViewController(req, res, next)
{
    try
    {
        return renderMemberLogin(res);
    }
    catch(error)
    {
        next(error);
    }
}

function renderMemberLogin(res, options = {})
{
    return res.status(options.status || 200).render(`../views/login.ejs`, {
        message: options.message || null,
        error: options.error || null,
        pageTitle: 'FitAccess | Sign In',
        loginHeading: 'Member Sign-In',
        loginIntro: 'Use the email from checkout and your FitAccess password.',
        formAction: '/sign-in',
        forgotPasswordUrl: '/forgot-password',
        submitLabel: 'Sign In'
    });
}

module.exports = loginViewController;
module.exports.renderMemberLogin = renderMemberLogin;
