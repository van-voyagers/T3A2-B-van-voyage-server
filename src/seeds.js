const mongoose = require("mongoose");
const { databaseConnector } = require("./database");

// Import the models that we'll seed, so that
// we can do things like Role.insertMany()
const { User } = require("./models/UserModel");
const { Van } = require("./models/VanModel");
const { Booking } = require("./models/BookingModel");
const { Review } = require("./models/ReviewModel");

// Make sure this file can read environment variables.
const dotenv = require("dotenv");
dotenv.config();

// Create some raw data for the Roles collection,
// obeying the needed fields from the Role schema.
const users = [
  {
    firstName: "John",
    lastName: "Doe",
    email: "john@email.com",
    password: "password123",
    dob: new Date("1991-03-22"),
    address: "123 Fake Street",
    license: 12345678,
    admin: true,
  },
  {
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@email.com",
    password: "password123",
    dob: new Date("1992-09-17"),
    address: "123 Fake Street",
    license: 12345678,
    admin: false,
  },
];

// To fill in after creating user data encryption functionality.
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
    vanName: "Marigold",
    pricePerDay: 130,
  },
];

// To fill in after creating users successfully.
const bookings = [];

// To fill in after creating users successfully.
const reviews = [];

// Connect to the database.
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

// This functionality is a big promise-then chain.
// This is because it requires some async functionality,
// and that doesn't work without being wrapped in a function.
// Since .then(callback) lets us create functions as callbacks,
// we can just do stuff in a nice .then chain.
databaseConnector(databaseURL)
  .then(() => {
    console.log("Database connected successfully!");
  })
  .catch((error) => {
    console.log(`
    Some error occurred connecting to the database! It was: 
    ${error}
    `);
  })
  .then(async () => {
    if (process.env.WIPE == "true") {
      // Get the names of all collections in the DB.
      const collections = await mongoose.connection.db
        .listCollections()
        .toArray();

      // Empty the data and collections from the DB so that they no longer exist.
      collections
        .map((collection) => collection.name)
        .forEach(async (collectionName) => {
          mongoose.connection.db.dropCollection(collectionName);
        });
      console.log("Old DB data deleted.");
    }
  })
  .then(async () => {
    // Add new user data into the database.
    await User.insertMany(users);
    console.log("User data created.");
  })
  .then(async () => {
    // Add new van data into the database.
    await Van.insertMany(vans);
    console.log("Van data created.");
  })
  .then(() => {
    // Disconnect from the database.
    mongoose.connection.close();
    console.log("DB seed connection closed.");
  });
