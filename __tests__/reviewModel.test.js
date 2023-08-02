const mongoose = require("mongoose");
const { Review } = require("../src/models/ReviewModel");

describe("Review Model Test", () => {
  // We're setting up sample data for a review
  const reviewData = {
    booking: new mongoose.Types.ObjectId("60d6ec9f1093044a02262978"),
    rating: 5,
    comment: "Great van, awesome trip!",
  };

  // Create a test that checks whether a new instance of the Review model correctly sets the properties
  test("new review has correct properties", () => {
    // Create a new instance of the Review model using the review data
    const review = new Review(reviewData);

    // Check if new Review instance has a `booking` property that matches the data we used to create it
    expect(review).toHaveProperty("booking", reviewData.booking);

    // Check if new Review instance has a `rating` property that matches the data we used to create it
    expect(review).toHaveProperty("rating", reviewData.rating);

    // Check if new Review instance has a `comment` property that matches the data we used to create it
    expect(review).toHaveProperty("comment", reviewData.comment);
  });
});
