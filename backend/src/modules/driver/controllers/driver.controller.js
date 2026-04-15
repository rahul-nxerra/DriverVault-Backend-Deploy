const Driver = require("../models/driver.model");
const cloudinary = require("cloudinary").v2;
const Credential = require("../models/credential.model");

// ================= PUBLIC PROFILE =================
exports.getPublicDriverProfile = async (req, res) => {
  const { id } = req.params;

  const driver = await Driver.findById(id);

  if (!driver) {
    res.status(404);
    throw new Error("Driver not found");
  }

  // ✅ SAFE RESPONSE ONLY
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

    //  PERFORMANCE (summary only)
    performance: driver.performance
      ? {
          safetyScore: driver.performance.safetyScore,
          reliabilityScore: driver.performance.reliabilityScore,
        }
      : null,
  };

  res.status(200).json({
    message: "Public profile fetched",
    data: publicData,
  });
};

// =================  DRIVER PRIVATE PROFILE =================
exports.getDriverProfile = async (req, res) => {
  const driver = await Driver.findOne({ user: req.user.id }).populate(
    "user",
    "email",
  );

  if (!driver) {
    res.status(404).json({ msg: "Driver profile not found" });
  }

  //  ✅ Safe handling for optional fields

  const response = {
    id: driver._id,
    email: driver.user?.email || null,

    // Basic

    profilePhoto: driver.profilePhoto || null,
    firstName: driver.firstName,
    lastName: driver.lastName,

    //Contact
    phone: driver.phone || null,

    //Location
    location: {
      city: driver.location?.city || null,
      state: driver.location?.state || null,
      zipCode: driver.location?.zipCode || null,
    },

    //Professional
    licenseType: driver.licenseType || null,
    experienceYears: driver.experienceYears || null,
    availability: driver.availability || null,
    bio: driver.bio || null,

    // 🔴 RESTRICTED (only owner can see )
    employmentHistory: driver.employmentHistory || [],
    // ⚙️ SYSTEM
    performance: driver.performance || null,

    createdAt: driver.createdAt,
  };

  return res
    .status(200)
    .json({ msg: "Driver Profile Fetched", data: response });
};

// =================  UPDATE DRIVER PROFILE =================
exports.updateDriverProfile = async (req, res) => {
  const driver = await Driver.findOne({ user: req.user.id });

  if (!driver) {
    return res.status(404).json({ message: "Driver not found" });
  }

  // ✅ Allowed fields only
  const allowedFields = [
    "firstName",
    "lastName",
    "phone",
    "licenseType",
    "experienceYears",
    "availability",
    "bio",
  ];

  // ✅ Update safe fields
  Object.keys(req.body).forEach((key) => {
    if (
      allowedFields.includes(key) &&
      req.body[key] !== undefined &&
      req.body[key] !== ""
    ) {
      driver[key] = req.body[key];
    }
  });

  //  HANDLE LOCATION

  const location = req.body.location || {};
  const city = location.city || req.body["location.city"] || req.body.city;

  const state = location.state || req.body["location.state"] || req.body.state;

  const zipCode =
    location.zipCode || req.body["location.zipCode"] || req.body.zipCode;

  if (!driver.location) driver.location = {};

  if (city) driver.location.city = city;
  if (state) driver.location.state = state;
  if (zipCode) driver.location.zipCode = zipCode;

  //  CLOUDINARY IMAGE URL
  if (req.file) {
    if (driver.profilePhotoId) {
      await cloudinary.uploader.destroy(driver.profilePhotoId);
    }
    // Save New Profile Photo id means filename
    driver.profilePhoto = req.file.path; // Cloudinary URL
    driver.profilePhotoId = req.file.filename;
  }

  await driver.save();

  return res.status(200).json({
    message: "Profile updated successfully",
    data: driver,
  });
};

// ================= CREATE CREDENTIAL =================
exports.createCredential = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: " Document File required" });
  }

  const { title, type, issuedBy, expiryDate, renewedFrom } = req.body;

  // 🔥 Prevent double renewal (optional but strong)
  if (renewedFrom) {
    const old = await Credential.findById(renewedFrom);

    if (!old || !old.isActive) {
      return res.status(400).json({
        message: "Invalid or already renewed credential",
      });
    }
    if (renewedFrom) {
      const old = await Credential.findById(renewedFrom);

      if (!old || !old.isActive) {
        return res.status(400).json({
          message: "Invalid or already renewed credential",
        });
      }

      // RESOURCE LEVEL AUTHORIZATION | DRIVER ONLY CAN RENEW HIS CREDENTIAL
      if (!old.driver.equals(req.user.id)) {
        return res.status(403).json({
          message: "Unauthorized: You can only renew your own credential",
        });
      }
    }
  }

  // ✅ Create new credential
  const newCredential = await Credential.create({
    driver: req.user.id,
    title,
    type,
    issuedBy,
    expiryDate,
    fileUrl: req.file.path,
    status: "pending",
    isVerified: false,
    renewedFrom: renewedFrom || null,
    isActive: true,
  });

  // 🔥 Deactivate old credential
  if (renewedFrom) {
    await Credential.findByIdAndUpdate(renewedFrom, {
      isActive: false,
    });
  }

  res.status(201).json({
    message: "Credential uploaded successfully",
    data: newCredential,
  });
};

// ================= GET ALL CREDENTIAL =================
exports.getCredentials = async (req, res) => {
  const credentials = await Credential.find({
    driver: req.user.id,
    isActive: true, // 🔥 important for renewal system
  }).sort({ createdAt: -1 });

  const updated = credentials.map((c) => {
    let status = c.status;

    //  expiry logic
    if (c.status === "verified" && c.expiryDate) {
      const diffDays =
        (new Date(c.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);

      if (diffDays < 0) status = "expired";
      else if (diffDays <= 30) status = "expiringSoon";
    }

    return {
      ...c.toObject(),
      status,
    };
  });
  res.json({ count: credentials.length, data: updated }); //check
};

// ================= GET  SINGLE CREDENTIAL =================
exports.getSingleCredential = async (req, res) => {
  const credential = await Credential.findOne({
    _id: req.params.id,
    driver: req.user.id,
    isActive: true,
  });

  if (!credential) {
    return res.status(404).json({ message: " Credential not found" });
  }

  let status = credential.status;

  // 👉 Apply expiry logic ONLY if verified
  if (credential.status === "verified" && credential.expiryDate) {
    const diffDays =
      (new Date(credential.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);

    if (diffDays < 0) {
      status = "expired";
    } else if (diffDays <= 30) {
      status = "expiringSoon";
    }
  }

  const result = {
    ...credential.toObject(),
    status,
  };

  res.json({ data: result });
};
