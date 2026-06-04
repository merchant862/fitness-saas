const express = require('express');
const router = express.Router();
const { authLimiter, coachChatLimiter, webhookLimiter } = require('../middleware/security');
const { requireAdmin, requireAuth, requireGuest, requireOnboarding, requirePasswordSetup, requireProfileComplete } = require('../middleware/auth');
const { adminApiRoute, adminRoute } = require('../utils/adminPaths');

const loginViewController = require('../controllers/views/loginViewController');
const landingViewController = require('../controllers/views/landingViewController');
const legalPageViewController = require('../controllers/views/legalPageViewController');
const resetPasswordViewController = require('../controllers/views/resetPasswordViewController');
const forgotPasswordViewController = require('../controllers/views/forgotPasswordController');

const dashboardViewController = require('../controllers/views/dashboardViewController');
const workoutsViewController = require('../controllers/views/workoutsViewController');
const mealsViewController = require('../controllers/views/mealsViewController');
const onboardingViewController = require('../controllers/views/onboardingViewController');
const progressViewController = require('../controllers/views/progressViewController');
const profileViewController = require('../controllers/views/profileViewController');
const changePasswordViewController = require('../controllers/views/changePasswordViewController');
const activityLogViewController = require('../controllers/views/activityLogViewController');

const adminDashboardViewController = require('../controllers/views/adminDashboardViewController');
const adminLoginViewController = require('../controllers/views/adminLoginViewController');
const adminUsersViewController = require('../controllers/views/adminUsersViewController');
const adminUserActionsController = require('../controllers/views/adminUserActionsController');
const adminActivityLogViewController = require('../controllers/views/adminActivityLogViewController');
const adminPaymentTransactionsViewController = require('../controllers/views/adminPaymentTransactionsViewController');
const adminUsersExportController = require('../controllers/views/adminUsersExportController');
const adminContentViewController = require('../controllers/views/adminContentViewController');
const adminContentActionsController = require('../controllers/views/adminContentActionsController');
const adminSettingsActionsController = require('../controllers/views/adminSettingsActionsController');
const authController = require('../controllers/api/authController');
const passwordController = require('../controllers/api/passwordController');
const userController = require('../controllers/api/userController');
const progressController = require('../controllers/api/progressController');
const contentController = require('../controllers/api/contentController');
const purchaseController = require('../controllers/api/purchaseController');

// Public view routes
router.get('/', landingViewController);
router.get('/:pageSlug(terms-and-conditions|privacy-policy|refund-policy|do-not-sell-or-share|billing-disclosure)', legalPageViewController);
router.get('/sign-in', requireGuest, loginViewController);
router.get('/login', function(req, res)
{
  return res.redirect('/sign-in');
});

router.get('/reset-password', requireGuest, resetPasswordViewController);
router.get('/forgot-password', requireGuest, forgotPasswordViewController);

// Public API routes
router.post('/sign-in', requireGuest, authLimiter, authController.passwordLogin);
router.get('/session/verify', requireGuest, authLimiter, authController.magicLinkVerify);
router.post('/forgot-password', requireGuest, authLimiter, passwordController.forgot);
router.post('/reset-password', requireGuest, authLimiter, passwordController.reset);
router.get('/logout', requireAuth, authController.logout);
router.post('/logout', requireAuth, authController.logout);

// Authenticated member routes
router.get('/dashboard', requireOnboarding, requireProfileComplete, requirePasswordSetup, dashboardViewController);
router.get('/workouts', requireOnboarding, requireProfileComplete, requirePasswordSetup, workoutsViewController);
router.get('/meals', requireOnboarding, requireProfileComplete, requirePasswordSetup, mealsViewController);
router.get('/onboarding', requireAuth, onboardingViewController);
router.post('/onboarding', requireAuth, userController.onboarding);
router.get('/ai-coach', requireOnboarding, requireProfileComplete, requirePasswordSetup, function(req, res)
{
  return res.redirect('/dashboard');
});
router.get('/progress', requireOnboarding, requireProfileComplete, requirePasswordSetup, progressViewController);
router.get('/profile', requireOnboarding, profileViewController);
router.post('/profile', requireOnboarding, userController.updateProfile);
router.get('/activity-log', requireOnboarding, requireProfileComplete, requirePasswordSetup, activityLogViewController);
router.get('/change-password', requireOnboarding, requireProfileComplete, changePasswordViewController);
router.post('/change-password', requireOnboarding, requireProfileComplete, authLimiter, passwordController.update);

