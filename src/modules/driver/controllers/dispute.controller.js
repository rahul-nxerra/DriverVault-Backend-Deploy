const mongoose = require("mongoose");

const Dispute = require("../../common/models/dispute.model");
const Driver = require("../models/driver.model");
const {logAudit} = require("../../../utils/auditLogger")
// ================= CONSTANTS =================

// ✅ allowed categories
const allowedCategories = [
  "safety",
  "reliability",
  "training",
  "employment",
  "credential",
  "other",
];

// ✅ category → internal category
const mapCategory = (category) => {
  if (["safety", "reliability", "training"].includes(category)) {
    return "performance";
  }

  if (category === "employment") return "employment";
  if (category === "credential") return "credential";

  return "other";
};

// ✅ category → model
const detectModel = (category) => {
  if (["safety", "reliability", "training"].includes(category)) {
    return "PerformanceRecord";
  }

  if (category === "employment") {
    return "Employment";
  }

  if (category === "credential") {
    return "Credential";
  }

  return null;
};

// ================= CREATE DISPUTE =================

exports.createDispute = async (req, res) => {
  try {
    const { title, description, category, relatedRecord } = req.body;

    //  validate required fields
    if (!title || !description || !category) {
      return res.status(400).json({
        message: "title, description, category are required",
      });
    }

    //  strict category check
    if (!allowedCategories.includes(category)) {
      return res.status(400).json({
        message: "Invalid category.",
      });
    }

    if (category !== "other" && !relatedRecord) {
      return res.status(400).json({
        message: "relatedRecord ID is required for this category",
      });
    }

    //  get driver
    const driver = await Driver.findOne({ user: req.user.id });

    if (!driver) {
      return res.status(404).json({
        message: "Driver not found",
      });
    }

    //  detect model
    const relatedModel = detectModel(category);

    let record = null;

    //  validate related record
    if (relatedModel && relatedRecord) {
      if (!mongoose.Types.ObjectId.isValid(relatedRecord)) {
        return res.status(400).json({
          message: "Invalid relatedRecord ID",
        });
      }

      const Model = mongoose.model(relatedModel);
      record = await Model.findById(relatedRecord);

      if (!record) {
        return res.status(404).json({
          message: "Related record not found",
        });
      }

      const existing = await Dispute.findOne({
        driver: driver._id,
        relatedRecord,
        status: { $in: ["submitted", "under_review"] },
      });

      if (existing) {
        return res.status(400).json({
          message: "You have already raised a dispute for this record",
        });
      }
      // 🔐 ownership check
      if (record.driver && record.driver.toString() !== driver._id.toString()) {
        return res.status(403).json({
          message: "Unauthorized record access",
        });
      }
    }

    // ================= FILE HANDLING =================

    let evidenceUrl = null;
    let evidenceId = null;

    if (req.file) {
      evidenceUrl = req.file.path; // Cloudinary URL
      evidenceId = req.file.filename; // public_id
    }

    // ================= CREATE DISPUTE =================

    const dispute = await Dispute.create({
      driver: driver._id,
      title,
      description,
      category: mapCategory(category), // internal category
      relatedModel,
      relatedRecord: record ? record._id : null,

      
      evidenceUrl,
      evidenceId,
    });

    await logAudit({
          performedBy: req.user.id,
          role: req.user.role,
    
          action: "ADD_DISPUTE",
    
          resource: "dispute",
    
          resourceId: dispute._id,
    
          targetUser: req.user.id,
    
          category: "Data",
    
          message: `${driver.firstName + " " + driver.lastName } uploaded a credential`,
    
          metadata: { 
            disputeId: dispute._id,
            title,
            driverProfileId: driver._id,
          },
    
          req,
        });
    

    return res.status(201).json({
      message: "Dispute submitted successfully",
      data: dispute,
    });
  } catch (error) {
    console.error("Create Dispute Error:", error);

    return res.status(500).json({
      message: "Failed to create dispute",
    });
  }
};
// ================= GET MY DISPUTES =================

exports.getMyDisputes = async (req, res) => {
  try {
    const driver = await Driver.findOne({ user: req.user.id });

    if (!driver) {
      return res.status(404).json({
        message: "Driver not found",
      });
    }

    const disputes = await Dispute.find({
      driver: driver._id,
    })
      .sort({ createdAt: -1 })
      .populate("relatedRecord");

    return res.status(200).json({
      count: disputes.length,
      data: disputes,
    });
  } catch (error) {
    console.error("Get Disputes Error:", error);

    return res.status(500).json({
      message: "Failed to fetch disputes",
    });
  }
};

// ================= GET SINGLE DISPUTE =================

exports.getDisputeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid dispute ID",
      });
    }

    const driver = await Driver.findOne({ user: req.user.id });

    const dispute = await Dispute.findOne({
      _id: id,
      driver: driver._id,
    }).populate("relatedRecord");

    if (!dispute) {
      return res.status(404).json({
        message: "Dispute not found",
      });
    }

    return res.status(200).json({
      data: dispute,
    });
  } catch (error) {
    console.error("Get Single Dispute Error:", error);

    return res.status(500).json({
      message: "Failed to fetch dispute",
    });
  }
};

// ================= DELETE DISPUTE =================

exports.deleteDispute = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid dispute ID",
      });
    }

    const driver = await Driver.findOne({ user: req.user.id });

    const dispute = await Dispute.findOne({
      _id: id,
      driver: driver._id,
    });

    if (!dispute) {
      return res.status(404).json({
        message: "Dispute not found",
      });
    }

    //  delete only if not processed
    if (dispute.status !== "submitted") {
      return res.status(400).json({
        message: "Cannot delete processed dispute",
      });
    }

    await dispute.deleteOne();

    return res.status(200).json({
      message: "Dispute deleted successfully",
    });
  } catch (error) {
    console.error("Delete Dispute Error:", error);

    return res.status(500).json({
      message: "Failed to delete dispute",
    });
  }
};
