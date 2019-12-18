const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

/* Filter the fields to keep in an object */
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });

    return newObj;
}

exports.getAllUsers = catchAsync(async (req, res, next) => {
    const users = await User.find();
    // console.log(req.query);

    /* SEND THE RESPONSE */
    res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
            users
        }
    });
});

/* Allow the user to update his data when he's logged in */
exports.updateMe = catchAsync(async (req, res, next) => {
    /* 1) Create error if user POSTs password data */
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('This route is not for password updates. Please use /updateMyPassword.', 400));
    }

    /* 2) Filter out unwanted fields in the req.body that are not allowed to be updated */
    const filteredBody = filterObj(req.body, 'name', 'email'); // Here only name & email are allowed to be updated

    /* 3) Update the user document */
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, { // id from the protect middleware
        new: true, // will return a new document
        runValidators: true
    }); 
    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }

    });
});

/* Allow the user to "delete" (deactivate rather) his account */
exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });
    res.status(204).json({
        status: 'success',
        data: null
    })
});

exports.getUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This getUser is not yet define!'
    });
};

exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This createUser is not yet define!'
    });
};

exports.updateUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This updateUser is not yet define!'
    });
};

exports.deleteUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This deleteUser is not yet define!'
    });
};