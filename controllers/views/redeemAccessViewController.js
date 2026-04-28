async function redeemAccessViewController(req, res, next)
{
    try
    {
        const redeemAccessData = {
            page: {
                title: 'Activate Your Fitness Access',
                subtitle: 'Enter the purchase email and access code from your checkout email.'
            },

            defaultValues: {
                email: req.query.email || '',
                accessCode: req.query.code || ''
            },

            helpText: 'Use the same email used at checkout. Your access code is single-use and tied to that email.',

            statusCard: {
                title: 'Upsell Member Access',
                description: 'After purchase verification, your FitAccess account unlocks without a password.',
                items: [
                    'Secure email-based sign-in',
                    'Single-use activation code',
                    'Personalized fitness plan'
                ]
            }
        };

        return res.status(200).render('../views/redeem-access.ejs', { redeemAccessData });
    }
    catch (error)
    {
        next(error);
    }
}

module.exports = redeemAccessViewController;
