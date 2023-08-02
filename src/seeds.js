const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { databaseConnector } = require("./database");

const { User } = require("./models/UserModel");
const { Van } = require("./models/VanModel");
const { Booking } = require("./models/BookingModel");
const { Review } = require("./models/ReviewModel");

const dotenv = require("dotenv");
dotenv.config();

// Number of rounds to perform for bcrypt hashing
const saltRounds = 10;

// Connect to the database
var databaseURL = "";
switch (process.env.NODE_ENV.toLowerCase()) {
  case "test":
    databaseURL = "mongodb://localhost:27017/VanVoyageDB-test";
    break;
  case "development":
    databaseURL = "mongodb://localhost:27017/VanVoyageDB-dev";
    break;
  case "production":
    databaseURL = process.env.DATABASE_URL;
    break;
  default:
    console.error(
      "Incorrect JS environment specified, database will not be connected."
    );
    break;
}

async function hashPassword(password) {
  return await bcrypt.hash(password, saltRounds);
}

async function createUsers() {
  const users = [
    {
      firstName: "John",
      lastName: "Doe",
      email: "john@email.com",
      password: await hashPassword("vanvoyage123"),
      dob: new Date("1991-03-22"),
      address: "742 Evergreen Terrace, Springfield, Oregon",
      phoneNumber: "0412345679",
      driversLicense: "12345678",
      admin: true,
    },
    {
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@email.com",
      password: await hashPassword("vanvoyage123"),
      dob: new Date("1992-09-17"),
      address: "742 Evergreen Terrace, Springfield, Oregon",
      phoneNumber: "0412345678",
      driversLicense: "12345679",
      admin: false,
    },
  ];
  const createdUsers = await User.insertMany(users);
  console.log("User data created.");
  return createdUsers;
}

const vans = [
  {
    vanName: "Marigold",
    pricePerDay: 130,
  },
  {
    vanName: "Eddie",
    pricePerDay: 240,
  },
  {
    vanName: "Venga Bus",
    pricePerDay: 130,
  },
];

async function createVans() {
  const createdVans = await Van.insertMany(vans);
  console.log("Van data created.");
  return createdVans;
}

async function createBookings(users, vans) {
  const bookings = [
    {
      user: users[0]._id,
      van: vans[0]._id,
      startDate: new Date("2023-05-01"),
      endDate: new Date("2023-05-10"),
      totalPrice: vans[0].pricePerDay * 10,
    },
    {
      user: users[0]._id,
      van: vans[1]._id,
      startDate: new Date("2024-05-01"),
      endDate: new Date("2024-05-10"),
      totalPrice: vans[1].pricePerDay * 10,
    },
    {
      user: users[1]._id,
      van: vans[1]._id,
      startDate: new Date("2024-06-01"),
      endDate: new Date("2024-06-15"),
      totalPrice: vans[1].pricePerDay * 15,
    },
    {
      user: users[1]._id,
      van: vans[1]._id,
      startDate: new Date("2023-06-01"),
      endDate: new Date("2023-06-15"),
      totalPrice: vans[1].pricePerDay * 15,
    },
    {
      user: users[1]._id,
      van: vans[0]._id,
      startDate: new Date("2023-07-01"),
      endDate: new Date("2023-08-15"),
      totalPrice: vans[0].pricePerDay * 46,
    },
  ];

  const createdBookings = await Booking.insertMany(bookings);
  console.log("Booking data created.");
  return createdBookings;
}

async function createReviews(bookings) {
  const reviews = [
    {
      booking: bookings[0]._id,
      rating: 5,
      comment: "Great van, loved it!",
    },
    {
      booking: bookings[3]._id,
      rating: 4,
      comment: "Amazing experience, highly recommend.",
    },
    // more reviews...
  ];

  const createdReviews = await Review.insertMany(reviews);
  console.log("Review data created.");
  return createdReviews;
}

databaseConnector(databaseURL)
  .then(() => console.log("Database connected successfully!"))
  .catch((error) =>
    console.log(
      `Some error occurred connecting to the database! It was: ${error}`
    )
  )
  .then(async () => {
    if (process.env.WIPE == "true") {
      const collections = await mongoose.connection.db
        .listCollections()
        .toArray();
      const dropCollectionPromises = collections
        .map((collection) => collection.name)
        .map((collectionName) =>
          mongoose.connection.db.dropCollection(collectionName)
        );

      await Promise.all(dropCollectionPromises);
      console.log("Old DB data deleted.");
    }
  })
  .then(createUsers)
  .then((createdUsers) =>
    createVans().then((createdVans) => [createdUsers, createdVans])
  )
  .then(([createdUsers, createdVans]) =>
    createBookings(createdUsers, createdVans)
  )
  .then(createReviews)
  .then(() => {
    mongoose.connection.close();
    console.log("DB seed connection closed.");
  });
