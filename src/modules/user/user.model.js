const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["driver", "carrier", "admin"],
      required: true,
    },
    status:{
      type: String,
      enum: ["active", "pending", "delete","suspend"],
      default: "active",
    }
  },
  { timestamps: true }
);

// ✅ Prevent overwrite error
module.exports =
  mongoose.models.User || mongoose.model("User", userSchema);