const User = require("../user/user.model");
const Driver = require("../driver/models/driver.model");
const Carrier = require("../carrier/models/carrier.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ================= REGISTER =================
exports.register = async (req, res) => {
  try {
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

    // ✅ Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // 🔥 CHECK CARRIER FIRST
    if (role === "carrier") {
      const existingCarrier = await Carrier.findOne({ dotNumber });

      if (existingCarrier) {
        return res.status(400).json({
          msg: "Carrier with this DOT number already exists",
        });
      }
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      role,
    });

    let profile = null;

    if (role === "driver") {
      profile = await Driver.create({
        user: user._id,
        firstName,
        lastName,
        licenseType,
      });
    }

    if (role === "carrier") {
      profile = await Carrier.create({
        user: user._id,
        dotNumber,
        companyName,
      });
    }

    return res.status(201).json({
      msg: "User registered successfully",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile,
      },
    });
  } catch (error) {
    return res.status(500).json({
      msg: error.message,
    });
  }
};

// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { email, password, expectedRole } = req.body;

    // ✅ Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // ✅ Validate Role
    if (user.role !== expectedRole) {
      return res.status(403).json({
        msg: `Access denied. You are registered as ${user.role}, but trying to login as ${expectedRole}.`
      });
    }

    // ✅ Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // ✅ Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    let profile = null;

    // ✅ Only ONE query based on role
    if (user.role === "driver") {
      profile = await Driver.findOne({ user: user._id });
    }

    if (user.role === "carrier") {
      profile = await Carrier.findOne({ user: user._id });
    }

    return res.status(200).json({
      msg: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile,
      },
    });
  } catch (error) {
    return res.status(500).json({
      msg: error.message,
    });
  }
};
