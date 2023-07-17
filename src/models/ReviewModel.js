const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
  rating: Number,
  comment: String,
});

const Review = mongoose.model("Review", ReviewSchema);

module.exports = { Review };
