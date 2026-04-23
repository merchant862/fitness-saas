async function changePasswordViewController(req, res, next)
{
    try
    {
        const changePasswordData = {
            currentUser: {
                name: 'Saboor',
                email: 'saboor@example.com',
                goal: 'Weight Loss'
            },

            note: 'Use a strong password that you have not used before.'
        };

        return res.status(200).render('../views/change-password.ejs', { changePasswordData });
    }
    catch (error)
    {
        next(error);
    }
}

module.exports = changePasswordViewController;