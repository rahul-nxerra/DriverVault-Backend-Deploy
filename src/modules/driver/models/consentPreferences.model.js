const mongoose = require("mongoose");

const consentPreferencesSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
      unique: true,
    },

    personalInfo: { type: Boolean, default: true },
    cdl: { type: Boolean, default: true },
    safety: { type: Boolean, default: true },
    employment: { type: Boolean, default: true },
    performance: { type: Boolean, default: true },
    medical: { type: Boolean, default: false },
    financial: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "ConsentPreferences",
  consentPreferencesSchema
);