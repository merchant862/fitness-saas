async function resetPasswordViewController(req, res, next)
{
    try
    {
        const resetPasswordData = {
            defaultValues: {
                email: 'saif@example.com',
                resetCode: 'RESET-2026'
            }
        };

        return res.status(200).render('../views/reset-password.ejs', { resetPasswordData });
    }
    catch (error)
    {
        next(error);
    }
}

module.exports = resetPasswordViewController;