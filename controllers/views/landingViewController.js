'use strict';

async function landingViewController(req, res, next)
{
    try
    {
        return res.status(200).render('../views/landing.ejs', {
            landingData: {
                currentUser: req.user || null
            }
        });
    }
    catch (error)
    {
        next(error);
    }
}

module.exports = landingViewController;
