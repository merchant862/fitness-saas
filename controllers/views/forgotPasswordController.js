async function forgotPasswordViewController(req, res, next)
{
    try
    {
        const forgotPasswordData = {
            defaultValues: {
                email: req.query.email || ''
            },
            message: req.query.sent ? 'If that email exists, a reset link has been sent.' : null
        };

        return res.status(200).render('../views/forgot-password.ejs', { forgotPasswordData });
    }
    catch (error)
    {
        next(error);
    }
}

module.exports = forgotPasswordViewController;
