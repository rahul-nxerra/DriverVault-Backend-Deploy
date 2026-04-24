const mongoose = require("mongoose");

const employmentSchema = new mongoose.Schema(
  {
    //  Driver reference
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },

    //  Company details
    company: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      required: true,
      trim: true,
    },

    //  Dates
    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
    },

    isCurrent: {
      type: Boolean,
      default: false,
    },

    //  Dispute system status
    status: {
      type: String,
      enum: ["active", "disputed", "corrected"],
      default: "active",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Employment", employmentSchema);
