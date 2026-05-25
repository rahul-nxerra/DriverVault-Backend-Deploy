const AuditLog = require("../../common/models/auditLog.model")

exports.getAdminActivity = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 });
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
