const express = require('express')
const jwt = require('jsonwebtoken')
const router = express.Router()
const mongoose = require('mongoose')

const { Van } = require('../models/VanModel')
const { User } = require('../models/UserModel')
const { Booking } = require('../models/BookingModel') 

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

// GET all vans.
// This endpoint is accessible only to admin users.
// No query parameters are required.
router.get('/all', authenticate, async (req, res) => {
  if (!req.user.admin) {
    return res.status(403).json({ message: 'Unauthorized' })
  }

  const vans = await Van.find()
  if (!vans) {
    return res.status(400).json({ message: 'No vans found' })
  }

  res.json(vans)
})

// GET vans by search term.
// Admin users can search for vans by vanName or pricePerDay.
// The query is passed as a URL parameter like so: /search?q=<search_term>.
router.get('/search', authenticate, async (req, res) => {
  if (!req.user.admin) {
    return res.status(403).json({ message: 'Unauthorized' })
  }

  const query = req.query.q
  if (!query) {
    return res.status(400).json({ message: 'Missing query parameter' })
  }

  // Define search criteria for vanName field and pricePerDay
  const criteria = isNaN(query)
    ? { vanName: { $regex: new RegExp(query, 'i') } } // if query is non-numeric, search by vanName
    : { pricePerDay: query } // if query is numeric, search by pricePerDay

  try {
    const vans = await Van.find(criteria)

    if (vans.length === 0) {
      return res.status(404).json({ message: 'No vans found' })
    }

    res.json(vans)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'An error occurred during the search' })
  }
})

// POST a new van.
// Only admin users can access this endpoint.
// Requires `vanName` and `pricePerDay` in the request body.
router.post('/', authenticate, async (req, res) => {
  if (!req.user.admin) {
    return res.status(403).json({ message: 'Unauthorized' })
  }

  const { vanName, pricePerDay } = req.body
  if (
    !vanName ||
    typeof vanName !== 'string' ||
    !pricePerDay ||
    typeof pricePerDay !== 'number'
  ) {
    return res
      .status(400)
      .json({
        message:
          'Missing vanName or pricePerDay in the request body. vanName must be a string and pricePerDay must be a number > 0.',
      })
  }

  const newVan = new Van({ vanName, pricePerDay })

  try {
    const savedVan = await newVan.save()
    res.status(201).json(savedVan)
  } catch (e) {
    console.error(e)
    res
      .status(500)
      .json({ message: 'An error occurred while trying to save the van' })
  }
})

// PUT (update) a van.
// Only admin users can access this endpoint.
// Updates the `vanName` and/or `pricePerDay` of the van specified by the `id` route parameter.
router.put('/:id', authenticate, async (req, res) => {
  if (!req.user.admin) {
    return res.status(403).json({ message: 'Unauthorized' })
  }

  const { vanName, pricePerDay } = req.body
  if (
    !vanName ||
    typeof vanName !== 'string' ||
    !pricePerDay ||
    typeof pricePerDay !== 'number'
  ) {
    return res
      .status(400)
      .json({ message: 'Missing update fields in the request body' })
  }

  try {
    const updatedVan = await Van.findByIdAndUpdate(
      req.params.id,
      { vanName, pricePerDay },
      { new: true }
    )

    if (!updatedVan) {
      return res.status(404).json({ message: 'Van not found to update' })
    }

    res.json(updatedVan)
  } catch (e) {
    console.error(e)
    res
      .status(500)
      .json({ message: 'An error occurred while trying to update the van' })
  }
})

// DELETE a van.
// Only admin users can access this endpoint.
// Deletes the van specified by the `id` route parameter.
router.delete('/:id', authenticate, async (req, res) => {
  if (!req.user.admin) {
    return res.status(403).json({ message: 'Unauthorized' })
  }

  try {
    const vanToDelete = await Van.findById(req.params.id)

    if (!vanToDelete) {
      return res.status(404).json({ message: 'Unable to delete Van: Van not found'})
    }
    // Delete all bookings associated with the van
    await Booking.deleteMany({ van: req.params.id });

    await Van.findByIdAndDelete(req.params.id);

    res.json({ message: 'Van and associated bookings successfully deleted' })
  } catch (e) {
    console.error(e)
    res
      .status(500)
      .json({ message: 'An error occurred while trying to delete the van' })
  }
})

module.exports = router
