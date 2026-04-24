const mongoose = require("mongoose");
const AccessRequest = require("../modules/common/models/accessRequest.model");
const Carrier = require("../modules/carrier/models/carrier.model");

const checkDriverAccess = (resource) => {
  return async (req, res, next) => {
    try {
      const { driverId } = req.params;

      // 🔹 auth check
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // 🔹 role check
      if (req.user.role !== "carrier" && req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      // 🔹 validate driverId
      if (!mongoose.Types.ObjectId.isValid(driverId)) {
        return res.status(400).json({ message: "Invalid driver ID" });
      }

      // 🔹 admin bypass
      if (req.user.role === "admin") {
        return next();
      }

      // 🔹 get carrier profile
      const carrier = await Carrier.findOne({ user: req.user.id });

      if (!carrier) {
        return res.status(403).json({
          message: "Carrier profile not found",
        });
      }

      // 🔹 find approved access
      const access = await AccessRequest.findOne({
        driver: driverId,
        carrierProfile: carrier._id,
        status: "approved",
      });

      if (!access) {
        return res.status(403).json({
          message: "Access not granted",
        });
      }

      // 🔹 expiry check
      if (access.expiresAt && access.expiresAt < new Date()) {
        return res.status(403).json({
          message: "Access expired",
        });
      }

      // (NO CONSENT)
      if (!access.allowedData || !access.allowedData[resource]) {
        return res.status(403).json({
          message: `${resource} access not allowed`,
        });
      }

      // 🔹 attach for later use
      req.access = access;
      req.carrier = carrier;

      next();
    } catch (error) {
      return res.status(500).json({
        message: "Access validation failed",
      });
    }
  };
};

module.exports = checkDriverAccess;