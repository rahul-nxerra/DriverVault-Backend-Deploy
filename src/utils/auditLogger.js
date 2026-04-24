const AuditLog = require("../modules/common/models/auditLog.model");

exports.logAudit = async ({
  actorId,
  actorType,
  action,
  resource,
  resourceId,
  targetDriverId,
  metadata = {},
  req,
}) => {
  try {
    await AuditLog.create({
      actorId,
      actorType,
      action,
      resource,
      resourceId,
      targetDriverId,
      metadata,
      ipAddress: req?.ip,
      userAgent: req?.headers["user-agent"],
      endpoint: req?.originalUrl,
      method: req?.method,
    });
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
};