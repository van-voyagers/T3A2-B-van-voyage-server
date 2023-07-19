const { Booking } = require('../models/BookingModel');
const { User } = require('../models/UserModel');
const { Van } = require('../models/VanModel');

async function getAllBookings() {
  return await Booking.find({}).exec();
}

async function getBookingById(bookingID) {
  return await Booking.findById(bookingID).exec();
}

async function createBooking(userID, vanID, startDate, endDate, totalPrice) {
  const booking = new Booking({
    user: userID,
    van: vanID,
    startDate: startDate,
    endDate: endDate,
    totalPrice: totalPrice,
  });

  await booking.save();
  return booking;
}

async function updateBooking(bookingID, updates) {
  const booking = await Booking.findByIdAndUpdate(bookingID, updates, { new: true }).exec();
  return booking;
}

async function deleteBooking(bookingID) {
  return await Booking.findByIdAndDelete(bookingID).exec();
}

module.exports = {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
};