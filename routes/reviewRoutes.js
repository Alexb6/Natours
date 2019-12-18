const express = require('express');
const reviewControllers = require('./../controllers/reviewControllers');
const authController = require('./../controllers/authController');

/* By default, each router has access to its params only, we need the tour id available in other router 
for posting a new review, & mergeParams allows that.
Now POST '/:tourId/reviews' or '/reviews' will use the ('/').post route below to create a new review
Same for GET '/:tourId/reviews', will use the ('/').get route below to retrieve a review of this tour id */
const router = express.Router({ mergeParams: true });

router.route('/')
    .get(reviewControllers.getAllReviews)
    .post(authController.protect, authController.restrictTo('user'), reviewControllers.createReview);

module.exports = router;
