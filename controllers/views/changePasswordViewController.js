async function changePasswordViewController(req, res, next)
{
    try
    {
        const changePasswordData = {
            currentUser: {
                name: req.user?.name || req.user?.email || 'Member',
                email: req.user?.email,
                goal: req.user?.role === 'admin' ? 'Admin Panel' : (req.user?.profile?.goal || 'Fitness Plan'),
                role: req.user?.role
            },

            hasPassword: Boolean(req.user?.passwordHash),
            note: req.user?.passwordHash
                ? 'Use a strong password that you have not used before.'
                : 'No password is set yet. Leave current password empty and create a new one.',
            returnTo: req.query.setup ? '/dashboard' : '/change-password',
            message: null
        };

        return res.status(200).render('../views/change-password.ejs', { changePasswordData });
    }
    catch (error)
    {
        next(error);
    }
}

module.exports = changePasswordViewController;
