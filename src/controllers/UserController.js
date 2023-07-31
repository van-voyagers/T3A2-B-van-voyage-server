const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const mongoose = require("mongoose");

const { User } = require("../models/UserModel");

// Middleware function to authenticate the user making the request.
// Verifies the JWT from the Authorization header and attaches the user to the request object.
async function authenticate(req, res, next) {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded._id });
    if (!user) {
      throw new Error();
    }
    req.user = user;
    next();
  } catch (e) {
    res.status(401).json({ message: "Please authenticate" });
  }
}

// GET all users.
// This endpoint is accessible only to admin users.
// No query parameters are required.
router.get("/all", authenticate, async (req, res) => {
  if (!req.user.admin) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const users = await User.find().select("-password");
  if (!users) {
    return res.status(400).json({ message: "No users found" });
  }

  res.json(users);
});

// GET users by search.
// Admin users can search for users by firstName, lastName, email, address, license, dob, or _id.
// The query is passed as a URL parameter like so: /search?q=<search_term>.
router.get("/search", authenticate, async (req, res) => {
  if (!req.user.admin) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ message: "Missing query parameter" });
  }

  const stringCriteria = {
    $or: [
      { firstName: { $regex: new RegExp(query, "i") } },
      { lastName: { $regex: new RegExp(query, "i") } },
      { email: { $regex: new RegExp(query, "i") } },
      { address: { $regex: new RegExp(query, "i") } },
      { driversLicense: { $regex: new RegExp(query, "i") } }, // license is now string
      { phoneNumber: { $regex: new RegExp(query, "i") } }, 
    ],
  };

  try {
    const users = await User.find(stringCriteria);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



// GET authenticated user details.
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user._id }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Return separate fields for first name and last name
    const formattedUser = {
      firstName: user.firstName,
      lastName: user.lastName,
      dob: user.dob,
      phoneNumber: user.phoneNumber,
      email: user.email,
      address: user.address,
      driversLicense: user.driversLicense, // updated field from user.license to user.driversLicense
    }

    res.json(formattedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "An error occurred while fetching user details" });
  }
});




// POST to create an account.
// Expects the following fields in the request body: firstName, lastName, email, password, dob, address, license, admin.
// Returns the new user (excluding the password).
router.post("/create-account", async (req, res) => {
  const existingUser = await User.findOne({ email: req.body.email });
  if (existingUser) {
    return res
      .status(400)
      .json({ message: "A user with this email already exists" });
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  const user = new User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: hashedPassword,
    dob: req.body.dob,
    address: req.body.address,
    driversLicense: req.body.driversLicense,  // Updated field
    admin: req.body.admin,
    phoneNumber: req.body.phoneNumber,  
  });

  const savedUser = await user.save();
  res.json(savedUser);
});

// POST to sign in.
// Expects the following fields in the request body: email, password.
// Returns a JSON Web Token for the authenticated user.
router.post("/sign-in", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const isMatch = await bcrypt.compare(req.body.password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Incorrect password" });
  }

  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  res.json({ token: token });
});

// PUT to update a user.
// This route is authenticated.
// Expects any updatable fields in the request body excluding password.
// Returns the updated user (excluding the password).
router.put("/update", authenticate, async (req, res) => {
  // validate req.body here, return a 400 error if validation fails

  const update = { ...req.body };
  if (update.password) {
    return res.status(400).json({
      message: "Password updates are not allowed through this route.",
    });
  }

  let user;
  try {
    user = await User.findByIdAndUpdate(req.user._id, update, {
      new: true,
    }).select("-password");
  } catch (error) {
    return res
      .status(500)
      .json({ message: "An error occurred during the update" });
  }

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(user);
});

// PUT to change a user's password.
// This route is authenticated.
// Expects the following fields in the request body: oldPassword, newPassword.
// Returns a success message if the password is changed successfully.
router.put("/change-password", authenticate, async (req, res) => {
  // Validate req.body here, make sure it has `oldPassword` and `newPassword`

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const validPassword = await bcrypt.compare(
    req.body.oldPassword,
    user.password
  );
  if (!validPassword) {
    return res.status(401).json({ message: "Invalid current password" });
  }

  // Hash the new password before saving
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.newPassword, salt);

  user.password = hashedPassword;
  await user.save();

  res.json({ message: "Password changed successfully" });
});

// PUT to change a user's password by admin.
// This route is authenticated and only accessible to admin users.
// Expects the following field in the request body: newPassword.
// The userId of the user to update is passed in the URL like so: /admin/change-password/<userId>.
// Returns a success message if the password is updated successfully.
router.put("/admin/update/:userId", authenticate, async (req, res) => {
  // First check if the authenticated user is an admin
  if (!req.user.admin) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const userIdToUpdate = req.params.userId;
  const update = { ...req.body };

  // Prevent password updates through this route
  if (update.password) {
    return res.status(400).json({
      message: "Password updates are not allowed through this route.",
    });
  }

  let userToUpdate;
  try {
    userToUpdate = await User.findByIdAndUpdate(userIdToUpdate, update, {
      new: true,
    }).select("-password");
  } catch (error) {
    return res
      .status(500)
      .json({ message: "An error occurred during the update" });
  }

  if (!userToUpdate) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(userToUpdate);
});

// PUT to update a user by admin.
// This route is authenticated and only accessible to admin users.
// Expects any updatable fields in the request body excluding password.
// The userId of the user to update is passed in the URL like so: /admin/update/<userId>.
// Returns the updated user (excluding the password).
router.put("/admin/update/:userId", authenticate, async (req, res) => {
  // First check if the authenticated user is an admin
  if (!req.user.admin) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const userIdToUpdate = req.params.userId;
  const update = { ...req.body };

  // Prevent password updates through this route
  if (update.password) {
    return res.status(400).json({
      message: "Password updates are not allowed through this route.",
    });
  }

  let userToUpdate;
  try {
    userToUpdate = await User.findByIdAndUpdate(userIdToUpdate, update, {
      new: true,
    }).select("-password");
  } catch (error) {
    return res
      .status(500)
      .json({ message: "An error occurred during the update" });
  }

  if (!userToUpdate) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(userToUpdate);
});

// DELETE a user.
// This route is authenticated.
// Deletes the user associated with the authenticated token.
// Returns a success message if the user is deleted successfully.
router.delete("/delete", authenticate, async (req, res) => {
  try {
    // Check if the req.user object exists
    if (!req.user || !req.user._id) {
      return res.status(400).json({ message: "No user associated with this token" });
    }

    // Attempt to delete the user
    const user = await User.findByIdAndDelete(req.user._id);

    // Check if the user was deleted successfully
    if (!user) {
      return res.status(400).json({ message: "User not found or could not be deleted" });
    }

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred while trying to delete the user" });
  }
});


// DELETE a user by admin.
// This route is authenticated and only accessible to admin users.
// The userId of the user to delete is passed in the URL like so: /admin/delete/<userId>.
// Returns a success message if the user is deleted successfully.
router.delete("/admin/delete/:userId", authenticate, async (req, res) => {
  if (!req.user.admin) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const userToDelete = await User.findById(req.params.userId);
  if (!userToDelete) {
    return res.status(404).json({ message: "User not found" });
  }

  await User.findByIdAndDelete(req.params.userId);
  res.json({ message: "User deleted successfully" });
});

module.exports = router;