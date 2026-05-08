const mongoose = require("mongoose");

const performanceRecordSchema = new mongoose.Schema({
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
    required: true,
  },

  isActive: {
    type: Boolean,
    default: true,
  },

  type: {
    type: String,
    required: true,
    enum: [
      "clean_inspection",
      "training_completed",
      "late_delivery",
      "incident",
      "attendance",
    ],
  },

  category: {
    type: String,
    enum: ["safety", "reliability", "training"],
    required: true,
  },

  impact: {
    type: Number, // +2, -3, etc
    required: true,
  },

  date: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["verified", "pending", "rejected", "disputed"],
    default: "verified",
  },
  description: String,
});

module.exports = mongoose.model("PerformanceRecord", performanceRecordSchema);
