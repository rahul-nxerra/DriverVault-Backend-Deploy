const mongoose = require("mongoose");

const accessRequestSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },

    carrierProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Carrier",
      required: true,
    },

    // 🔹 REQUEST STATUS
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "revoked"],
      default: "pending",
    },

    // 🔹 WHAT CARRIER REQUESTED (NEW)
    requestedData: {
      personalInfo: { type: Boolean, default: false },
      cdl: { type: Boolean, default: false },
      safety: { type: Boolean, default: false },
      employment: { type: Boolean, default: false },
      performance: { type: Boolean, default: false },
      medical: { type: Boolean, default: false },
      financial: { type: Boolean, default: false },
    },

    // 🔹 WHAT DRIVER APPROVED
    allowedData: {
      personalInfo: { type: Boolean, default: false },
      cdl: { type: Boolean, default: false },
      safety: { type: Boolean, default: false },
      employment: { type: Boolean, default: false },
      performance: { type: Boolean, default: false },
      medical: { type: Boolean, default: false },
      financial: { type: Boolean, default: false },
    },

    // 🔹 TYPE OF ACCESS
    accessType: {
      type: String,
      enum: ["view", "download"],
      default: "view",
    },

    // 🔹 OPTIONAL MESSAGE FROM CARRIER
    reason: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    // 🔹 EXISTING FIELDS (UNCHANGED)
    complianceAccepted: {
      type: Boolean,
      default: false,
    },

    expiresAt: {
      type: Date,
    },

    notes: {
      type: String,
      trim: true,
    },

    consentVersion: {
      type: String,
      default: null,
    },

    consentGivenAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// ✅ INDEX (keep as is)
accessRequestSchema.index(
  { driver: 1, carrierProfile: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } },
);

module.exports = mongoose.model("AccessRequest", accessRequestSchema);