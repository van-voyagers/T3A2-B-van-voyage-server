// Require the necessary libraries and modules
const mongoose = require("mongoose");
const { User } = require("../src/models/UserModel");

let connection;

// `beforeAll` runs before all tests and is used to handle setup
beforeAll(async () => {
  // Set up a new MongoDB connection
  const url = `mongodb://127.0.0.1/testDB`;
  connection = await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// `afterAll` runs after all tests and is used to handle cleanup
afterAll(async () => {
  // After all tests, drop the database and close the connection
  await connection.connection.db.dropDatabase();
  await connection.connection.close();
});

// `describe` is used to group related tests
describe("User Model Test", () => {
  // Define a sample user data object based on the User schema
  const userData = {
    firstName: "Test",
    lastName: "User",
    email: "testuser@gmail.com",
    password: "testpassword",
    dob: new Date(),
    address: "123 Test St",
    license: 123456,
    admin: false,
  };
  // Create a new User instance with the sample data
  const user = new User(userData);

  // `test` represents a single test case
  test("new user has firstName", () => {
    // This test checks if the user object has the firstName property with the correct value
    expect(user).toHaveProperty("firstName", userData.firstName);
  });

  test("new user has lastName", () => {
    // This test checks if the user object has the lastName property with the correct value
    expect(user).toHaveProperty("lastName", userData.lastName);
  });

  test("new user has email", () => {
    // This test checks if the user object has the email property with the correct value
    expect(user).toHaveProperty("email", userData.email);
  });

  test("new user has password", () => {
    // This test checks if the user object has the password property with the correct value
    expect(user).toHaveProperty("password", userData.password);
  });

  test("new user has dob", () => {
    // This test checks if the user object has the dob property with the correct value
    expect(user).toHaveProperty("dob", userData.dob);
  });

  test("new user has address", () => {
    // This test checks if the user object has the address property with the correct value
    expect(user).toHaveProperty("address", userData.address);
  });

  test("new user has license", () => {
    // This test checks if the user object has the license property with the correct value
    expect(user).toHaveProperty("license", userData.license);
  });

  test("new user has admin", () => {
    // This test checks if the user object has the admin property with the correct value
    expect(user).toHaveProperty("admin", userData.admin);
  });
});
