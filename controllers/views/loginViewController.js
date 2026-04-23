async function loginViewController(req, res, next) 
{
    try{ return res.status(200).render(`../views/login.ejs`) }
    catch(error){ next(error) }
}

module.exports = loginViewController;