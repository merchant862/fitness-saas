async function loginViewController(req, res, next)
{
    try
    {
        const message = req.query.passwordReset
            ? 'Password reset successfully. You can request a secure sign-in link now.'
            : (req.query.sent ? 'If your access is active, a secure sign-in link has been sent.' : null);

        return res.status(200).render(`../views/login.ejs`, { message });
    }
    catch(error)
    {
        next(error);
    }
}

module.exports = loginViewController;
