const express = require('express');
const userControllers = require('../controllers/userControllers');
const authControllers = require('../controllers/authController');

/* Routes */
const router = express.Router();

router.post('/signup', authControllers.signup);
router.post('/login', authControllers.login);
router.get('/logout', authControllers.logout);

router.post('/forgotPassword', authControllers.forgotPassword);
router.patch('/resetPassword/:token', authControllers.resetPassword);

/* Apply the protect middelware to the below routes  */
router.use(authControllers.protect);

router.patch('/updateMyPassword', authControllers.updatePassword);

router.get('/me', userControllers.getMe, userControllers.getUser);

router.patch('/updateMe', userControllers.uploadUserPhoto, userControllers.resizeUserPhoto, userControllers.updateMe);
router.delete('/deleteMe', userControllers.deleteMe); // as long as the user has not access to his account

/* Restrict to admin only  */
router.use(authControllers.restrictTo('admin'));

router.route('/')
    .get(userControllers.getAllUsers)
    .post(userControllers.createUser);

router.route('/:id')
    .get(userControllers.getUser)
    .patch(userControllers.updateUser)
    .delete(userControllers.deleteUser);

module.exports = router;