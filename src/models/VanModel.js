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

// Add a custom instance method to remove bookedDates from the array
VanSchema.methods.removeBookedDates = async function(startDate, endDate) {
  this.bookedDates = this.bookedDates.filter((booking) => {
    const bookingStartDate = new Date(booking.startDate).getTime();
    const bookingEndDate = new Date(booking.endDate).getTime();
    const targetStartDate = new Date(startDate).getTime();
    const targetEndDate = new Date(endDate).getTime();

    // Keep only the bookedDates that don't match the deleted booking
    return !(bookingStartDate === targetStartDate && bookingEndDate === targetEndDate);
  });
  await this.save(); // save the changes after removing the dates
};

// Compile the schema into a model.
const Van = mongoose.model("Van", VanSchema);

module.exports = { Van }
