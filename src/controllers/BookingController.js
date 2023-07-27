const express = require('express')
const jwt = require('jsonwebtoken')
const router = express.Router()
const mongoose = require('mongoose')

const { Booking } = require('../models/BookingModel')
const { User } = require('../models/UserModel')
const { Van } = require('../models/VanModel')

// Middleware function to authenticate the user making the request.
// Verifies the JWT from the Authorization header and attaches the user to the request object.
async function authenticate(req, res, next) {
  try {
    const header = req.header('Authorization')

    if (!header) {
      return res.status(401).json({ message: 'Missing authorization header' })
    }

    const token = header.replace('Bearer ', '')
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await User.findOne({ _id: decoded._id })
    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    req.user = user
    next()
  } catch (e) {
    res.status(401).json({ message: 'Error authenticating: ' + e.message })
  }
}

// Total price calculation used in createBooking()
async function calculateTotalPrice(vanID, startDate, endDate) {
  try {
    // Find the van by its ID to get the pricePerDay
    const van = await Van.findById(vanID)
    if (!van) {
      throw new Error('Van not found')
    }

    // Convert startDate and endDate to Date objects
    const start = new Date(startDate)
    const end = new Date(endDate)

    // Calculate the number of days between startDate and endDate
    const oneDay = 24 * 60 * 60 * 1000 // One day in milliseconds
    const days = Math.floor(Math.abs((end - start) / oneDay))

    // Calculate the totalPrice by multiplying days with van's pricePerDay
    const totalPrice = (days + 1) * van.pricePerDay

    return totalPrice
  } catch (error) {
    throw new Error('Error calculating total price')
  }
}

async function createBooking(vanID, startDate, endDate, req) {
  try {
    // Check if vanID is a valid object type
    console.log('Received vanID:', vanID)
    if (!mongoose.Types.ObjectId.isValid(vanID)) {
      throw new Error('Invalid van ID')
    }

    // Retrieve userID from the token
    const userID = req.user._id

    // Check if the van exists
    const vanExists = await Van.exists({ _id: vanID })
    if (!vanExists) {
      throw new Error('The specified van does not exist')
    }

    // Check if the user exists
    const userExists = await User.exists({ _id: userID })
    if (!userExists) {
      throw new Error('The specified user does not exist')
    }

    const totalPrice = await calculateTotalPrice(vanID, startDate, endDate)
    const booking = new Booking({
      user: userID, // Set the user ID obtained from the token
      van: vanID,
      startDate: startDate,
      endDate: endDate,
      totalPrice: totalPrice,
    })

    // Check if the van is available for the given dates
    const van = await Van.findById(vanID);
    if (!van) {
      throw new Error("The specified van does not exist");
    }

    const isVanAvailable = van.bookedDates.every((booking) => {
      const bookedStart = new Date(booking.startDate);
      const bookedEnd = new Date(booking.endDate);
      const newStart = new Date(startDate);
      const newEnd = new Date(endDate);
      return newStart > bookedEnd || newEnd < bookedStart;
    });

    if (!isVanAvailable) {
      throw new Error("The van is not available for the selected dates");
    }

    // Update the van's bookedDates field with the new booking
    van.bookedDates.push({ startDate, endDate });
    await van.save();
    
    await booking.save()
    return booking
  } catch (error) {
    throw new Error('Error creating booking: ' + error.message)
  }
}

// GET all bookings.
// This endpoint is accessible only to admin users.
// No query parameters are required.
router.get('/admin/all', authenticate, async (req, res) => {
  if (!req.user.admin) {
    return res.status(403).json({ message: 'Unauthorized' })
  }

  const bookings = await Booking.find()
  if (!bookings) {
    return res.status(400).json({ message: 'No bookings found' })
  }

  res.json(bookings)
})

// Query bookings by value (admin only)
router.get("/admin/search", authenticate, async (req, res) => {
  if (!req.user.admin) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ message: "Missing query parameter" });
  }

  const startDateQuery = new Date(query);
  const endDateQuery = new Date(query);
  endDateQuery.setDate(endDateQuery.getDate() + 1);

  const dateCriteria = {
    $or: [
      { startDate: { $gte: startDateQuery, $lt: endDateQuery } },
      { endDate: { $gte: startDateQuery, $lt: endDateQuery } },
    ],
  };

  let bookings;
  try {
    // Try exact match on ObjectId fields
    if (mongoose.Types.ObjectId.isValid(query)) {
      bookings = await Booking.find({
        $or: [{ 'van': query }, { 'user': query }]
      });
    } else {
      bookings = await Booking.find(dateCriteria);
    }

    if (bookings.length === 0) {
      return res.status(404).json({ message: "No bookings found" });
    }

    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred during the search" });
  }
});

