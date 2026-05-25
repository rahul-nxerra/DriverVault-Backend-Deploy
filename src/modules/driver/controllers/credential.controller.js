const Credential = require("../models/credential.model");
const Driver = require("../models/driver.model");
const mongoose = require("mongoose");
const { logAudit } = require("../../../utils/auditLogger");

// ================= CREATE CREDENTIAL =================
exports.createCredential = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Document file required" });
    }

    const { title, type, issuedBy, expiryDate, renewedFrom } = req.body;

    const driverProfile = await Driver.findOne({
      user: req.user.id,
    });

    if (!driverProfile) {
      return res.status(404).json({ message: "Driver not found" });
    }

    // 🔹 renewal validation
    if (renewedFrom) {
      const old = await Credential.findById(renewedFrom);

      if (!old || !old.isActive) {
        return res.status(400).json({
          message: "Invalid or already renewed credential",
        });
      }

      if (!old.driver.equals(driverProfile._id)) {
        return res.status(403).json({
          message: "Unauthorized: You can only renew your own credential",
        });
      }
    }

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

    // 🔹 deactivate old credential
    if (renewedFrom) {
      await Credential.findByIdAndUpdate(renewedFrom, {
        isActive: false,
      });
    }
    await logAudit({
      performedBy: req.user.id,
      role: req.user.role,

      action: "ADD_CREDENTIAL",

      resource: "credential",

      resourceId: newCredential._id,

      targetUser: req.user.id,

      category: "Data",

      message: `${driverProfile.firstName + " " + driverProfile.lastName } uploaded a credential`,

      metadata: { 
        credentialId: newCredential._id,
        credentialType: type,
        title,
        renewed: !!renewedFrom,
        driverProfileId: driverProfile._id,
      },

      req,
    });

    return res.status(201).json({
      message: "Credential uploaded successfully",
      data: newCredential,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create credential",
    });
  }
};

// ================= GET ALL (DRIVER) =================
exports.getCredentials = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const driverProfile = await Driver.findOne({
      user: req.user.id,
    });

    if (!driverProfile) {
      return res.status(404).json({ message: "Driver not found" });
    }

    const baseQuery = {
      driver: driverProfile._id,
      isActive: true,
    };

    const page = Math.max(parseInt(req.query.page, 10) || 0, 0);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 0, 0), 100);
    const shouldPaginate = page > 0 && limit > 0;
    const statusFilter = req.query.status && req.query.status !== "all"
      ? req.query.status
      : null;

    const credentials = await Credential.find(baseQuery).sort({ createdAt: -1 });

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

    const filtered = statusFilter
      ? updated.filter((c) => c.status === statusFilter)
      : updated;

    const counts = updated.reduce(
      (acc, c) => {
        acc.total += 1;
        if (acc[c.status] !== undefined) acc[c.status] += 1;
        return acc;
      },
      { total: 0, verified: 0, pending: 0, expired: 0, expiringSoon: 0 },
    );

    if (shouldPaginate) {
      const start = (page - 1) * limit;
      const paginated = filtered.slice(start, start + limit);

      return res.json({
        count: paginated.length,
        total: filtered.length,
        counts,
        pagination: {
          page,
          limit,
          total: filtered.length,
          totalPages: Math.ceil(filtered.length / limit) || 1,
        },
        data: paginated,
      });
    }

    return res.json({
      count: updated.length,
      counts,
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch credentials",
    });
  }
};

// ================= GET SINGLE (DRIVER) =================
exports.getSingleCredential = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const driverProfile = await Driver.findOne({
      user: req.user.id,
    });

    if (!driverProfile) {
      return res.status(404).json({ message: "Driver not found" });
    }

    const credential = await Credential.findOne({
      _id: req.params.id,
      driver: driverProfile._id,
      isActive: true,
    });

    if (!credential) {
      return res.status(404).json({
        message: "Credential not found",
      });
    }

    let status = credential.status;

    if (credential.status === "verified" && credential.expiryDate) {
      const diffDays =
        (new Date(credential.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);

      if (diffDays < 0) status = "expired";
      else if (diffDays <= 30) status = "expiringSoon";
    }

    return res.json({
      data: {
        ...credential.toObject(),
        status,
        category: "credential",
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch credential",
    });
  }
};

// ================= GET DRIVER CREDENTIALS (CARRIER / ADMIN) =================
exports.getDriverCredentialsById = async (req, res) => {
  try {
    const { driverId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(driverId)) {
      return res.status(400).json({
        message: "Invalid driver ID",
      });
    }

    const driver = await Driver.findById(driverId);

    if (!driver) {
      return res.status(404).json({
        message: "Driver not found",
      });
    }

    const credentialQuery = {
      driver: driver._id,
      isActive: true,
    };

    if (req.user.role === "carrier") {
      credentialQuery.status = "verified";
    }

    const credentials = await Credential.find(credentialQuery).sort({
      createdAt: -1,
    });

    await logAudit({
      performedBy: req.user._id,
      role: req.user.role,

      action: "VIEW_CREDENTIAL",

      resource: "credential",

      resourceId: driver._id,

      targetUser: driver.user || driver._id,

      category: "Access",

      message: `${req.user.role} viewed driver credentials`,

      metadata: {
        credentialCount: credentials.length,
        driverId: driver._id,
      },

      req,
    });


    return res.status(200).json({
      count: credentials.length,
      data: credentials,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch credentials",
    });
  }
};
