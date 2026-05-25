const AuditLog = require("../modules/common/models/auditLog.model");

exports.logAudit = async ({
  performedBy,
  role,
  action,
  resource,
  resourceId = null,
  targetUser = null,
  category = "Data",
  message = "",
  metadata = {},
  req,
}) => {
  try {
    console.log("targetUser", targetUser);
    
    await AuditLog.create({
      performedBy,
      role,
      action,
      resource,
      resourceId,
      targetUser,
      category,
      message,
      metadata,

      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      endpoint: req.originalUrl,
      method: req.method,
    });
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
};