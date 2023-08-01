const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const { Review } = require("../models/ReviewModel");
const { Booking } = require("../models/BookingModel");
const { User } = require("../models/UserModel");

// Auth middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Missing Authorization Header" });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded._id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Error authenticating: " + error.message });
  }
};

// GET all reviews.
router.get("/all", async (req, res) => {
  try {
    const reviews = await Review.find().populate({
      path: "booking",
      populate: {
        path: "user",
        model: "User",
        select: "firstName -_id",
      },
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
});

// GET a review by ID (admin only).
router.get("/:id", authenticate, async (req, res) => {
  if (!req.user.admin) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  try {
    const review = await Review.findById(req.params.id).populate({
      path: "booking",
      populate: {
        path: "user",
        model: "User",
        select: "firstName -_id",
      },
    });
    if (!review) {
      return res
        .status(404)
        .json({ message: `Review ${req.params.id} not found` });
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

  if (!mongoose.Types.ObjectId.isValid(booking)) {
    return res.status(400).json({ message: "Invalid booking ID" });
  }

  if (rating < 1 || rating > 5) {
    return res
      .status(400)
      .json({ message: "Rating should be between 1 and 5" });
  }

  if (comment && typeof comment !== "string") {
    return res.status(400).json({ message: "Comment should be a string" });
  }

  try {
    const bookingDoc = await Booking.findById(booking).populate("user");
    if (
      !bookingDoc ||
      bookingDoc.user._id.toString() !== req.user._id.toString()
    ) {
      return res
        .status(400)
        .json({
          message: `User is unable to make a review for this booking ID: ${req.params.id}`,
        });
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

// PUT to update a review (admin only).
router.put("/update/:id", authenticate, async (req, res) => {
  if (!req.user.admin) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const { rating, comment } = req.body;

  let update = {};
  if (rating !== undefined) {
    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating should be between 1 and 5" });
    }
    update.rating = rating;
  }
  if (comment !== undefined) {
    if (typeof comment !== "string") {
      return res.status(400).json({ message: "Comment should be a string" });
    }
    update.comment = comment;
  }

  try {
    const review = await Review.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });

    if (!review) {
      return res
        .status(404)
        .json({ message: `Review not found: ${req.params.id}` });
    }

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
});

// DELETE a review (admin only).
router.delete("/delete/:id", authenticate, async (req, res) => {
  if (!req.user.admin) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res
        .status(404)
        .json({ message: `Review ${req.params.id} not found` });
    }
    res.json({ message: `Review deleted successfully: ${req.params.id}` });
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
});

module.exports = router;
