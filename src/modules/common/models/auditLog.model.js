const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    // Who performed the action
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Role of performer
    role: {
      type: String,
      enum: ["driver", "carrier", "admin"],
      required: true,
    },

    // Action performed
    action: {
      type: String,
      required: true,
      trim: true,
    },

    // Module / resource
    resource: {
      type: String,
      required: true,
      trim: true,
    },

    // Affected resource id
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // Optional target user
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Log category
    category: {
      type: String,
      enum: ["Auth", "Access", "Data", "Admin"],
      default: "Data",
    },

    // Human readable message
    message: {
      type: String,
      trim: true,
      default: "",
    },

    // Extra info
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Request info
    ipAddress: {
      type: String,
      default: null,
    },

    userAgent: {
      type: String,
      default: null,
    },

    endpoint: {
      type: String,
      default: null,
    },

    method: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
auditLogSchema.index({ performedBy: 1 });

auditLogSchema.index({ targetUser: 1 });

auditLogSchema.index({ createdAt: -1 });

auditLogSchema.index({ action: 1 });

auditLogSchema.index({ resource: 1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);