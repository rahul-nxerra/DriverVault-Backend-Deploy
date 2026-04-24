const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    actorType: {
      type: String,
      enum: ["driver", "carrier", "admin"],
      required: true,
    },

    action: {
      type: String,
      required: true,
    },

    resource: {
      type: String,
      required: true,
    },

    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    targetDriverId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    metadata: {
      type: Object,
      default: {},
    },

    ipAddress: String,
    userAgent: String,
    endpoint: String,
    method: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);