/* Class for translating route querying into monggose querying logic */
class APIFeatures {

    constructor(query, queryString) {
        this.query = query; // query from mongoose
        this.queryString = queryString; // queryString from express (coming from the route: req.query)
    }
    /* Creation of a querying method for each functionnality */
    filter() {
        const queryObj = { ...this.queryString }; /* shallow copy using spread syntax or Object.assign() */
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(el => delete queryObj[el]);

        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

        this.query = this.query.find(JSON.parse(queryStr));

        return this; // return the querying object for methods chaining in the query execution
    }

    sort() {
        if (this.queryString.sort) {
            /* Mongoose requests the query with a space separation, and not a comma like in Postman */
            const sortBy = this.queryString.sort.split(',').join(' '); // 
            // console.log('sortBy: ', sortBy);
            this.query = this.query.sort(sortBy);
            /* Mongoose: sort('-price ratingsAverage'), minus sign is for desc values */
        } else {
            this.query = this.query.sort('price'); // Default sorting by price
        }
        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v'); // excluding this field of the fields with the minus sign
        }
        return this;
    }

    paginate() {
        const page = this.queryString.page * 1 || 1; // coerce the string into a number by * 1 || default page = 1
        const limit = this.queryString.limit * 1 || 100; // default limit = 100
        const skip = (page - 1) * limit;
        // If we need: page=3&limit=10 then we need to: skip(20).limit(10)
        this.query = this.query.skip(skip).limit(limit);

        return this;
    }
}

module.exports = APIFeatures;