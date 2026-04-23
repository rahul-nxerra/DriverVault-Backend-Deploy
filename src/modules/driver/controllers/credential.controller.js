const Credential = require("../models/credential.model");
const Driver = require("../models/driver.model");

// ================= CREATE CREDENTIAL =================
exports.createCredential = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Document File required" });
  }

  const { title, type, issuedBy, expiryDate, renewedFrom } = req.body;

  // 🔥 get driver profile
  const driverProfile = await Driver.findOne({
    user: req.user.id,
  });

  if (!driverProfile) {
    return res.status(404).json({ message: "Driver not found" });
  }

  // 🔥 renewal validation
  if (renewedFrom) {
    const old = await Credential.findById(renewedFrom);

    if (!old || !old.isActive) {
      return res.status(400).json({
        message: "Invalid or already renewed credential",
      });
    }

    // ✅ ownership check FIXED
    if (!old.driver.equals(driverProfile._id)) {
      return res.status(403).json({
        message: "Unauthorized: You can only renew your own credential",
      });
    }
  }

  // ✅ create credential
  const newCredential = await Credential.create({
    driver: driverProfile._id,
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

  // 🔥 deactivate old
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

// ================= GET ALL =================
exports.getCredentials = async (req, res) => {
  const driverProfile = await Driver.findOne({
    user: req.user.id,
  });

  const credentials = await Credential.find({
    driver: driverProfile._id,
    isActive: true,
  }).sort({ createdAt: -1 });

  const updated = credentials.map((c) => {
    let status = c.status;

    if (c.status === "verified" && c.expiryDate) {
      const diffDays =
        (new Date(c.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);

      if (diffDays < 0) status = "expired";
      else if (diffDays <= 30) status = "expiringSoon";
    }

    return {
      ...c.toObject(),
      status,
      category: "credential",
    };
  });

  res.json({ count: updated.length, data: updated });
};

// ================= GET SINGLE =================
exports.getSingleCredential = async (req, res) => {
  const driverProfile = await Driver.findOne({
    user: req.user.id,
  });

  const credential = await Credential.findOne({
    _id: req.params.id,
    driver: driverProfile._id,
    isActive: true,
  });

  if (!credential) {
    return res.status(404).json({ message: "Credential not found" });
  }

  let status = credential.status;

  if (credential.status === "verified" && credential.expiryDate) {
    const diffDays =
      (new Date(credential.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);

    if (diffDays < 0) status = "expired";
    else if (diffDays <= 30) status = "expiringSoon";
  }

  res.json({
    data: {
      ...credential.toObject(),
      status,
      category: "credential",
    },
  });
};
