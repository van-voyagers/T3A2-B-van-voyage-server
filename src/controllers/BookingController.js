const { Booking } = require('../models/BookingModel');
const { User } = require('../models/UserModel');
const { Van } = require('../models/VanModel');

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

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

    // Convert startDate and endDate to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Calculate the number of days between startDate and endDate
    const oneDay = 24 * 60 * 60 * 1000; // One day in milliseconds
    const days = Math.floor(Math.abs((end - start) / oneDay));

    // Calculate the totalPrice by multiplying days with van's pricePerDay
    const totalPrice = days * van.pricePerDay;

    return totalPrice;
  } catch (error) {
    throw new Error('Error calculating total price');
  }
}


async function createBooking(vanID, startDate, endDate, req) {
  try {
    // Check if vanID is valid object type
    console.log('Received vanID:', vanID)
    if (!mongoose.Types.ObjectId.isValid(vanID)) {
      throw new Error('Invalid van ID');
    }

    // Retrieve userID from the token
    const userID = req.user._id;


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
      user: userID, // Set the user ID obtained from the token
      van: vanID,
      startDate: startDate,
      endDate: endDate,
      totalPrice: totalPrice,
    });

    await booking.save();
    return booking;
  } catch (error) {
    throw new Error('Error creating booking: ' + error.message);
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

// Route to get all bookings
router.get('/all', authenticate, async (req, res) => {
  try {
    if (req.user.admin) {
      const bookings = await getAllBookings();
      res.json(bookings);
    } else {
      const userBookings = await getAllBookingsForUser(req.user._id);
      res.json(userBookings);
    } 
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to search bookings (admin only)
router.get('/search', authenticate, async (req, res) => {
  try {
    if (!req.user.admin) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ message: 'Missing query parameter' });
    }

    const isAdmin = req.user.admin;
    const bookings = await searchBookings(query, isAdmin);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to get a specific booking by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const booking = await getBookingById(req.params.id, req.user._id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
});

// Route to create a new booking
router.post('/new-booking', authenticate, async (req, res) => {
  const { vanID, startDate, endDate } = req.body;
  try {
    const newBooking = await createBooking(vanID, startDate, endDate, req);
    res.status(201).json(newBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


// Route to update a booking by ID
router.put('/:id', authenticate, async (req, res) => {
  try {
    // Check if user is admin, only admins may update booking
    if (!req.user.admin) {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    const updatedBooking = await updateBooking(req.params.id, req.body);
    res.json(updatedBooking);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Route to delete a booking by ID
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const booking = await getBookingById(req.params.id, req.user._id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (!req.user.admin && booking.user.toString() !==req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const deletedBooking = await deleteBooking(req.params.id);
    res.json(deletedBooking);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

function authenticate(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Please authenticate' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
}


module.exports = router;


