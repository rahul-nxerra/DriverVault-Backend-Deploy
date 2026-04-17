const PerformanceRecord = require("../models/performanceRecord.model");
const mongoose = require("mongoose");
const {
  calculateScores,
  getDecayWeight,
  getDriverPerformanceData,
} = require("../../../services/performance.service");

const Driver = require("../models/driver.model");

// ================= GET FULL PERFORMANCE =================

exports.getPerformance = async (req, res) => {
  const driverProfile = await Driver.findOne({
    user: req.user.id,
  });

  if (!driverProfile) {
    return res.status(404).json({
      message: "Driver profile not found",
    });
  }

  const { records, scores, history } = await getDriverPerformanceData(
    driverProfile._id,
  );

  res.json({
    scores,
    history,
    records,
  });
};

// ================= GET ONLY RECORDS =================
exports.getPerformanceRecords = async (req, res) => {
  const driverProfile = await Driver.findOne({
    user: req.user.id,
  });
  if (!driverProfile) {
    return res.status(404).json({
      message: "Driver profile not found",
    });
  }

  const records = await PerformanceRecord.find({
    driver: driverProfile._id,
    isActive: true,
    status: "verified",
  }).sort({ date: -1 });

  res.json(records);
};
