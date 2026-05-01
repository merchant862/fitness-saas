async function loginViewController(req, res, next)
{
    try
    {
        const message = null;
        const error = null;

        return res.status(200).render(`../views/login.ejs`, {
            message,
            error,
            pageTitle: 'FitAccess | Sign In',
            loginHeading: 'Member Sign-In',
            loginIntro: 'Use the email from checkout and your FitAccess password.',
            formAction: '/sign-in',
            forgotPasswordUrl: '/forgot-password',
            submitLabel: 'Sign In'
        });
    }
    catch(error)
    {
        next(error);
    }
}

module.exports = loginViewController;
