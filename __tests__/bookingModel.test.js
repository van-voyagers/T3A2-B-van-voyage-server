const mongoose = require("mongoose");
const { Booking } = require("../src/models/BookingModel");

describe("Booking Model Test", () => {
  // Setting up sample data for a booking
  const bookingData = {
    user: new mongoose.Types.ObjectId("60d6ec9f1093044a02262976"),
    van: new mongoose.Types.ObjectId("60d6ec9f1093044a02262977"),
    startDate: new Date(2023, 7, 1),
    endDate: new Date(2023, 7, 7),
    totalPrice: 780,
  };

  // Create a test that checks whether a new instance of the Booking model correctly sets the properties
  test("new booking has correct properties", () => {
    // Create a new instance of the Booking model using the booking data
    const booking = new Booking(bookingData);

    // Check if new Booking instance has a `user` property that matches the data we used to create it
    expect(booking).toHaveProperty("user", bookingData.user);

    // Check if new Booking instance has a `van` property that matches the data we used to create it
    expect(booking).toHaveProperty("van", bookingData.van);

    // Check if new Booking instance has a `startDate` property that matches the data we used to create it
    expect(booking).toHaveProperty("startDate", bookingData.startDate);

    // Check if new Booking instance has a `endDate` property that matches the data we used to create it
    expect(booking).toHaveProperty("endDate", bookingData.endDate);

    // Check if new Booking instance has a `totalPrice` property that matches the data we used to create it
    expect(booking).toHaveProperty("totalPrice", bookingData.totalPrice);
  });
});
