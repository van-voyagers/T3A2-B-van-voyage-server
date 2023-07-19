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
  // Create some raw data for the Roles collection, obeying the needed fields from the Role schema.
  const users = [
    {
      firstName: "John",
      lastName: "Doe",
      email: "john@email.com",
      password: await hashPassword("password123"),
      dob: new Date("1991-03-22"),
      address: "123 Fake Street",
      license: 12345678,
      admin: true,
    },
    {
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@email.com",
      password: await hashPassword("password123"),
      dob: new Date("1992-09-17"),
      address: "123 Fake Street",
      license: 12345678,
      admin: false,
    },
  ];
  // Add new user data into the database.
  await User.insertMany(users);
  console.log("User data created.");
}

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
  .then(createUsers)
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
