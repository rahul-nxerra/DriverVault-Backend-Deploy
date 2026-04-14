const mongoose = require("mongoose");

const credentialSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "license",
        "medical",
        "hazmat",
        "training",
        "twic",
        "safety",
        "other",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    issuedBy: String,
    expiryDate: Date,
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Credential", credentialSchema);
