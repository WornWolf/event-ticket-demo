const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/auth');

// REGISTER
router.get('/register', authController.getRegister);
router.post('/register', authController.postRegister);

// LOGIN
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

// LOGOUT
router.post('/logout', authController.postLogout);

// OTP verification
router.get('/verify-otp', authController.getVerifyOtp);
router.post('/verify-otp', authController.postVerifyOtp);
router.post('/resend-otp', authController.postResendOtp);

// SWITCH ROLE
router.post('/switch-role', isAuthenticated, authController.postSwitchRole);

// FORGOT / RESET PASSWORD
router.get('/forgot-password', authController.getForgotPassword);
router.post('/forgot-password', authController.postForgotPassword);
router.post('/reset-password', authController.postResetPassword);

module.exports = router;
