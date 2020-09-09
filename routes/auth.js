const express = require('express');

const authController = require('../controllers/auth');

const { check, body } = require('express-validator');

const router = express.Router();

const User = require('../models/user');

// /login => GET
router.get('/login', authController.getLogin);

// /login => POST
router.post('/login', [
    body('email', 'Please enter a valid email')
        .isEmail()
        .normalizeEmail(),
    body('password', 'Please enter valid password. Min 6 characters')
        .isLength({ min: 6 })
        .trim()
],
    authController.postLogin);

// /logout => POST
router.post('/logout', authController.postLogout);

// /signup => POST
router.get('/signup', authController.getSignUp);

// /signup => POST
router.post('/signup', [
    check('email')
        .isEmail()
        .withMessage('Please enter a valid email')
        .custom((value, { req }) => {
            return User.findOne({ email: value })
                .then(userDoc => {
                    if (userDoc) {
                        return Promise.reject('E-mail already exists');
                    }
                    return true;
                })
        })
        .normalizeEmail(),
    body('password', 'Please enter valid password. Min 6 characters')
        .isLength({ min: 6 })
        .trim(),
    body('confirmPassword')
        .trim()
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords do not match');
            }
            return true;
        })
], authController.postSignUp);

// /reset => POST
router.get('/reset', authController.getReset);

// /reset => POST
router.post('/reset', authController.postReset);

// /reset => GET
router.get('/reset/:token', authController.getNewPassword);

// /new-password => POST
router.post('/new-password', authController.postNewPassword);

module.exports = router;