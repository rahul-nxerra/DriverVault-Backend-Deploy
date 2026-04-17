const mongoose = require("mongoose");

const accessRequestSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },
    carrier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    complianceAccepted: {
      type: Boolean,
      default: false,
    },

    expiresAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

//  prevent duplicate active request
accessRequestSchema.index(
  { driver: 1, carrier: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);

module.exports = mongoose.model("AccessRequest", accessRequestSchema);