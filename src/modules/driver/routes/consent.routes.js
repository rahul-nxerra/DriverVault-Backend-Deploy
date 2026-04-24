const express = require("express");
const router = express.Router();
const validate = require("../../../middlewares/validate.middleware");
const { updateConsentSchema } = require("../validators/consent.validator");
const controller = require("../controllers/consent.controller");

const { protect } = require("../../../middlewares/auth.middleware");
const { authorizeRoles } = require("../../../middlewares/role.middleware");

// ================= CONSENT PREFERENCES =================

// 🔥 GET preferences (driver only)
router.get(
  "/preferences",
  protect,
  authorizeRoles("driver"),
  controller.getPreferences,
);

// 🔥 UPDATE preferences (driver only)
router.put(
  "/preferences",
  protect,
  authorizeRoles("driver"),
  validate(updateConsentSchema),
  controller.updatePreferences,
);

module.exports = router;
