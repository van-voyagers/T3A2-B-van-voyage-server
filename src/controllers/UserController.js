const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const mongoose = require("mongoose");

const { User } = require("../models/UserModel");

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

// Queries for /search routes below:

// By firstName: http://localhost:3000/users/search?q=John
// By lastName: http://localhost:3000/users/search?q=Doe
// By email: http://localhost:3000/users/search?q=john@email.com
// By address: http://localhost:3000/users/search?q=123 Fake Street
// By license (number): http://localhost:3000/users/search?q=12345678
// By dob (date string): http://localhost:3000/users/search?q=1991-03-22
// By _id (MongoDB ObjectId): http://localhost:3000/users/search?q=<ObjectID>

router.get("/search", authenticate, async (req, res) => {
  if (!req.user.admin) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ message: "Missing query parameter" });
  }

  // Define search criteria for string fields
  const stringCriteria = {
    $or: [
      { firstName: { $regex: new RegExp(query, "i") } },
      { lastName: { $regex: new RegExp(query, "i") } },
      { email: { $regex: new RegExp(query, "i") } },
      { address: { $regex: new RegExp(query, "i") } },
    ],
  };

  // For dob field, convert the query to a Date object
  let dateQuery;
  if (!isNaN(Date.parse(query))) {
    dateQuery = new Date(query);
    stringCriteria.$or.push({ dob: dateQuery });
  }

  // For _id field, check if the query is a valid MongoDB ObjectID
  if (mongoose.Types.ObjectId.isValid(query)) {
    stringCriteria.$or.push({ _id: query });
  }

  // For license field, if it's a number, add to search criteria
  if (!isNaN(query)) {
    stringCriteria.$or.push({ license: Number(query) });
  }

  try {
    const users = await User.find(stringCriteria).select("-password");

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "An error occurred during the search" });
  }
});

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
    license: req.body.license,
    admin: req.body.admin,
  });

  const savedUser = await user.save();
  res.json(savedUser);
});

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

router.put("/update", authenticate, async (req, res) => {
  // validate req.body here, return a 400 error if validation fails

  const update = { ...req.body };
  if (update.password) {
    return res
      .status(400)
      .json({
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



router.delete("/delete", authenticate, async (req, res) => {
  const user = await User.findByIdAndDelete(req.user._id);
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  res.json({ message: "Account deleted successfully" });
});


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

module.exports = router;
