// Import the necessary modules
const mongoose = require("mongoose");
const { Van } = require("../src/models/VanModel");

// Declare a variable to hold the connection
let connection;

// beforeAll is a hook that runs before all the tests start executing
// Here we are setting up a MongoDB connection before running the tests
beforeAll(async () => {
  const url = `mongodb://127.0.0.1/testDB`;
  connection = await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// afterAll is a hook that runs after all the tests have completed
// Here we are closing the MongoDB connection and dropping the database after running the tests
afterAll(async () => {
  await connection.connection.db.dropDatabase();
  await connection.connection.close();
});

// The describe function is used to group related tests together
describe("Van Model Test", () => {
  // We're setting up sample data for three vans
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

  // For each van in the array, we're creating a new test
  vans.forEach((vanData, index) => {
    // Each test checks whether a new instance of the Van model correctly sets the properties 'vanName' and 'pricePerDay'
    test(`new van ${index + 1} has correct properties`, () => {
      // Create a new instance of the Van model using the current van data
      const van = new Van(vanData);

      // Check if new Van instance has a `vanName` property that matches the data we used to create it
      expect(van).toHaveProperty("vanName", vanData.vanName);

      // Check if new Van instance has a `pricePerDay` property that matches the data we used to create it
      expect(van).toHaveProperty("pricePerDay", vanData.pricePerDay);
    });
  });
});
