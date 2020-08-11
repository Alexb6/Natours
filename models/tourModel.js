const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

/* Need User model for embedding guide(s) in a sub document of a tour */
// const User = require('./userModel');

// const momentTz = require('moment-timezone');

/* Definition of a schema */
const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'], // Built-in Validator
        maxlength: [40, 'A tour must have less or equal than 40 characters'], // Built-in String Validator
        minlength: [6, 'A tour must have at least 6 characters'], // Built-in String Validator
        unique: true,
        trim: true,
        // from validator lib that check if the name only contains characters
        // validate: [validator.isAlpha, 'The name only contains characters.']
    },
    slug: String,
    price: {
        type: Number,
        required: [true, 'A tour must have a price']
    },
    priceDiscount: {
        type: Number,
        validate: { // Custom validator will be either true or false (falsy will return an error)
            validator: function (discountPrice) {
                // this keyword is valid for creation of a new doc and not w the upadate
                return discountPrice < this.price;
            },
            message: 'Discount price ({VALUE}) is lower than the regular price'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0'], // Built-in Number & Dates Validator
        max: [5, 'Rating must be under 5.0'], // Built-in Number & Dates Validator
        set: val => Math.round(val * 100) / 100
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a maximum group size']
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum: { // Built-in String Validator
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty is either: easy, medium or difficult'
        }
    },
    summary: {
        type: String,
        trim: true, // remove whitespace at the beginning & the end of a string
        required: [true, 'A tour must have a summary']
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a cover image']
    },
    images: [String],
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    startLocation: { // GeoJSON format
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [ // Embedded doc creation must be inside an Array,
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    /* Embeddeing the guide(s) */
    // guides: Array

    /* Child Referencing the guide(s) */
    guides: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    /* Child referencing the reviews */
    // reviews: [
    //     {
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: 'Review'
    //     }
    // ],

}, { // Options to output virtual properties not stored in db but based on the calculation of other properties
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

/* Tours indexes */
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

/* Virtual properties, use regular fct° because arrow fct° doesn't have "this" keyword */
// But cannot use it in a query because it's not technically part of the base
tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
});

/* Virtual populate the reviews of a tour: connection to the Review model to retrieve the tour reviews */
tourSchema.virtual('reviews', {
    ref: 'Review', // name of the model we're referncing to
    foreignField: 'tour', // name of the field in the Review model in which the id of the tour is stored
    localField: '_id' // the id itself of this model
});

/* Document Pre middleware, running before .save() and .create(), has access to "this" keyword */
tourSchema.pre('save', function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

/* Document Post middleware, running after the doc being processed, has access to the doc executed */
tourSchema.post('save', function (doc, next) {
    // console.log(doc);
    next();
});

/* Document Pre middleware, to save the embedded guide(s) document(s) into the a new tour,
But have to update manually when a guide update his profile => better do this by referencing */
// tourSchema.pre('save', async function(next) {
//     const guidesPromises = this.guides.map(async id => await User.findById(id));
//     this.guides = await Promise.all(guidesPromises);    
//     next();
// });

/* Query Pre middleware, running before .find(), RegEx: /^find/ = string that starts w find, findOne, findMany... */
tourSchema.pre(/^find/, function (next) {
    this.find({ secretTour: { $ne: true } });
    next();
});

/* Query Pre middleware, for populating the guides documents into a find query when we use a tourController method that start w find */
tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    });
    next();
})

/* Aggregation middleware, adding stages to all the aggration in one place */
// tourSchema.pre('aggregate', function (next) {
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } })
//     // console.log(this.pipeline());
//     next();
// });

/* Definition of a model(first letter capitalized) to create a document */
// MongoDB will use this model to create a collection w the same name but in plural : tours
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;