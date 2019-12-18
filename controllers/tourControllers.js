const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');


/* Middleware: Prefilling query string for the 5 best cheap tours */
exports.aliasTopTours = async (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
    /* EXECUTE THE QUERY */
    const features = new APIFeatures(Tour.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const tours = await features.query;
    console.log(req.query);

    /* SEND THE RESPONSE */
    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            tours: tours
        }
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    // console.log(req.params);

    /* convert req.params from a string to a number by multiplying it by a number*/
    // const tour = tours.find(el => el.id === req.params.id * 1)
    
    const tour = await (await Tour.findById(req.params.id)).populate('reviews');
    // or we can write: await Tour.findOne({_id: req.params.id})

    if (!tour) {
        return next(new AppError('No tour found with this Id', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            tour // ES6 when property name is the same as the value name, no need to add it!
        }
    });
});

exports.createTour = catchAsync(async (req, res, next) => {
    const newTour = await Tour.create(req.body);

    res.status(201).json({
        status: 'success',
        data: {
            tour: newTour
        }
    });
});

exports.updateTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
        /* Validators options here */
        new: true, // return a new modified document to the client
        runValidators: true // run the validator in the Schema to check that the value is in the right format
    });

    if (!tour) {
        return next(new AppError('No tour found with this Id', 400));
    }

    res.status(200).json({
        status: 'success',
        data: {
            tour: tour
        }
    });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findByIdAndDelete(req.params.id);

    if (!tour) {
        return next(new AppError('No tour found with this Id', 400));
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});

/* Aggregation Pipeline Matching and Grouping */
exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        { $match: { ratingsAverage: { $gte: 4.5 } } },
        {
            $group: {
                _id: { $toUpper: '$difficulty' },
                numTours: { $sum: 1 },
                numRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
            }
        },
        { $sort: { avgPrice: 1 } },
        // { $match: { _id: { $ne: 'EASY' } } }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
    });
});

/* Aggregation Pipeline Unwinding and Projecting */
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = req.params.year * 1;

    const plan = await Tour.aggregate([
        { $unwind: '$startDates' },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numToursStart: { $sum: 1 },
                tours: { $push: '$name' }, // display the name of the tours of this month in an array
                dates: { $push: '$startDates' } // display the dates of the tours of this month in an array
            }
        },
        { $addFields: { month: '$_id' } },
        {
            $project: {
                _id: 0
            }
        },
        { $sort: { numToursStart: -1 } }
    ]);

    res.status(200).json({
        status: 'success',
        result: plan.length,
        data: {
            plan
        }
    });
})


