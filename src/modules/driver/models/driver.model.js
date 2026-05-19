const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🟢 BASIC
    profilePhoto: {
      type: String, // will store Cloudinary URL
    },
    profilePhotoId: String,
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    // 🟢 PROFESSIONAL

    licenseType: {
      type: String,
      enum: ["cdl-a", "cdl-b", "non-cdl"],
      required: true,
    },
    experienceYears: {
      type: Number,
      default: 0,
    },
    availability: {
      type: String,
      default: "available",
    },
    bio: String,

    // 🟡 PRIVATE
    phone: String,

    // 🟢 LOCATION
    location: {
      city: String,
      state: String,
      zipCode: String,
    },
    status:{
      type: String,
      enum: ["active", "pending", "delete", "suspend"],
      default: "active",
    }

    // // 🔴 RESTRICTED
    // employmentHistory: [employmentSchema],
  },
  { timestamps: true },
);

// ✅ FIX: Prevent model overwrite error
module.exports =
  mongoose.models.Driver || mongoose.model("Driver", driverSchema);
