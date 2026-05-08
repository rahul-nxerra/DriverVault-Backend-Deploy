const Driver = require("../models/driver.model");
const cloudinary = require("cloudinary").v2;
const Credential = require("../models/credential.model");
const Employment = require("../models/employment.model");
const PerformanceRecord = require("../models/performanceRecord.model");
const Carrier = require("../../carrier/models/carrier.model");
const AccessRequest = require("../../common/models/accessRequest.model");
const bcrypt = require("bcryptjs");
const User = require("../../user/user.model");

const { getDriverPerformanceData } = require("../services/performance.service");

// ================= PUBLIC PROFILE =================
exports.getPublicDriverProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const driver = await Driver.findById(id).populate("user");

    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    const performanceData = await getDriverPerformanceData(driver._id);

    const publicData = {
      id: driver._id,

      profilePhoto: driver.profilePhoto || null,
      fullName: `${driver.firstName} ${driver.lastName}`,

      location: {
        city: driver.location?.city || null,
        state: driver.location?.state || null,
      },

      licenseType: driver.licenseType,
      experienceYears: driver.experienceYears || 0,
      availability: driver.availability || null,
      bio: driver.bio || null,

      performance: {
        safetyScore: performanceData.scores.safety,
        reliabilityScore: performanceData.scores.reliability,
        trainingScore: performanceData.scores.training,
        overallScore: performanceData.scores.overall,
      },
    };

    return res.status(200).json({
      message: "Public profile fetched",
      data: publicData,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch public profile",
    });
  }
};

// ================= DRIVER PRIVATE PROFILE =================
exports.getDriverProfile = async (req, res) => {
  const driver = await Driver.findOne({ user: req.user.id }).populate(
    "user",
    "email",
  );

  if (!driver) {
    res.status(404);
    throw new Error("Driver profile not found");
  }

  const employmentHistory = await Employment.find({
    driver: driver._id,
  }).sort({ startDate: -1 });

  const { scores, history } = await getDriverPerformanceData(driver._id);

  const response = {
    id: driver._id,
    email: driver.user?.email || null,

    profilePhoto: driver.profilePhoto || null,
    firstName: driver.firstName,
    lastName: driver.lastName,

    phone: driver.phone || null,

    location: {
      city: driver.location?.city || null,
      state: driver.location?.state || null,
      zipCode: driver.location?.zipCode || null,
    },

    licenseType: driver.licenseType || null,
    experienceYears: driver.experienceYears || 0,
    availability: driver.availability || null,
    bio: driver.bio || null,

    employmentHistory,

    performance: {
      scores,
      history,
    },

    createdAt: driver.createdAt,
  };

  return res.status(200).json({
    msg: "Driver Profile Fetched",
    data: response,
  });
};

// ================= UPDATE DRIVER PROFILE =================
exports.updateDriverProfile = async (req, res) => {
  const driver = await Driver.findOne({ user: req.user.id });

  if (!driver) {
    return res.status(404).json({ message: "Driver not found" });
  }

  const allowedFields = [
    "firstName",
    "lastName",
    "phone",
    "licenseType",
    "experienceYears",
    "availability",
    "bio",
  ];

  Object.keys(req.body).forEach((key) => {
    if (
      allowedFields.includes(key) &&
      req.body[key] !== undefined &&
      req.body[key] !== ""
    ) {
      driver[key] = req.body[key];
    }
  });

  // LOCATION
  const location = req.body.location || {};
  const city = location.city || req.body["location.city"] || req.body.city;
  const state = location.state || req.body["location.state"] || req.body.state;
  const zipCode =
    location.zipCode || req.body["location.zipCode"] || req.body.zipCode;

  if (!driver.location) driver.location = {};

  if (city) driver.location.city = city;
  if (state) driver.location.state = state;
  if (zipCode) driver.location.zipCode = zipCode;

  // CLOUDINARY
  if (req.file) {
    if (driver.profilePhotoId) {
      await cloudinary.uploader.destroy(driver.profilePhotoId);
    }

    const optimizedUrl = cloudinary.url(req.file.filename, {
      width: 300,
      height: 300,
      crop: "fill",
      gravity: "face",
      quality: "auto",
      fetch_format: "auto",
    });

    driver.profilePhoto = optimizedUrl;
    driver.profilePhotoId = req.file.filename;
  }

  await driver.save();

  // 🔥 FETCH EMPLOYMENT SEPARATELY
  const employmentHistory = await Employment.find({
    driver: driver._id,
  });

  return res.status(200).json({
    message: "Profile updated successfully",
    data: {
      id: driver._id,
      firstName: driver.firstName,
      lastName: driver.lastName,
      phone: driver.phone,
      location: driver.location,
      licenseType: driver.licenseType,
      experienceYears: driver.experienceYears,
      availability: driver.availability,
      bio: driver.bio,
      profilePhoto: driver.profilePhoto,

      employmentHistory,
    },
  });
};

exports.getDriverProfileById = async (req, res) => {
  try {
    const { driverId } = req.params;

    // 🔐 EXTRA SAFETY (defense layer)
    if (req.user.role === "carrier") {
      const carrier = await Carrier.findOne({ user: req.user.id });

      const access = await AccessRequest.findOne({
        driver: driverId,
        carrierProfile: carrier?._id,
        status: "approved",
      });

      if (!access || !access.allowedData?.personalInfo) {
        return res.status(403).json({
          message: "personalInfo access not allowed",
        });
      }
    }

    const driver = await Driver.findById(driverId).populate("user", "email");

    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    return res.status(200).json({
      id: driver._id,
      firstName: driver.firstName,
      lastName: driver.lastName,
      email: driver.user?.email || null,
      phone: driver.phone || null,
      location: {
        city: driver.location?.city || null,
        state: driver.location?.state || null,
        zipCode: driver.location?.zipCode || null,
      },
      licenseType: driver.licenseType,
      experienceYears: driver.experienceYears || 0,
      availability: driver.availability || null,
      bio: driver.bio || null,
    });
  } catch (error) {
    console.log("PROFILE ERROR:", error); // 👈 ADD THIS
    return res.status(500).json({
      message: "Failed to fetch driver profile",
    });
  }
};

// ================= CHANGE PASSWORD =================
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // 🔹 validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current and new password required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters",
      });
    }

    // 🔹 get user
    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // 🔹 compare current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    // 🔹 hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    return res.json({
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    return res.status(500).json({
      message: "Failed to change password",
    });
  }
};
