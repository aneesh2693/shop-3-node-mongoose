const User = require('../models/user');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator');


const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: '<API KEY>'
    }
}));

exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    if (message.length == 0) {
        message = null;
    }
    res.render('auth/login', {
        pageTitle: 'Login',
        path: '/login',
        errorMessage: message,
        oldInput: {
            email: '',
            password: ''
        },
        validationErrors: []
    });
};

exports.getSignUp = (req, res, next) => {
    let message = req.flash('error');
    if (message.length == 0) {
        message = null;
    }
    res.render('auth/signup', {
        pageTitle: 'Sign Up',
        path: '/signup',
        errorMessage: message,
        oldInput: {
            email: '',
            password: '',
            confirmPassword: ''
        },
        validationErrors: []
    });
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    var errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(422).render('auth/login', {
            pageTitle: 'Login',
            path: '/login',
            errorMessage: message,
            oldInput: {
                email: email,
                password: password
            },
            validationErrors: errors.array()
        });
    }

    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                return res.status(422).render('auth/login', {
                    pageTitle: 'Login',
                    path: '/login',
                    errorMessage: "Invalid email or password",
                    oldInput: {
                        email: email,
                        password: password
                    },
                    validationErrors: []
                });
            }
            return bcrypt.compare(password, user.password)
                .then(isMatched => {
                    if (!isMatched) {
                        return res.status(422).render('auth/login', {
                            pageTitle: 'Login',
                            path: '/login',
                            errorMessage: "Invalid email or password",
                            oldInput: {
                                email: email,
                                password: password
                            },
                            validationErrors: []
                        });
                    }
                    req.session.isLoggedIn = true;
                    req.session.user = user;
                    // This is to make sure that redirect only happens
                    // after user is updated
                    return req.session.save(err => {
                        if (err) console.log(err);
                        res.redirect('/');
                    });
                })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};


exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        if (err) console.log(err);
        res.redirect('/');
    });
};


exports.postSignUp = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    var errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array()[0].msg;
        return res.status(422).render('auth/signup', {
            pageTitle: 'Sign Up',
            path: '/signup',
            errorMessage: message,
            oldInput: {
                email: email,
                password: password,
                confirmPassword: confirmPassword
            },
            validationErrors: errors.array()
        });
    }

    bcrypt.hash(password, 12)
        .then(hashedPassword => {
            const newUser = new User({
                email: email,
                password: hashedPassword,
                cart: {
                    items: []
                }
            });
            return newUser.save();
        })
        .then(result => {
            transporter.sendMail({
                to: email,
                from: 'aneesh261993@gmail.com',
                subject: 'Shop signup',
                html: '<h1>You have successfully signed up</h1>'
            });
            res.redirect('/login');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};


exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    if (message.length == 0) {
        message = null;
    }
    res.render('auth/reset', {
        pageTitle: 'Reset Password',
        path: '/reset',
        errorMessage: message
    });
};


exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (error, buffer) => {
        if (error) {
            req.flash('error', 'Encryption Error');
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({ email: req.body.email })
            .then(user => {
                if (!user) {
                    req.flash('error', 'User not found');
                    return false;
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000; // milliseconds
                return user.save();
            })
            .then(result => {
                if (!result) {
                    return res.redirect('/signup');
                }
                transporter.sendMail({
                    to: req.body.email,
                    from: '<email>',
                    subject: 'Reset Password',
                    html: `
                    <p>You requested to reset password.</p>
                    <p>Please open the <a href='http://localhost:3000/reset/${token}'>link</a> to reset password.</p>
                    `
                });
                res.redirect('/login');
            })
            .catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error);
            });
    });
}



exports.getNewPassword = (req, res, next) => {
    if (!req.params.token) {
        req.flash('error', 'Invalid reset link');
        return res.redirect('/login');
    }
    const token = req.params.token;
    User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
        .then(user => {
            if (!user) {
                req.flash('error', 'Invalid reset link');
                return res.redirect('/login');
            }
            let message = req.flash('error');
            if (message.length == 0) {
                message = null;
            }
            res.render('auth/new-password', {
                pageTitle: 'New Password',
                path: '/new-password',
                errorMessage: message,
                userId: user._id.toString(),
                passwordToken: token
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });

};



exports.postNewPassword = (req, res, next) => {
    const userId = req.body.userId;
    const token = req.body.passwordToken;
    const password = req.body.password;
    let resetUser;
    User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() }, _id: userId })
        .then(user => {
            resetUser = user;
            return bcrypt.hash(password, 12)
        })
        .then(hashedPassword => {
            resetUser.password = hashedPassword;
            resetUser.resetToken = undefined;
            resetUser.resetTokenExpiration = undefined;
            return resetUser.save();
        })
        .then(result => {
            res.redirect('/login');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};
