const express = require('express');
const router = express.Router();
const { authLimiter, coachChatLimiter, webhookLimiter } = require('../middleware/security');
const { requireAdmin, requireAuth, requireBilling, requireGuest, requireOnboarding, requirePasswordSetup, requireProfileComplete } = require('../middleware/auth');

const loginViewController = require('../controllers/views/loginViewController');
const landingViewController = require('../controllers/views/landingViewController');
const resetPasswordViewController = require('../controllers/views/resetPasswordViewController');
const forgotPasswordViewController = require('../controllers/views/forgotPasswordController');

const dashboardViewController = require('../controllers/views/dashboardViewController');
const workoutsViewController = require('../controllers/views/workoutsViewController');
const mealsViewController = require('../controllers/views/mealsViewController');
const onboardingViewController = require('../controllers/views/onboardingViewController');
const progressViewController = require('../controllers/views/progressViewController');
const profileViewController = require('../controllers/views/profileViewController');
const changePasswordViewController = require('../controllers/views/changePasswordViewController');
const billingViewController = require('../controllers/views/billingViewController');
const activityLogViewController = require('../controllers/views/activityLogViewController');

const adminDashboardViewController = require('../controllers/views/adminDashboardViewController');
const adminUsersViewController = require('../controllers/views/adminUsersViewController');
const adminActivityLogViewController = require('../controllers/views/adminActivityLogViewController');
const adminUsersExportController = require('../controllers/views/adminUsersExportController');
const adminContentViewController = require('../controllers/views/adminContentViewController');
const adminContentActionsController = require('../controllers/views/adminContentActionsController');
const adminAccessCodesViewController = require('../controllers/views/adminAccessCodesViewController');
const adminAccessCodeActionsController = require('../controllers/views/adminAccessCodeActionsController');
const authController = require('../controllers/api/authController');
const passwordController = require('../controllers/api/passwordController');
const accessCodeController = require('../controllers/api/accessCodeController');
const userController = require('../controllers/api/userController');
const progressController = require('../controllers/api/progressController');
const contentController = require('../controllers/api/contentController');
const purchaseController = require('../controllers/api/purchaseController');
const billingController = require('../controllers/api/billingController');

// Public view routes
router.get('/', landingViewController);
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
router.get('/dashboard', requireOnboarding, requireProfileComplete, requirePasswordSetup, requireBilling, dashboardViewController);
router.get('/workouts', requireOnboarding, requireProfileComplete, requirePasswordSetup, requireBilling, workoutsViewController);
router.get('/meals', requireOnboarding, requireProfileComplete, requirePasswordSetup, requireBilling, mealsViewController);
router.get('/onboarding', requireAuth, onboardingViewController);
router.post('/onboarding', requireAuth, userController.onboarding);
router.get('/ai-coach', requireOnboarding, requireProfileComplete, requirePasswordSetup, requireBilling, function(req, res)
{
  return res.redirect('/dashboard');
});
router.get('/progress', requireOnboarding, requireProfileComplete, requirePasswordSetup, requireBilling, progressViewController);
router.get('/profile', requireOnboarding, profileViewController);
router.post('/profile', requireOnboarding, userController.updateProfile);
router.get('/activity-log', requireOnboarding, requireProfileComplete, requirePasswordSetup, requireBilling, activityLogViewController);
router.get('/billing', requireOnboarding, requireProfileComplete, requirePasswordSetup, billingViewController);
router.post('/billing/payment-method', requireOnboarding, requireProfileComplete, authLimiter, billingController.updatePaymentMethod);
router.get('/change-password', requireOnboarding, requireProfileComplete, requirePasswordSetup, changePasswordViewController);
router.post('/change-password', requireOnboarding, requireProfileComplete, requirePasswordSetup, authLimiter, passwordController.update);

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

router.get('/api/dashboard', requireOnboarding, requireProfileComplete, requirePasswordSetup, requireBilling, contentController.dashboard);
router.get('/api/users/me', requireAuth, userController.me);
router.patch('/api/users/me', requireAuth, userController.updateProfile);
router.post('/api/users/onboarding', requireAuth, userController.onboarding);

router.get('/api/workouts', requireOnboarding, requireProfileComplete, requirePasswordSetup, requireBilling, contentController.workoutIndex);
router.post('/api/workouts/:id/complete', requireOnboarding, requireProfileComplete, requirePasswordSetup, requireBilling, progressController.completeWorkout);
router.get('/api/meals', requireOnboarding, requireProfileComplete, requirePasswordSetup, requireBilling, contentController.mealIndex);
router.post('/api/meals/complete', requireOnboarding, requireProfileComplete, requirePasswordSetup, requireBilling, progressController.completeMealDay);
router.post('/api/coach/chat', requireOnboarding, requireProfileComplete, requirePasswordSetup, requireBilling, coachChatLimiter, contentController.coachChat);
router.get('/api/progress', requireOnboarding, requireProfileComplete, requirePasswordSetup, requireBilling, progressController.progress);
router.post('/api/progress/weight', requireOnboarding, requireProfileComplete, requirePasswordSetup, requireBilling, progressController.logWeight);
router.get('/api/billing/payment-method', requireOnboarding, requireProfileComplete, billingController.showPaymentMethod);
router.post('/api/billing/payment-method', requireOnboarding, requireProfileComplete, authLimiter, billingController.updatePaymentMethod);

// Admin routes
router.get('/admin', requireAdmin, adminDashboardViewController);
router.get('/admin/users', requireAdmin, adminUsersViewController);
router.get('/admin/users/export.csv', requireAdmin, adminUsersExportController);
router.get('/admin/activity-log', requireAdmin, adminActivityLogViewController);
router.get('/admin/content', requireAdmin, adminContentViewController);
router.get('/admin/content/workout-plans/:id', requireAdmin, adminContentActionsController.editWorkout);
router.post('/admin/content/workout-plans/:id', requireAdmin, adminContentActionsController.updateWorkout);
router.get('/admin/content/meal-plans/:id', requireAdmin, adminContentActionsController.editMeal);
router.post('/admin/content/meal-plans/:id', requireAdmin, adminContentActionsController.updateMeal);
router.get('/admin/access-codes', requireAdmin, adminAccessCodesViewController);
router.post('/admin/access-codes', requireAdmin, adminAccessCodeActionsController.create);
router.post('/admin/access-codes/:id/revoke', requireAdmin, adminAccessCodeActionsController.revoke);
router.post('/admin/access-codes/:id/extend', requireAdmin, adminAccessCodeActionsController.extend);

router.get('/api/admin/users', requireAdmin, userController.adminUsers);
router.get('/api/admin/access-codes', requireAdmin, accessCodeController.index);
router.post('/api/admin/access-codes', requireAdmin, accessCodeController.create);
router.patch('/api/admin/access-codes/:id/revoke', requireAdmin, accessCodeController.revoke);
router.patch('/api/admin/access-codes/:id/extend', requireAdmin, accessCodeController.extend);

module.exports = router;
