const Driver = require("../models/driver.model");
const cloudinary = require("cloudinary").v2;
const Credential = require("../models/credential.model");
const Employment = require("../models/employment.model");
const PerformanceRecord = require("../models/performanceRecord.model");
const ConsentPreferences = require("../../driver/models/consentPreferences.model");

const {
  getDriverPerformanceData,
} = require("../../../services/performance.service");

// ================= PUBLIC PROFILE =================
exports.getPublicDriverProfile = async (req, res) => {
  const { id } = req.params;

  const driver = await Driver.findById(id).populate("user");

  if (!driver) {
    res.status(404);
    throw new Error("Driver not found");
  }

  const performanceData = await getDriverPerformanceData(driver._id);

  // 🔹 fetch consent
  const prefs = await ConsentPreferences.findOne({
    driverId: driver._id,
  });

  // 🔹 build response safely
  let fullName = `${driver.firstName} ${driver.lastName}`;
  let location = {
    city: driver.location?.city || null,
    state: driver.location?.state || null,
  };

  // 🔹 apply personal info filtering
  if (prefs && prefs.personalInfo === false) {
    fullName = null;
    location = null;
  }

  const publicData = {
    id: driver._id,

    // 🔐 filtered
    profilePhoto:
      prefs?.personalInfo === false ? null : driver.profilePhoto || null,
    fullName,

    location,

    // always allowed (professional data)
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

  res.status(200).json({
    message: "Public profile fetched",
    data: publicData,
  });
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

    driver.profilePhoto = req.file.path;
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

      // ✅ NOW CORRECT
      employmentHistory,
    },
  });
};
