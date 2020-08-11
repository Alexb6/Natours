const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.createOne = Model => catchAsync(async (req, res, next) => {
    const document = await Model.create(req.body);

    res.status(201).json({
        status: 'success',
        data: {
            document
        }
    });
});

exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {    
    let query = Model.findById(req.params.id);
    if(popOptions) query = query.populate(popOptions); // popOptions: populate options
    const document = await query;

    if (!document) {
        return next(new AppError('No document found with this Id', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            document
        }
    });
});

exports.getAll = Model => catchAsync(async (req, res, next) => {
    /* To allow nested reviews on tour route */
    let filter = {}; // Empty object will req all reviews    
    if (req.params.tourId) filter = { tour: req.params.tourId }; // Thanks to mergeParams: true, we have access to tourId

    /* EXECUTE THE QUERY */
    const features = new APIFeatures(Model.find(filter), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    
    const documents = await features.query;
    // console.log(req.query);

    /* SEND THE RESPONSE */
    res.status(200).json({
        status: 'success',
        results: documents.length,
        data: {
            documents
        }
    });
});

/* Do NOT use this for password reset because it's not a save or a create method */
exports.updateOne = Model => catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
        /* Validators options here */
        new: true, // return a new modified document to the client
        runValidators: true // run the validator in the Schema to check that the value is in the right format
    });

    if (!document) {
        return next(new AppError('No document found with this Id', 400));
    };

    res.status(200).json({
        status: 'success',
        data: {
            document
        }
    });
});

exports.deleteOne = Model => catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndDelete(req.params.id);

    if (!document) {
        return next(new AppError('No document found with this Id', 400));
    };

    res.status(204).json({
        status: 'success',
        data: null
    });
});

