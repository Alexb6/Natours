const express = require('express');
const bookingControllers = require('./../controllers/bookingControllers');
const authController = require('./../controllers/authController');

const router = express.Router();

router.use(authController.protect);
router.get('/checkout-session/:tourId', bookingControllers.getCheckoutSession);

router.use(authController.restrictTo('admin', 'lead-guide'));
router.route('/').get(bookingControllers.getAllBookings).post(bookingControllers.createBooking);
router.route('/:id')
    .get(bookingControllers.getBooking)
    .patch(bookingControllers.updateBooking)
    .delete(bookingControllers.deleteBooking);

module.exports = router;