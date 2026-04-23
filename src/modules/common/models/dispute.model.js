const mongoose = require("mongoose");

const disputeSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },

    // 🔥 WHAT TYPE OF ISSUE
    category: {
      type: String,
      enum: ["performance", "credential", "employment", "other"],
      required: true,
    },

    // 🔥 WHICH RECORD IS BEING DISPUTED
    relatedModel: {
      type: String,
      enum: ["PerformanceRecord", "Credential", "Employment"],
      required: function () {
        return this.category !== "other";
      },
    },

    relatedRecord: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "relatedModel",
      required: function () {
        return this.category !== "other";
      },
    },

    // 🔥 DRIVER INPUT
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    evidenceUrl: String,
    evidenceId: String,

    // 🔄 STATUS FLOW
    status: {
      type: String,
      enum: ["submitted", "under_review", "resolved", "rejected"],
      default: "submitted",
    },

    // 🔥 ADMIN ACTION
    resolution: {
      outcome: {
        type: String,
        enum: ["upheld", "partial", "denied"],
      },

      notes: String,

      scoreImpact: {
        type: String,
        enum: ["no_change", "increase", "decrease", "recalculate"],
      },

      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },

      resolvedAt: Date,
    },
  },
  { timestamps: true },
);

// =================  UNIQUE INDEX =================

//  Prevent duplicate active disputes
disputeSchema.index(
  { driver: 1, relatedRecord: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["submitted", "under_review"] },
      relatedRecord: { $exists: true },
    },
  },
);

module.exports = mongoose.model("Dispute", disputeSchema);
