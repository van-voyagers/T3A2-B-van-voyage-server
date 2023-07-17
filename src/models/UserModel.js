const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    password: String,
    dob: Date,
    address: String,
    license: Number,
    admin: Boolean
});

const User = mongoose.model('User', UserSchema);

module.exports = {User};