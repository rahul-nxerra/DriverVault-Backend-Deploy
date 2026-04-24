const AccessRequest = require("../../common/models/accessRequest.model");
const Carrier = require("../models/carrier.model");
const Driver = require("../../driver/models/driver.model");

exports.requestAccess = async (req, res) => {
  const { driverId, requestedData, accessType, reason } = req.body;

  const driver = await Driver.findById(driverId);
  if (!driver) {
    return res.status(400).json({ message: "Invalid driver." });
  }

  const carrierProfile = await Carrier.findOne({
    user: req.user.id,
  });

  if (!carrierProfile) {
    return res.status(404).json({
      message: "Carrier profile not found",
    });
  }

  if (
    !requestedData ||
    Object.values(requestedData).every((v) => v === false)
  ) {
    return res.status(400).json({
      message: "Select at least one data type",
    });
  }

  const existing = await AccessRequest.findOne({
    driver: driverId,
    carrierProfile: carrierProfile._id,
  });

  if (existing && existing.status === "pending") {
    return res.status(400).json({
      message: "Request already pending",
    });
  }

  const request = await AccessRequest.create({
    driver: driverId,
    carrierProfile: carrierProfile._id,
    requestedData,
    accessType: accessType || "view",
    reason,
  });

  res.status(201).json({
    message: "Access request sent",
    data: request,
  });
};