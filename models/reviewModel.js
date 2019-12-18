const mongoose = require('mongoose');

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

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;