async function loginViewController(req, res, next)
{
    try
    {
        const message = null;
        const error = null;

        return res.status(200).render(`../views/login.ejs`, { message, error });
    }
    catch(error)
    {
        next(error);
    }
}

module.exports = loginViewController;
