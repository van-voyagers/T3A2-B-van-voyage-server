const { Booking } = require('../models/BookingModel');
const { User } = require('../models/UserModel');
const { Van } = require('../models/VanModel');

// Retrieve all bookings, admin only
async function getAllBookings() {
  return await Booking.find({}).exec();
}

// Retrieve all bookings pertaining to user
async function getAllBookingsForUser(userID) {
  return await Booking.find({ user: userID }).exec();
}

// Retrieve booking by ID, user can only retrieve own booking by ID.
async function getBookingById(bookingID, userID) {
  if (userID) {
    // Check if the user is an admin
    const user = await User.findById(userID);
    if (!user) {
      throw new Error('User not found');
    }
    if (user.admin) {
      return await Booking.findById(bookingID).exec();
    } else {
      return await Booking.findOne({ _id: bookingID, user: userID }).exec();
    }
  } else {
    // If userID is not provided, just get the booking without user check
    return await Booking.findById(bookingID).exec();
  }
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
  getAllBookingsForUser,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
};