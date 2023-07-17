const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    van: { type: mongoose.Schema.Types.ObjectId, ref: 'Van' },
    startDate: Date,
    endDate: Date,
    totalPrice: Number
});

const Booking = mongoose.model('Booking', BookingSchema);

module.exports = {Booking};