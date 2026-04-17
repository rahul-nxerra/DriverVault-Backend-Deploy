const mongoose = require("mongoose");

const carrierSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    companyName: {
      type: String,
      required: true,
      trim: true
    },
    dotNumber: {
      type: String,
      required: true,
      unique: true
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Carrier", carrierSchema);