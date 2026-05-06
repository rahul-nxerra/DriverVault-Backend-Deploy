const PerformanceRecord = require("../models/performanceRecord.model");
const mongoose = require("mongoose");
const { logAudit } = require("../../../utils/auditLogger");
const { getDriverPerformanceData } = require("../services/performance.service");
const Driver = require("../models/driver.model");

// ================= HELPER =================
const getDriverFromUser = async (userId) => {
  return await Driver.findOne({ user: userId });
};

// ================= GET FULL PERFORMANCE =================
exports.getPerformance = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const driver = await getDriverFromUser(req.user.id);

    if (!driver) {
      return res.status(404).json({
        message: "Driver profile not found",
      });
    }

    const { records, scores, history } = await getDriverPerformanceData(
      driver._id,
    );

    const includeRecords = req.query.includeRecords !== "false";

    return res.json({
      scores,
      history,
      records: includeRecords ? records : [],
      recordsCount: records.length,
    });
  } catch (error) {
    console.error("Get Performance Error:", error);

    return res.status(500).json({
      message: "Failed to fetch performance data",
    });
  }
};

// ================= GET ONLY RECORDS =================
exports.getPerformanceRecords = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const driver = await getDriverFromUser(req.user.id);

    if (!driver) {
      return res.status(404).json({
        message: "Driver profile not found",
      });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 0, 0);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 0, 0), 100);
    const shouldPaginate = page > 0 && limit > 0;

    const query = {
      driver: driver._id,
      status: "verified",
    };

    let recordsQuery = PerformanceRecord.find(query).sort({ date: -1 });

    if (shouldPaginate) {
      recordsQuery = recordsQuery.skip((page - 1) * limit).limit(limit);
    }

    const [records, total] = await Promise.all([
      recordsQuery,
      PerformanceRecord.countDocuments(query),
    ]);

    const response = {
      count: records.length,
      total,
      data: records,
    };

    if (shouldPaginate) {
      response.pagination = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      };
    }

    return res.json(response);
  } catch (error) {
    console.error("Get Performance Records Error:", error);

    return res.status(500).json({
      message: "Failed to fetch performance records",
    });
  }
};

// ================= CARRIER / ADMIN ACCESS =================
exports.getDriverPerformanceById = async (req, res) => {
  try {
    const { driverId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(driverId)) {
      return res.status(400).json({
        message: "Invalid driver ID",
      });
    }

    const driver = await Driver.findById(driverId);

    if (!driver) {
      return res.status(404).json({
        message: "Driver not found",
      });
    }

    const { records, scores, history } = await getDriverPerformanceData(
      driver._id,
    );

    // audit log
    await logAudit({
      actorId: req.carrier?._id || req.user.id,
      actorType: req.user.role,
      action: "VIEW_PERFORMANCE",
      resource: "performance",
      resourceId: driver._id,
      targetDriverId: driver._id,
      metadata: { recordsCount: records.length },
      req,
    });

    return res.json({
      scores,
      history,
      records,
    });
  } catch (error) {
    console.error("Get Driver Performance Error:", error);

    return res.status(500).json({
      message: "Failed to fetch driver performance",
    });
  }
};
