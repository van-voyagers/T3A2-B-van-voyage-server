const express = require("express");
const router = express.Router();

const { Review } = require("../models/ReviewModel");
const { Booking } = require("../models/BookingModel");
const { User } = require("../models/UserModel");

// Auth middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Missing Authorization Header" });
  }
  
  // potentially validate auth token and fetch user from db?

  next();
};


// GET all reviews.
router.get("/all", async (req, res) => {
  try {
    const reviews = await Review.find().populate("booking");
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
});

// GET a review by ID.
router.get("/:id", authenticate, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).populate("booking");
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
});

// POST to create a review.
router.post("/create", authenticate, async (req, res) => {
  const { booking, rating, comment } = req.body;

  if (!booking || !rating) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const bookingDoc = await Booking.findById(booking).populate('user');
    if (!bookingDoc) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    const review = new Review({
      booking: bookingDoc._id,
      rating,
      comment,
      user: bookingDoc.user._id,
    });

    const savedReview = await review.save();

    // return the review along with the user's first name
    res.json({
      ...savedReview.toObject(),
      userFirstName: bookingDoc.user.firstName,
    });
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
});

// PUT to update a review.
// Expects the rating and/or comment in the request body.
router.put("/update/:id", authenticate, async (req, res) => {
  const { rating, comment } = req.body;

  let update = {};
  if (rating !== undefined) update.rating = rating;
  if (comment !== undefined) update.comment = comment;

  try {
    const review = await Review.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
});

// DELETE a review.
router.delete("/delete/:id", authenticate, async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
});

module.exports = router;
