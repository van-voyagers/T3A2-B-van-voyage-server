const express = require('express');
const router = express.Router();
const bookingFunctions = require('../controllers/BookingFunctions');
const userController = require('../controllers/UserController')

// Route to get all bookings
router.get('/all', userController.authenticate, async (req, res) => {
  try {
    if (req.user.admin) {
      const bookings = await bookingFunctions.getAllBookings();
      res.json(bookings);
    } else {
      const userBookings = await bookingFunctions.getAllBookingsForUser(req.user._id);
      res.json(userBookings);
    } 
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to search bookings (admin only)
router.get('/search', userController.authenticate, async (req, res) => {
  try {
    if (!req.user.admin) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ message: 'Missing query parameter' });
    }

    const isAdmin = req.user.admin;
    const bookings = await bookingFunctions.searchBookings(query, isAdmin);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to get a specific booking by ID
router.get('/:id', userController.authenticate, async (req, res) => {
  try {
    const booking = await bookingFunctions.getBookingById(req.params.id, req.user._id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
});

// Route to create a new booking
router.post('/new-booking', userController.authenticate, async (req, res) => {
  const { userID, vanID, startDate, endDate } = req.body;
  try {
    const newBooking = await bookingFunctions.createBooking(userID, vanID, startDate, endDate);
    res.status(201).json(newBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Route to update a booking by ID
router.put('/:id', userController.authenticate, async (req, res) => {
  try {
    // Check if user is admin, only admins may update booking
    if (!req.user.admin) {
      return res.status(403).json({ message: 'Unauthorized' })
    }

    const updatedBooking = await bookingFunctions.updateBooking(req.params.id, req.body);
    res.json(updatedBooking);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Route to delete a booking by ID
router.delete('/:id', userController.authenticate, async (req, res) => {
  try {
    const booking = await bookingFunctions.getBookingById(req.params.id, req.user._id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (!req.user.admin && booking.user.toString() !==req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const deletedBooking = await bookingFunctions.deleteBooking(req.params.id);
    res.json(deletedBooking);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
