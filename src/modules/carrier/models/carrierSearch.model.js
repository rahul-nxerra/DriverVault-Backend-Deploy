const mongoose = require("mongoose");

const carrierSearchSchema = new mongoose.Schema(
  {
    carrierProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Carrier",
      required: true,
      index: true,
    },
    query: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      enum: ["driver_search", "access_request_search"],
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

carrierSearchSchema.index({ carrierProfile: 1, createdAt: -1 });
carrierSearchSchema.index({ carrierProfile: 1, query: 1, source: 1, createdAt: -1 });

module.exports =
  mongoose.models.CarrierSearch ||
  mongoose.model("CarrierSearch", carrierSearchSchema);