router.get('/vans', async (req, res) => {
  const vans = await Van.find()
  res.json(vans)
})


// To be passed to client to retrieve van information after selecting from dropdown
router.get('/van/:vanID', async (req, res) => {
  const bookings = await Booking.find({ van: req.params.vanID })
  res.json(bookings)
})

// Get my bookings (for regular user to view their bookings)
router.get('/my-bookings', authenticate, async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
  res.json(bookings)
})

// Create new booking (user, to use userID from token)
router.post('/new-booking', authenticate, async (req, res) => {
  const { vanID, startDate, endDate } = req.body
  try {
    const newBooking = await createBooking(vanID, startDate, endDate, req)
    res.status(201).json(newBooking)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// Create new booking (admin, to have admin enter in userID)
router.post('/admin/new-booking', authenticate, async (req, res) => {
  if (!req.user.admin) {
    return res.status(403).json({ message: 'Unauthorized' })
  }

  const { vanID, startDate, endDate, userID } = req.body
  const adminReq = { ...req, user: { _id: userID } }
  try {
    const newBooking = await createBooking(vanID, startDate, endDate, adminReq)
    res.status(201).json(newBooking)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})

// Update booking by ID (admin only)
router.put('/admin/:id', authenticate, async (req, res) => {
  if (!req.user.admin) {
    return res.status(403).json({ message: 'Unauthorized' })
  }

  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: `Booking ${req.params.id} not found` });
    }

    // Save the original van ID, startDate, and endDate
    const originalVanID = booking.van;
    const originalStartDate = booking.startDate;
    const originalEndDate = booking.endDate;

    // Check if the vanID, startDate, or endDate have been updated
    const { vanID, startDate, endDate } = req.body;

    // If the van ID, startDate, or endDate has been updated, check and update the van's bookedDates field
    if (vanID || startDate || endDate) {
      const van = await Van.findById(originalVanID);

      // Remove the original booking from the van's bookedDates
      van.bookedDates = van.bookedDates.filter(
        (booking) =>
          !(
            booking.startDate.toString() === originalStartDate.toString() &&
            booking.endDate.toString() === originalEndDate.toString()
          )
      );

      // Check if the updated booking dates are available
      const isVanAvailable = van.bookedDates.every((booking) => {
        const bookedStart = new Date(booking.startDate);
        const bookedEnd = new Date(booking.endDate);
        const newStart = new Date(startDate || originalStartDate);
        const newEnd = new Date(endDate || originalEndDate);
        return newStart >= bookedEnd || newEnd <= bookedStart;
      });

      if (!isVanAvailable) {
        return res.status(400).json({ message: 'The van is not available for the selected dates' });
      }

      // Add the updated booking to the van's bookedDates
      van.bookedDates.push({
        startDate: startDate || originalStartDate,
        endDate: endDate || originalEndDate,
      });
      await van.save();
    }

    // Recalculate the total price based on the updated information
    const totalPrice = await calculateTotalPrice(
      vanID || originalVanID,
      startDate || originalStartDate,
      endDate || originalEndDate
    );

    // Update the totalPrice field in the request body
    req.body.totalPrice = totalPrice;

    // Update the booking with the new information
    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedBooking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred during the update' });
  }
});

// Delete booking by ID (user, regular user can only delete their bookings)
router.delete('/:id', authenticate, async (req, res) => {
  const booking = await Booking.findOne({
    _id: req.params.id,
    user: req.user._id,
  })
  if (!booking) {
    return res.status(404).json({ message: `Booking ${req.params.id} not found` })
  }

  await booking.deleteOne()
  res.json({ message: `Booking ${req.params.id} deleted successfully` })
})

// Delete booking by ID (admin, can delete any booking).
router.delete('/admin/:id', authenticate, async (req, res) => {
  if (!req.user.admin) {
    return res.status(403).json({ message: 'Unauthorized' })
  }

  const booking = await Booking.findById(req.params.id)
  if (!booking) {
    return res.status(404).json({ message: `Booking ${req.params.id} not found` })
  }

  await booking.deleteOne()
  res.json({ message: `Booking ${req.params.id} deleted successfully` })
})

module.exports = router
