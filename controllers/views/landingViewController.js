'use strict';

const { getBrandSettings } = require('../../services/appSettingsService');

async function landingViewController(req, res, next)
{
    try
    {
        const brandSettings = await getBrandSettings();

        return res.status(200).render('../views/landing.ejs', {
            landingData: {
                currentUser: req.user || null,
                supportEmail: brandSettings.support_email
            }
        });
    }
    catch (error)
    {
        next(error);
    }
}

module.exports = landingViewController;
