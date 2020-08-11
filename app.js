const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

/* Adding all express methods into our app */
const app = express();

/* View engine settting */
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

/* ------------------------------------------
Middlewares
------------------------------------------ */
/* Set security HTTP headers */
app.use(helmet());

/* Development logging infos middleware for the req */
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

/* Limit req from the same IP: Prevent Brute force & DOS attacks w express-rate-limit */
const limiter = rateLimit({
    max: 100, // 100 req from the same IP
    windowMs: 60 * 60 * 1000, // 1 hour im milliseconds
    message: 'Too many request from this IP, please try again in an hour!'
})
app.use('/api', limiter);

/* Body parser middleware: for express to embody the data into the req.body */
app.use(express.json({ limit: '10kb' })); // limit the size of data to 10kb
/* URL Encoded middleware */
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
/* Cookie parser, parse the data from the cookie  */
app.use(cookieParser());

/* Data sanitasation against NoSQL query injection {"email": {"$gt": ""}} & a valid password,
will look at the req.body, req.query string & req.params then filter out dollar sign '$' and dots '.' */
app.use(mongoSanitize());

/* Data sanitasation against XSS attacks, clean the user input from the malicious html code w JS scripts attached to it  */
app.use(xss());

/* Prevent parameter pollution: clear up the query string by using the last query,
except fot the whitelist: set the props we allowed to have duplicate in the query string */
app.use(hpp({
    whitelist: ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price']
}));

/* Using static file  from a folder */
app.use(express.static(`${__dirname}/public`));

/* My middlewares, declared w. use(), next() is needed in order to go the next middleware */
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    // console.log(req.headers);    
    next();
});

/* Use of compression package */
app.use(compression());

/* Routes mounting by using middleware */
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

/* Error routes handling middleware, reach here when the other routes don't matched */
app.all('*', (req, res, next) => {
    // const err = new Error(`Can't find ${req.originalUrl} route on the server!`);
    // err.status = 'Fail';
    // err.statusCode = 404;
    next(new AppError(`Can't find ${req.originalUrl} route on the server!`, 404));
})

/* Express error handling middleware use of */
app.use(globalErrorHandler);

module.exports = app;
