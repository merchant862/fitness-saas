async function forgotPasswordViewController(req, res, next)
{
    try
    {
        const forgotPasswordData = {
            defaultValues: {
                email: 'saif@example.com'
            }
        };

        return res.status(200).render('../views/forgot-password.ejs', { forgotPasswordData });
    }
    catch (error)
    {
        next(error);
    }
}

module.exports = forgotPasswordViewController;