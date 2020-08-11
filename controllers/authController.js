const { promisify } = require('util'); // Node built-in utility functions
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');
const crypto = require('crypto');

/* Creation of the token */
const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

/* Send the token in the response */
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user.id);
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000), // turn the date in milliseconds
        httpOnly: true // Accessible only by the browser & not modifiable (prevent XSS attacks), it just stored & send it along w every req
    };
    if (process.env.NOD_ENV === 'production') cookieOptions.secure = true; // sending w https encription in production
    res.cookie('jwt', token, cookieOptions);

    /* Remove the password from the output, set it to undefined but do not save() it in the base*/
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};

/* Creation of a new user */
exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create(req.body);

    const url = `${req.protocol}://${req.get('host')}/me`;
    await new Email(newUser, url).sendWelcome();

    createSendToken(newUser, 201, res);
});

/* Log in the user, 1st step of authentification */
exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    /* 1) Check if there are an email or a password in the req body */
    if (!email || !password) {
        return next(new AppError('Please provide an email and a password', 400));
    }
    /* 2) Check if the user exists and password is correct, 
    select('+password') will add back the password field in the user document */
    const user = await User.findOne({ email }).select('+password');

    // user is now a document (result of the User model querying), 
    // so we can use Instance method correctPassword to compare passwords
    if (!user || !await user.correctPassword(password, user.password)) {
        return next(new AppError('Incorrect email or password', 401));
    }
    /* 3) If everything is ok, send token to client */
    createSendToken(user, 200, res);
});

/* Using the jwt to grant access to protected routes, 2nd step of authentification */
exports.protect = catchAsync(async (req, res, next) => {
    /* 1) Get the token if it's (there it's in the headers mostly) */
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]; // split the string separated by a space into an array
        // console.log(token);        
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(new AppError('To get access, you need to login!', 401));
    }
    /* 2) Verify the validity of the token(if someone manipulated it or has expired) */
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); // decoded:{id, iat, exp}
    // console.log('decoded: ', decoded);

    /* 3) Check if the user with this token still exists (in case the user has been deleted in the meantime) */
    const currentUser = await User.findById(decoded.id); // user id from the decoded payload
    if (!currentUser) { return next(new AppError('The user with this token does no longer exist!', 401)); }

    /* 4) Check if user changed password after the token was issued */
    if (currentUser.changedPasswordAfter(decoded.iat)) { // iat: initited at
        return next(new AppError('The user has recently changed password, please login again!', 401));
    }
    /* 5) Grant acces to protected route if passed all conditions */
    req.user = currentUser; // pass the user data to the next middleware
    res.locals.user = currentUser; // make user a var for pugs files
    next();
});

/* Log out the user, w- the token in the response */
exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedOut', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({ status: 'success' });
};

/* Verify if the user is logged in for rendering pages, no errors hadling here */
exports.isLoggedIn = async (req, res, next) => {
    try {
        if (req.cookies.jwt) {
            /* 1) Verify the validity of the token(if someone manipulated it or has expired) */
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET); // decoded:{id, iat, exp}

            /* 2) Check if the user with this token still exists (in case the user has been deleted in the meantime) */
            const currentUser = await User.findById(decoded.id); // user id from the decoded payload
            if (!currentUser) return next();

            /* 3) Check if user changed password after the token was issued */
            if (currentUser.changedPasswordAfter(decoded.iat)) return next();

            /* 4) If pass all steps, then make the logged in user data accessible to pug files */
            res.locals.user = currentUser; // make user a var for pugs files
            return next();
        }
    } catch (err) {
        return next();
    };
    next();
};

/* Role administration: normally we cannot pass args to a middleware, 
so we create a wrapper fct° that returns the middlaware, so it can access to args w closure principle */
exports.restrictTo = (...roles) => { // roles: ['admin', 'lead-guide'] defined in tourRoutes
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) { // The user data has been passed down from the protect middleware
            return next(new AppError('You do not have the authrorisation to perform this action', 403));
        }
        next();
    }
}

/* Reset password request from user */
exports.forgotPassword = catchAsync(async (req, res, next) => {
    /* 1) Get user based on POSTed email */
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new AppError('There is no user with this email address!', 404));
    }
    /* 2) Generate the ramdom reset token */
    const resetToken = user.createPasswordResetToken();
    // in the user model, we create the data and now we have to save it in base
    await user.save({ validateBeforeSave: false }); // deactivate the validators because there's no value in passwordConfirm

    /* 3) Send it to user's email */
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;    
    try {
        await new Email(user, resetURL).sendPasswordReset();

        res.status(200).json({
            status: 'success',
            message: 'Token sent to email!'
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false }); // the 2 reset properties is now saved into the base

        return next(new AppError('There was an error sending the email. Try again later!', 500));
    }
});


exports.resetPassword = catchAsync(async (req, res, next) => {
    /* 1) Get the token, hash it in order to find the user base on its hashed version */
    const hashToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
        passwordResetToken: hashToken,
        passwordResetExpires: { $gt: Date.now() } // if this property date is greater than now, means token hasn't expired
    });

    /* 2) If token is valid & has not expired, means the user exists, then set the new password */
    if (!user) {
        return next(new AppError('Token is invalid or has expired!', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save(); // saving the data into base

    /* 3) Update the date of passwordChangedAt property for this user */
    // By setting a pre middleware in the user model

    /* 4) Log the user in & send the JWT */
    createSendToken(user, 200, res);
});

/* Change password for a logged in user */
exports.updatePassword = catchAsync(async (req, res, next) => {
    /* 1) Get the user from collection */
    const user = await User.findById(req.user.id).select('+password');
    // We have the current user on the req obj (through protect middleware)

    /* 2) Check if POSTed current password is correct */
    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('The password you entered is not correct', 401));
    }

    /* 3) If so, update the password */
    user.password = req.body.newPassword;
    user.passwordConfirm = req.body.newPasswordConfirm;
    await user.save(); // use .save() beacause the validators & the pre middlewaref for hashing and changing the passwordChangedAt will not work!

    /* 4) Log the user in & send JWT */
    createSendToken(user, 200, res);
});

