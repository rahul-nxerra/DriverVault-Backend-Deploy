const AccessRequest = require("../modules/common/models/accessRequest.model");

module.exports = async (req, res, next) => {
  const { driverId } = req.params;

  const access = await AccessRequest.findOne({
    driver: driverId,
    carrier: req.user.id,
    status: "approved",
    complianceAccepted: true,
    expiresAt: { $gt: new Date() },
  });

  if (!access) {
    return res.status(403).json({
      message: "Access denied",
    });
  }

  next();
};