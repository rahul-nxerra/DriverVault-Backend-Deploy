const User = require("../user/user.model");
const Driver = require("../driver/models/driver.model");
const Carrier = require("../carrier/models/carrier.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  authLimiter,
  authKeyGenerator,
} = require("../../middlewares/rateLimit.middleware");
const { logAudit } = require("../../utils/auditLogger");
const { sendMail } = require("../../utils/sendMail");
const { getUserByEmail } = require("../admin/services/users");

const crypto = require("crypto");

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
    let userName;
    if (role === "driver") {
      profile = await Driver.create({
        user: user._id,
        firstName,
        lastName,
        licenseType,
      });
      userName = firstName + " " + lastName;
    }

    if (role === "carrier") {
      profile = await Carrier.create({
        user: user._id,
        dotNumber,
        companyName,
      });
      userName = companyName;
    }

    const isAdminCreation = !!req.user;
    
    await logAudit({
      performedBy: isAdminCreation ? req.user.id : user._id,

      role: isAdminCreation ? req.user.role : user.role,

      action: isAdminCreation ? "CREATE_USER" : "SIGNUP",

      resource: "user",

      resourceId: user._id,

      targetUser: user._id,

      category: isAdminCreation ? "Admin" : "Auth",

      message: isAdminCreation
        ? `Admin created ${role} account`
        : `${userName} registered`,

      metadata: {
        email: user.email,
        profileId: profile?._id || null,
        accountType: role,
      },

      req,
    });

    // ✅ Reset Rate Limit on success
    const key = authKeyGenerator(req);
    authLimiter.resetKey(key);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
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
        msg: `Access denied. You are registered as ${user.role}, but trying to login as ${expectedRole}.`,
      });
    }

    // ✅ Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    let profile = null;
    let message;
    // ✅ Only ONE query based on role
    if (user.role === "driver") {
      profile = await Driver.findOne({ user: user._id });
      if (!profile) {
        return res.status(404).json({
          success: false,
          msg: "Driver profile not found",
        });
      }
      message = `${profile?.firstName + " " + profile?.lastName}  Login`;
    }

    if (user.role === "carrier") {
      profile = await Carrier.findOne({ user: user._id });
      if (!profile) {
        return res.status(404).json({
          success: false,
          msg: "Carrier profile not found",
        });
      }
      message = `${profile?.companyName} Login`;
    }

    if (user.role === "admin") {
      message = `Admin Login`;
    }

    // ✅ Block suspended/deleted users
    if (profile && ["suspend", "delete"].includes(profile.status)) {
      return res.status(403).json({
        success: false,
        msg: `Your account is ${profile.status}`,
      });
    }

    // ✅ Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    await logAudit({
      performedBy: user._id,
      role: user.role,
      action: "LOGIN",
      resource: "auth",
      resourceId: user._id,
      targetUser: user._id,
      category: "Auth",
      message,
      metadata: {
        loginRole: expectedRole,
        profileId: profile?._id || null,
      },
      req,
    });

    // ✅ Reset Rate Limit on success
    const key = authKeyGenerator(req);
    authLimiter.resetKey(key);

    return res.status(200).json({
      success: true,
      messeg: "Login successful",
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

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // generate token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // save token + expiry
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

    await user.save();

    await sendMail(email, resetToken);

    res.status(200).json({
      success: true,
      message: "Reset link sent successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
    const bcrypt = require("bcryptjs");

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;

    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
