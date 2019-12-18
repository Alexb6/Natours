const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './../../config.env' });

const Tour = require('../../models/tourModel');

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}).then(() => console.log('Database connection successful!'));

// Read the Json data file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));

// Export data to DB
const exportData = async () => {
    try {
        await Tour.create(tours);
        console.log('Data successfully exported!');
    } catch (err) {
        console.log(err);
    }
    process.exit(); // exit the process like Ctrl+C
}

// Delete all data from DB
const deleData = async () => {
    try {
        await Tour.deleteMany();
        console.log('Data successfully deleted!');
    } catch (err) {
        console.log(err);
    }
    process.exit();
}

// console.log(process.argv);
if (process.argv[2] === '--export') {
    exportData();
} else if (process.argv[2] === '--delete') {
    deleData();
}

