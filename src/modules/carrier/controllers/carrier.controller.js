const Carrier = require("../models/carrier.model");
const AuditLog = require("../../common/models/auditLog.model")
const { getDashboardData } = require("../services/dashboard.service");

// ================= DASHBOARD CONTROLLER =================

const getDashboard = async (req, res) => {
  const userId = req.user.id;

  // ================= GET CARRIER PROFILE =================

  const carrier = await Carrier.findOne({ user: userId });

  if (!carrier) {
    const error = new Error("Carrier profile not found");
    error.statusCode = 404;
    throw error;
  }

  // ================= GET DASHBOARD DATA =================
  const data = await getDashboardData(carrier._id);

  // ================= RESPONSE =================
  res.status(200).json({
    success: true,
    data,
  });
};


const getCarrierActivity = async (req, res) => {
  try {
    const  id  = req.user.id;

    const logs = await AuditLog.find({
      $or: [{ performedBy: id }, { targetUser: id }],
    })
      .populate({
        path: "performedBy",
        select: "email role",
      })

      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({
      success: true,
      message: "Fetch All Activity successfully",
      data: logs,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Failed to fetch activity logs",
    });
  }
};

module.exports = {
  getDashboard,
  getCarrierActivity
};
