const express = require('express');
const router = express.Router();

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

router.get('/login', loginViewController);
router.get('/reset-password', resetPasswordViewController);
router.get('/forgot-password', forgotPasswordViewController);

router.get('/dashboard', dashboardViewController);
router.get('/workouts', workoutsViewController);
router.get('/meals', mealsViewController)
router.get('/onboarding', onboardingViewController);
router.get('/ai-coach', aiCoachViewController);
router.get('/progress', progressViewController);
router.get('/profile', profileViewController);
router.get('/change-password', changePasswordViewController);

router.get('/redeem-access', redeemAccessViewController);

module.exports = router;


