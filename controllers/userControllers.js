const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const handlerFactory = require('./handlerFactory');

/* Multer image upload controller*/

/* const multerStorage = multer.diskStorage({ // saving the img in a folder
    destination: (req, file, cb) => {
        cb(null, 'public/img/users');
    },
    filename: (req, file, cb) => {
        const ext = file.mimetype.split('/')[1];
        cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
    }
}); */

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => { // to test if the file is an jpg
    if (file.mimetype.startsWith('image')) {
        cb(null, true)
    } else {
        cb(new AppError('Not an image! Please upload only images.', 400), false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single('photo');

/* Resize the user photo to a square format w sharp library */
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) return next();
    // req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
    req.file.filename = `${req.user.name}-${new Date().toISOString().substring(0, 4)}.jpeg`;
    await sharp(req.file.buffer).resize(500, 500).toFormat('jpeg').jpeg({ quality: 90 }).toFile(`public/img/users/${req.file.filename}`);
    next();
});

/* Filter the fields to keep in an object */
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

/* Allow the logged in user to retrieve his own data, called before getUser */
exports.getMe = (req, res, next) => {
    req.params.id = req.user.id; // getUser require an parameter id
    next();
};

/* Allow the user to update his data when he's logged in */
exports.updateMe = catchAsync(async (req, res, next) => {
    // console.log(req.file);
    // console.log(req.body);
    /* 1) Create error if user POSTs password data */
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('This route is not for password updates. Please use /updateMyPassword.', 400));
    }

    /* 2) Filter out unwanted fields in the req.body that are not allowed to be updated */
    const filteredBody = filterObj(req.body, 'name', 'email'); // Here only name & email are allowed to be updated
    if (req.file) filteredBody.photo = req.file.filename; // Add photo prop to the filteredBody

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

exports.createUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This createUser is not define. Please use sign up instead!'
    });
};

exports.getAllUsers = handlerFactory.getAll(User);

exports.getUser = handlerFactory.getOne(User);

exports.updateUser = handlerFactory.updateOne(User);

exports.deleteUser = handlerFactory.deleteOne(User);