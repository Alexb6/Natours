const express = require('express');
const tourControllers = require('./../controllers/tourControllers');
const authController = require('./../controllers/authController');
// const reviewControllers = require('../controllers/reviewControllers');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

/* Check if tour id exist before proceeding to another middleware */
// router.param('id', tourControllers.checkID)

/* Create a route for the best 5 tours, well rated and at a low price, use of middleware to filter the query */
router.route('/top-5-cheap')
    .get(tourControllers.aliasTopTours, tourControllers.getAllTours)

router.route('/tour-stats').get(tourControllers.getTourStats);
router.route('/monthly-plan/:year').get(tourControllers.getMonthlyPlan);

router.route('/')
    .get(authController.protect, tourControllers.getAllTours)
    .post(/* tourControllers.checkBody,  */tourControllers.createTour);

router.route('/:id')
    .get(tourControllers.getTour)
    .patch(tourControllers.updateTour)
    .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourControllers.deleteTour);

/* Nested review creation route inside tour */
// router.route('/:tourId/reviews')
//     .post(authController.protect, authController.restrictTo('user'), reviewControllers.createReview);

/* router is a middleware, for this :tourId/reviews use reviewRouter instead (mounting router like in app.js) */
router.use('/:tourId/reviews', reviewRouter);

module.exports = router;