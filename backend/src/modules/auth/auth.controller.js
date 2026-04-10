const User = require("../user/user.model");
const Driver = require("../driver/driver.model");
const Carrier = require("../carrier/carrier.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const asyncHandler = require("express-async-handler");

exports.register = async (req, res) => {
  const {
    email,
    password,
    role,
    firstName,
    lastName,
    licenseType,
    dotNumber,
    companyName,
  } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ msg: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    email,
    password: hashedPassword,
    role,
  });

  if (role === "driver") {
    await Driver.create({
      user: user._id,
      firstName,
      lastName,
      licenseType,
    });
  }

  if (role === "carrier") {
    await Carrier.create({
      user: user._id,
      dotNumber,
      companyName,
    });
  }

  let profile = null;
  if (user.role === "driver") {
    profile = await Driver.findOne({ user: user._id });
  }

  if (user.role === "carrier") {
    profile = await Carrier.findOne({ user: user._id });
  }

  res.status(201).json({
    msg: "User registered successfully",
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      profile,
    },
  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ msg: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ msg: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

  let profile = null;

  //  Attach role-based profile
  if (user.role === "driver") {
    profile = await Driver.findOne({ user: user._id });
  }

  if (user.role === "carrier") {
    profile = await Carrier.findOne({ user: user._id });
  }

  res.json({
    msg: "Login successful",
    token,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      profile,
    },
  });
};
