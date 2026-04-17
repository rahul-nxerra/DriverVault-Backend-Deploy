const AccessRequest = require("../../common/models/accessRequest.model");

exports.requestAccess = async (req, res) => {
  const { driverId } = req.body;

  // prevent duplicate
  const existing = await AccessRequest.findOne({
    driver: driverId,
    carrier: req.user.id,
    status: "pending",
  });

  if (existing) {
    return res.status(400).json({
      message: "Request already pending",
    });
  }

  const request = await AccessRequest.create({
    driver: driverId,
    carrier: req.user.id,
  });

  res.json({
    message: "Access request sent",
    request,
  });
};