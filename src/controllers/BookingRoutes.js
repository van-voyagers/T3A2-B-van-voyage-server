const express = require('express');
const router = express.Router();
const bookingFunctions = require('../controllers/BookingFunctions');

// Route to get all bookings
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await bookingFunctions.getAllBookings();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to get a specific booking by ID
router.get('/bookings/:id', async (req, res) => {
  try {
    const booking = await bookingFunctions.getBookingById(req.params.id);
    if (booking) {
      res.json(booking);
    } else {
      res.status(404).json({ message: 'Booking not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to create a new booking
router.post('/bookings', async (req, res) => {
  const { userID, vanID, startDate, endDate, totalPrice } = req.body;
  try {
    const newBooking = await bookingFunctions.createBooking(userID, vanID, startDate, endDate, totalPrice);
    res.status(201).json(newBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Route to update a booking by ID
router.put('/bookings/:id', async (req, res) => {
  try {
    const updatedBooking = await bookingFunctions.updateBooking(req.params.id, req.body);
    res.json(updatedBooking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Route to delete a booking by ID
router.delete('/bookings/:id', async (req, res) => {
  try {
    const deletedBooking = await bookingFunctions.deleteBooking(req.params.id);
    res.json(deletedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
