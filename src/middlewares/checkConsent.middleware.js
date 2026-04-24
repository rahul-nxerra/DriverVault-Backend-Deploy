const ConsentPreferences = require("../modules/driver/models/consentPreferences.model");
const mongoose = require("mongoose");

const checkConsent = (resource) => {
  return async (req, res, next) => {
    try {
      const { driverId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(driverId)) {
        return res.status(400).json({
          message: "Invalid driver ID",
        });
      }

      const prefs = await ConsentPreferences.findOne({ driverId });

      // if no prefs → allow (can change later)
      if (!prefs) return next();

      if (!prefs[resource]) {
        return res.status(403).json({
          message: `${resource} data not shared by driver`,
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        message: "Consent validation failed",
      });
    }
  };
};

module.exports = checkConsent;