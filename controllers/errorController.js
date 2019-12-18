const AppError = require('./../utils/appError');

/* Error for the dev, more complete error message */
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
};
/* Error for the client, more human like message */
const sendErrorProd = (err, res) => {
    if (err.isOperational) { // Operational trusted error: send message to client
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    } else { // Programming or unknown error, no need for error details
        console.error('Error: ', error);
        res.status(500).json({
            status: 'Error',
            message: 'Something went wrong!'
        });
    }
};
/*  Handling the wrong or invalid Id error */
const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`; // path & value prop from the error obj 
    return new AppError(message, 400);
};
/*  Handling the duplicate field error */
const handleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400);
}
/* Handling mongoose validation errors */
const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message)
    const message = `Invalid input data: ${errors.join('. ')}`;
    return new AppError(message, 400);
}
/* JWT handling error */
const handleJWTError = () => new AppError('Invalid Jwt token, please login again!', 401);
/* JWT handling expiration error */
const handleJWTExpiredError = () => new AppError('Your token is expired, please login again!', 401);


/* Error handling middleware, w err at the first arg */
const globalErrorHandler = (err, req, res, next) => {
    // console.log(err.stack);
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err }; // soft copy of the built-in err
        if (error.name === 'CastError') error = handleCastErrorDB(error); // CastError is an invalid id prop from the error obj
        if (error.code === 11000) error = handleDuplicateFieldsDB(error); // Mongo DB driver error code for a duplicate field
        if (error.name = 'ValidationError') error = handleValidationErrorDB(error); // Mongoose validation error
        sendErrorProd(error, res);
        if (error.name === 'JsonWebTokenError') error = handleJWTError(); // Jwt error
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError(); // Jwt expired error
    }
};

module.exports = globalErrorHandler;