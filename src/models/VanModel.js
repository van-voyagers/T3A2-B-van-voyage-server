const mongoose = require("mongoose");

const VanSchema = new mongoose.Schema({
  vanName: { type: String, required: true, trim: true, match: /^[\w\s]+$/ },
  pricePerDay: { type: Number, required: true, min: 0 },
  bookedDates: [
    {
      startDate: { type: Date },
      endDate: { type: Date },
    },
  ],
});

// Add a custom instance method to remove bookedDates from the array
VanSchema.methods.removeBookedDates = async function (startDate, endDate) {
  this.bookedDates = this.bookedDates.filter((booking) => {
    const bookingStartDate = new Date(booking.startDate).getTime();
    const bookingEndDate = new Date(booking.endDate).getTime();
    const targetStartDate = new Date(startDate).getTime();
    const targetEndDate = new Date(endDate).getTime();

    // Keep only the bookedDates that don't match the deleted booking
    return !(
      bookingStartDate === targetStartDate && bookingEndDate === targetEndDate
    );
  });
  await this.save(); // save the changes after removing the dates
};

// Custom validation for bookedDates
VanSchema.path("bookedDates").validate(function (bookedDates) {
  // Check if all bookedDates have valid startDate and endDate
  for (const booking of bookedDates) {
    if (!booking.startDate || !booking.endDate) {
      return false;
    }
  }

  // Check if each booking is at least 2 days in length and not longer than 3 weeks (21 days)
  for (const booking of bookedDates) {
    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);

    if (endDate.getTime() - startDate.getTime() < 2 * 24 * 60 * 60 * 1000) {
      return false; // Booking is less than 2 days
    }

    if (endDate.getTime() - startDate.getTime() > 21 * 24 * 60 * 60 * 1000) {
      return false; // Booking is longer than 3 weeks
    }
  }

  return true;
}, "Invalid booking duration: A booking must be for at 2 days and cannot exceed 3 weeks.");

// Compile the schema into a model.
const Van = mongoose.model("Van", VanSchema);

module.exports = { Van };
