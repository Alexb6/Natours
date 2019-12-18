const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.getAllReviews = catchAsync(async (req, res, next) => {
    let filter = {}; // Empty object will req all reviews
    /* Thanks to mergeParams: true, we have access to tourId */
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const reviews = await Review.find(filter);

    res.status(200).json({
        status: 'success',
        results: reviews.length,
        data: {
            reviews
        }
    });
});

exports.createReview = catchAsync(async (req, res, next) => {
    /* Nested routes: if ther's no tour id in the body, get it in the URL, get user id from protect middleware */
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;

    const newReview = await Review.create(req.body);

    res.status(201).json({
        status: 'success',
        data: {
            newReview
        }
    })
});