// Member API routes
router.post('/api/sessions/email-link', authLimiter, authController.magicLinkRequest);
router.post('/api/sessions/password', authLimiter, authController.passwordLogin);
router.get('/api/sessions/verify', authLimiter, authController.magicLinkVerify);
router.post('/api/auth/logout', requireAuth, authController.logout);
router.get('/api/auth/session', requireAuth, authController.session);
router.post('/api/auth/forgot-password', authLimiter, passwordController.forgot);
router.post('/api/auth/reset-password', authLimiter, passwordController.reset);
router.post('/api/auth/change-password', requireAuth, authLimiter, passwordController.update);
router.post('/api/integrations/upsell-purchases', webhookLimiter, purchaseController.grantUpsellAccess);

router.get('/api/dashboard', requireOnboarding, requireProfileComplete, requirePasswordSetup, contentController.dashboard);
router.get('/api/users/me', requireAuth, userController.me);
router.patch('/api/users/me', requireAuth, userController.updateProfile);
router.post('/api/users/onboarding', requireAuth, userController.onboarding);

router.get('/api/workouts', requireOnboarding, requireProfileComplete, requirePasswordSetup, contentController.workoutIndex);
router.post('/api/workouts/:id/complete', requireOnboarding, requireProfileComplete, requirePasswordSetup, progressController.completeWorkout);
router.get('/api/meals', requireOnboarding, requireProfileComplete, requirePasswordSetup, contentController.mealIndex);
router.post('/api/meals/complete', requireOnboarding, requireProfileComplete, requirePasswordSetup, progressController.completeMealDay);
router.post('/api/coach/chat', requireOnboarding, requireProfileComplete, requirePasswordSetup, coachChatLimiter, contentController.coachChat);
router.get('/api/progress', requireOnboarding, requireProfileComplete, requirePasswordSetup, progressController.progress);
router.post('/api/progress/weight', requireOnboarding, requireProfileComplete, requirePasswordSetup, progressController.logWeight);

// Admin routes
router.get(adminRoute('/sign-in'), adminLoginViewController);
router.post(adminRoute('/sign-in'), authLimiter, authController.adminPasswordLogin);
router.get(adminRoute(), requireAdmin, adminDashboardViewController);
router.post(adminRoute('/settings/device-limit'), requireAdmin, adminSettingsActionsController.updateDeviceLimit);
router.post(adminRoute('/settings/sticky'), requireAdmin, adminSettingsActionsController.updateSticky);
router.post(adminRoute('/settings/email'), requireAdmin, adminSettingsActionsController.updateEmail);
router.post(adminRoute('/settings/brand'), requireAdmin, adminSettingsActionsController.updateBrand);
router.get(adminRoute('/users'), requireAdmin, adminUsersViewController);
router.post(adminRoute('/users/:id/status'), requireAdmin, adminUserActionsController.updateStatus);
router.get(adminRoute('/users/export.csv'), requireAdmin, adminUsersExportController);
router.get(adminRoute('/activity-log'), requireAdmin, adminActivityLogViewController);
router.get(adminRoute('/payments'), requireAdmin, adminPaymentTransactionsViewController);
router.get(adminRoute('/content'), requireAdmin, adminContentViewController);
router.get(adminRoute('/content/workout-plans/:id'), requireAdmin, adminContentActionsController.editWorkout);
router.post(adminRoute('/content/workout-plans/:id'), requireAdmin, adminContentActionsController.updateWorkout);
router.get(adminRoute('/content/meal-plans/:id'), requireAdmin, adminContentActionsController.editMeal);
router.post(adminRoute('/content/meal-plans/:id'), requireAdmin, adminContentActionsController.updateMeal);

router.get(adminApiRoute('/users'), requireAdmin, userController.adminUsers);

module.exports = router;
