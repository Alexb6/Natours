const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name!'],
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please provide an email!'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email!']
    },
    photo: String,
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please enter an password!'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password!'],
        validate: {
            // Custom validator ONLY WORKS ON User.create() or User.save() !!! 
            validator: function (passwordToConfirm) {
                return passwordToConfirm === this.password; // if false, then send a validation error
            },
            message: 'The passwords are not identical!'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});
/* Document Pre middleware for hashing the password */
userSchema.pre('save', async function (next) {
    /* Cdtion for this hashing function to run only if the password is created or modified */
    if (!this.isModified('password')) return next();
    
    /* Hash the password with the random string (salt=12), higher the value, stronger the password but takes more time to hash */
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined; // deleting it, no need to store (persist) that value in base
    next();
});

/* Document Pre middleware for changing the passwordChangedAt when resetting the password */
userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next(); // this.isNew: when the document is new

    this.passwordChangedAt = Date.now() - 1000; // - 1 sec to make sure this time is before the time jwt is issued in the next step (in authController)
    next();
});

/* Document Pre middleware for queries to display active users only */
userSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } }); // this points to the current query
    next();
});

/* Instance method (available on all documents of a collection) to compare the login password & the base one */
userSchema.methods.correctPassword = async function (loginPassword, userPassword) {
    // comparison of loginPassword (not hashed) vs userPassword (hashed in the base), return true or false
    return await bcrypt.compare(loginPassword, userPassword);
};

/* Instance method to check if the password has changed after the token has been issued */
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) { // If the user changed the password this field will exists
        const passwordChangedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10); // /1000 to get the time into sec
        // console.log(passwordChangedTimestamp, JWTTimestamp);
        return JWTTimestamp < passwordChangedTimestamp; // true if the password changed after the token has been issued
    }
    // return false if the user has not changed the password after the token has been issued
    return false;
};

/* Instance method to generate the ramdom reset token (using crypto) for forgetPassword process */
userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex'); // node built-in token gen(here w 32 chracters), less powerful than jwt
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex'); // hashing the token
    this.passwordResetExpires = Date.now() + 2 * 60 * 60 * 1000; // expires in 2 hours (in milliseconds) 

    // console.log({resetToken}, this.passwordResetToken);

    return resetToken; // Uncripted version sent to user and the hashed one is store in the base
}

const User = mongoose.model('User', userSchema);

module.exports = User;