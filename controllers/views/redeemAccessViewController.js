async function redeemAccessViewController(req, res, next)
{
    try
    {
        const redeemAccessData = {
            page: {
                title: 'Redeem Your Access',
                subtitle: 'Enter your email and access code to unlock your fitness dashboard.'
            },

            defaultValues: {
                email: 'saif@example.com',
                accessCode: 'FIT-ACCESS-2026'
            },

            helpText: 'Use the same email you used during purchase. Your access code is usually sent by email after checkout.',

            statusCard: {
                title: 'Instant Access',
                description: 'Once your code is verified, you will be taken to onboarding and then your dashboard.',
                items: [
                    'No password required',
                    'Fast access setup',
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