const express = require('express');
const router = express.Router();
const { aiChatLimiter, authLimiter } = require('../middleware/security');
const { requireAdmin, requireAuth, requireOnboarding } = require('../middleware/auth');

const loginViewController = require('../controllers/views/loginViewController');
const resetPasswordViewController = require('../controllers/views/resetPasswordViewController');
const forgotPasswordViewController = require('../controllers/views/forgotPasswordController');

const dashboardViewController = require('../controllers/views/dashboardViewController');
const workoutsViewController = require('../controllers/views/workoutsViewController');
const mealsViewController = require('../controllers/views/mealsViewController');
const onboardingViewController = require('../controllers/views/onboardingViewController');
const aiCoachViewController = require('../controllers/views/aiCoachViewController');
const progressViewController = require('../controllers/views/progressViewController');
const profileViewController = require('../controllers/views/profileViewController');
const changePasswordViewController = require('../controllers/views/changePasswordViewController');

const redeemAccessViewController = require('../controllers/views/redeemAccessViewController');
const adminDashboardViewController = require('../controllers/views/adminDashboardViewController');
const adminUsersViewController = require('../controllers/views/adminUsersViewController');
const adminAccessCodesViewController = require('../controllers/views/adminAccessCodesViewController');
const adminAccessCodeActionsController = require('../controllers/views/adminAccessCodeActionsController');
const authController = require('../controllers/api/authController');
const passwordController = require('../controllers/api/passwordController');
const accessCodeController = require('../controllers/api/accessCodeController');
const userController = require('../controllers/api/userController');
const progressController = require('../controllers/api/progressController');
const contentController = require('../controllers/api/contentController');
const purchaseController = require('../controllers/api/purchaseController');

router.get('/', function(req, res)
{
  return res.redirect(req.user ? '/dashboard' : '/sign-in');
});
router.get('/sign-in', loginViewController);
router.post('/sign-in', authLimiter, authController.magicLinkRequest);
router.get('/session/verify', authLimiter, authController.magicLinkVerify);
router.get('/activate', redeemAccessViewController);
router.post('/activate', authLimiter, authController.redeem);

router.get('/login', function(req, res)
{
  return res.redirect('/sign-in');
});

router.get('/reset-password', resetPasswordViewController);
router.get('/forgot-password', forgotPasswordViewController);
router.post('/forgot-password', authLimiter, passwordController.forgot);
router.post('/reset-password', authLimiter, passwordController.reset);
router.post('/logout', requireAuth, authController.logout);

router.get('/dashboard', requireOnboarding, dashboardViewController);
router.get('/workouts', requireOnboarding, workoutsViewController);
router.get('/meals', requireOnboarding, mealsViewController);
router.get('/onboarding', requireAuth, onboardingViewController);
router.post('/onboarding', requireAuth, userController.onboarding);
router.get('/ai-coach', requireOnboarding, aiCoachViewController);
router.get('/progress', requireOnboarding, progressViewController);
router.get('/profile', requireOnboarding, profileViewController);
router.get('/change-password', requireAuth, changePasswordViewController);
router.post('/change-password', requireAuth, authLimiter, passwordController.update);

router.get('/admin', requireAdmin, adminDashboardViewController);
router.get('/admin/users', requireAdmin, adminUsersViewController);
router.get('/admin/access-codes', requireAdmin, adminAccessCodesViewController);
router.post('/admin/access-codes', requireAdmin, adminAccessCodeActionsController.create);
router.post('/admin/access-codes/:id/revoke', requireAdmin, adminAccessCodeActionsController.revoke);
router.post('/admin/access-codes/:id/extend', requireAdmin, adminAccessCodeActionsController.extend);

router.post('/api/sessions/email-link', authLimiter, authController.magicLinkRequest);
router.get('/api/sessions/verify', authLimiter, authController.magicLinkVerify);
router.post('/api/access-codes/redeem', authLimiter, authController.redeem);
router.post('/api/auth/logout', requireAuth, authController.logout);
router.get('/api/auth/session', requireAuth, authController.session);
router.post('/api/auth/forgot-password', authLimiter, passwordController.forgot);
router.post('/api/auth/reset-password', authLimiter, passwordController.reset);
router.post('/api/auth/change-password', requireAuth, authLimiter, passwordController.update);
router.post('/api/integrations/upsell-purchases', authLimiter, purchaseController.grantUpsellAccess);

router.get('/api/dashboard', requireOnboarding, contentController.dashboard);
router.get('/api/users/me', requireAuth, userController.me);
router.patch('/api/users/me', requireAuth, userController.updateProfile);
router.post('/api/users/onboarding', requireAuth, userController.onboarding);

router.get('/api/workouts', requireOnboarding, contentController.workoutIndex);
router.post('/api/workouts/:id/complete', requireOnboarding, progressController.completeWorkout);
router.get('/api/meals', requireOnboarding, contentController.mealIndex);
router.post('/api/ai/chat', requireOnboarding, aiChatLimiter, contentController.aiChat);
router.get('/api/progress', requireOnboarding, progressController.progress);
router.post('/api/progress/weight', requireOnboarding, progressController.logWeight);

router.get('/api/admin/users', requireAdmin, userController.adminUsers);
router.get('/api/admin/access-codes', requireAdmin, accessCodeController.index);
router.post('/api/admin/access-codes', requireAdmin, accessCodeController.create);
router.patch('/api/admin/access-codes/:id/revoke', requireAdmin, accessCodeController.revoke);
router.patch('/api/admin/access-codes/:id/extend', requireAdmin, accessCodeController.extend);

module.exports = router;
