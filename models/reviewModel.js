const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Please enter your text for a review!']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    tour: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tour',
        required: [true, 'A review must belong to a tour!']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'A review must belong to a user!']
    }
}, { // Options to output virtual properties not stored in db but based on the calculation of other properties
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

/* Reviews index to prevent the user to review a tour multiple times */
reviewSchema.index({tour: 1, user: 1}, {unique: true});

/* Static method to calculate the average rating */
reviewSchema.statics.calcAverageRatings = async function(tourId) {
    const stats = await this.aggregate([
        {$match: {tour: tourId}},
        {$group: {
            _id: '$tour',
            nRating: {$sum: 1},
            avgRating: {$avg :'$rating'}
        }}
    ]);

    if(stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        });
    }
};

/* Query Pre Middleware to populate the reviews */
reviewSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'user', // ref to user field in the reviewSchema
        select: 'name photo' // display the name & photo of the user document        
    })
    // .populate({        
    //     path: 'tour', // ref to tour field in the reviewSchema
    //     select: 'name'
    // });
    next();
});

/* Calling the static method calcAverageRatings to calculate some stats on the review */
reviewSchema.post('save', function() {
    this.constructor.calcAverageRatings(this.tour);
});

/*  */
reviewSchema.pre(/^findOneAnd/, async function(next) {
    this.currentReview = await this.findOne();
    next();
});

reviewSchema.post(/^findOneAnd/, async function() {
    await this.currentReview.constructor.calcAverageRatings(this.currentReview.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;