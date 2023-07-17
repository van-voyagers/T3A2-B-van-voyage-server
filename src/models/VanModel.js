const mongoose = require("mongoose");

const VanSchema = new mongoose.Schema({
    vanName: String,
    pricePerDay: Number
});

const Van = mongoose.model('Van', VanSchema);

module.exports = {Van};