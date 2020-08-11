const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

/* Handling uncaught exceptions : errors that happen in the synchronous code & are not handle anywhere 
Put here at the top because we want to catch all uncaught exceptions in the app */
process.on('uncaughtException', err => {
    console.log('Uncaught Exception! Server is being shut down...');
    console.log(err.name, err.message);
    process.exit(1); // 1 for uncaught exceptions
});



const app = require('./app');

// console.log(process.env);
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}).then(() => console.log('Database connection successful!'));

const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
    console.log(`App is running on port ${port}...`);
});

/* Handling asynchronous errors :  
When there is an unhandle rejection in the app, the process obj will emit an unhandleRejection obj */
process.on('unhandledRejection', err => {
    console.log('Unhandle rejection! Server is being shut down...');
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1); // 1 for uncaught exceptions
    });
});


