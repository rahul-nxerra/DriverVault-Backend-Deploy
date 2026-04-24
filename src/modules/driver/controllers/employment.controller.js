const Employment = require("../models/employment.model");
const Driver = require("../models/driver.model");
const mongoose = require("mongoose");
const { logAudit } = require("../../../utils/auditLogger");

// ================= CREATE EMPLOYMENT =================
exports.createEmployment = async (req, res) => {
  try {
    const driver = await Driver.findOne({ user: req.user.id });

    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    const { company, role, startDate, endDate, isCurrent } = req.body;

    if (!company || !role || !startDate) {
      return res.status(400).json({
        message: "Company, role and startDate are required",
      });
    }

    const employment = await Employment.create({
      driver: driver._id,
      company,
      role,
      startDate,
      endDate,
      isCurrent,
    });

    return res.status(201).json({
      message: "Employment added successfully",
      data: employment,
    });
  } catch (error) {
    console.error("Create Employment Error:", error);
    return res.status(500).json({
      message: "Failed to create employment",
    });
  }
};

// ================= GET ALL EMPLOYMENT =================
exports.getEmployment = async (req, res) => {
  try {
    const driver = await Driver.findOne({ user: req.user.id });

    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }
    const employment = await Employment.find({
      driver: driver._id,
    }).sort({ startDate: -1 });

    const formatted = employment.map((e) => ({
      ...e.toObject(),
      category: "employment",
    }));

    return res.status(200).json({
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    console.error("Get Employment Error:", error);
    return res.status(500).json({
      message: "Failed to fetch employment records",
    });
  }
};

// ================= GET SINGLE EMPLOYMENT =================
exports.getSingleEmployment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid employment ID",
      });
    }

    const driver = await Driver.findOne({ user: req.user.id });

    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    const employment = await Employment.findById(id);

    if (!employment) {
      return res.status(404).json({
        message: "Employment not found",
      });
    }

    // 🔐 Ownership check
    if (employment.driver.toString() !== driver._id.toString()) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    return res.status(200).json({
      data: {
        ...employment.toObject(),
        category: "employment",
      },
    });
  } catch (error) {
    console.error("Get Single Employment Error:", error);
    return res.status(500).json({
      message: "Failed to fetch employment",
    });
  }
};

// ================= UPDATE EMPLOYMENT =================
exports.updateEmployment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid employment ID",
      });
    }

    const driver = await Driver.findOne({ user: req.user.id });

    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    const employment = await Employment.findById(id);

    if (!employment) {
      return res.status(404).json({
        message: "Employment not found",
      });
    }

    if (employment.driver.toString() !== driver._id.toString()) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    const allowedFields = [
      "company",
      "role",
      "startDate",
      "endDate",
      "isCurrent",
      "status",
    ];

    Object.keys(req.body).forEach((key) => {
      if (allowedFields.includes(key)) {
        employment[key] = req.body[key];
      }
    });

    await employment.save();

    return res.status(200).json({
      message: "Employment updated successfully",
      data: employment,
    });
  } catch (error) {
    console.error("Update Employment Error:", error);
    return res.status(500).json({
      message: "Failed to update employment",
    });
  }
};

// ================= DELETE EMPLOYMENT =================
exports.deleteEmployment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid employment ID",
      });
    }

    const driver = await Driver.findOne({ user: req.user.id });

    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    const employment = await Employment.findById(id);

    if (!employment) {
      return res.status(404).json({
        message: "Employment not found",
      });
    }

    if (employment.driver.toString() !== driver._id.toString()) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    await employment.deleteOne();

    return res.status(200).json({
      message: "Employment deleted successfully",
    });
  } catch (error) {
    console.error("Delete Employment Error:", error);
    return res.status(500).json({
      message: "Failed to delete employment",
    });
  }
};

exports.getDriverEmploymentById = async (req, res) => {
  try {
    const { driverId } = req.params;

    // validate driverId
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

    const employment = await Employment.find({
      driver: driver._id,
    }).sort({ startDate: -1 });

    await logAudit({
      actorId: req.carrier?._id || req.user.id,
      actorType: req.user.role,
      action: "VIEW_EMPLOYMENT",
      resource: "employment",
      resourceId: driver._id,
      targetDriverId: driver._id,
      req,
    });

    return res.status(200).json({
      count: employment.length,
      data: employment,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch employment data",
    });
  }
};
