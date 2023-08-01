const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  email: {
    type: String,
    trim: true,
    required: true,
    unique: true,
    match: [/\S+@\S+\.\S+/, "is invalid"],
  },
  password: { type: String, required: true, minlength: 6 },
  dob: Date,
  address: { type: String, trim: true },
  driversLicense: { type: String, trim: true },
  admin: { type: Boolean, default: false },
  phoneNumber: { type: String, trim: true },
});

const User = mongoose.model("User", UserSchema);

module.exports = { User };
