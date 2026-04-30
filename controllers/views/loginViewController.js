async function loginViewController(req, res, next)
{
    try
    {
        const message = req.query.passwordReset
            ? 'Password reset successfully. Sign in with your new password.'
            : (req.query.sent ? 'If your access is active, a secure sign-in link has been sent.' : null);
        const error = req.query.error || null;

        return res.status(200).render(`../views/login.ejs`, { message, error });
    }
    catch(error)
    {
        next(error);
    }
}

module.exports = loginViewController;
