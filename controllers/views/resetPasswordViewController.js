async function resetPasswordViewController(req, res, next)
{
    try
    {
        const resetPasswordData = {
            defaultValues: {
                email: req.query.email || '',
                resetCode: req.query.token || ''
            },
            message: req.query.sent ? 'Check your inbox for the reset link.' : null
        };

        return res.status(200).render('../views/reset-password.ejs', { resetPasswordData });
    }
    catch (error)
    {
        next(error);
    }
}

module.exports = resetPasswordViewController;
