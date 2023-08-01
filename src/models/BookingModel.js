const mongoose = require('mongoose')

const BookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  van: { type: mongoose.Schema.Types.ObjectId, ref: 'Van', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalPrice: { type: Number, required: true, min: 0 },
})

// Custom validation method for checking start and end dates
BookingSchema.path('endDate').validate(function (value) {
  return this.startDate <= value
}, 'End date must be after the start date.')

const Booking = mongoose.model('Booking', BookingSchema)

module.exports = { Booking }
