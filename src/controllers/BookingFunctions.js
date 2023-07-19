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

async function calculateTotalPrice(vanID, startDate, endDate) {
  try {
    // Find the van by its ID to get the pricePerDay
    const van = await Van.findById(vanID);
    if (!van) {
      throw new Error('Van not found');
    }

    // Calculate the number of days between startDate and endDate
    const oneDay = 24 * 60 * 60 * 1000; // One day in milliseconds
    const days = Math.round(Math.abs((endDate - startDate) / oneDay)) + 1;

    // Calculate the totalPrice by multiplying days with van's pricePerDay
    const totalPrice = days * van.pricePerDay;

    return totalPrice;
  } catch (error) {
    throw new Error('Error calculating total price');
  }
}

async function createBooking(userID, vanID, startDate, endDate) {
  try {
    // vanExists & userExists may not be necessary in final build
    // Check if the van exists
    const vanExists = await Van.exists({ _id: vanID });
    if (!vanExists) {
      throw new Error('The specified van does not exist');
    }
  
    // Check if the user exists
    const userExists = await User.exists({ _id: userID });
    if (!userExists) {
      throw new Error('The specified user does not exist');
    }

  const totalPrice = await calculateTotalPrice(vanID, startDate, endDate);

  const booking = new Booking({
    user: userID,
    van: vanID,
    startDate: startDate,
    endDate: endDate,
    totalPrice: totalPrice,
  });

  await booking.save();
  return booking;
} catch (error) {
  throw new Error('Error creating booking');
}


}

async function updateBooking(bookingID, updates) {
  const booking = await Booking.findByIdAndUpdate(bookingID, updates, { new: true }).exec();
  return booking;
}

async function deleteBooking(bookingID) {
  return await Booking.findByIdAndDelete(bookingID).exec();
}


async function searchBookings(query, isAdmin) {
  // Define search criteria for string fields
  const stringCriteria = {
    $or: [
      { startDate: { $regex: new RegExp(query, "i") } },
      { endDate: { $regex: new RegExp(query, "i") } },
      // Add more search criteria as needed
    ],
  };

  if (isAdmin) {
    // Admins can also search by user ID or van ID
    if (mongoose.Types.ObjectId.isValid(query)) {
      stringCriteria.$or.push({ user: query });
      stringCriteria.$or.push({ van: query });
    }
  }

  try {
    const bookings = await Booking.find(stringCriteria).exec();

    if (bookings.length === 0) {
      return [];
    }

    return bookings;
  } catch (err) {
    console.error(err);
    throw new Error('An error occurred during the search');
  }
}

module.exports = {
  getAllBookings,
  getAllBookingsForUser,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  searchBookings
};