const mongoose = require("mongoose");

const VanSchema = new mongoose.Schema({
  vanName: String,
  pricePerDay: Number,
  bookedDates: [
    {
      startDate: { type: Date },
      endDate: { type: Date },
    }
  ]
});

const Van = mongoose.model("Van", VanSchema);

module.exports = { Van };
