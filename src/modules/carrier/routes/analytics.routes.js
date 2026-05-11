const express = require("express");
const router = express.Router();

const asyncHandler = require("express-async-handler");
const { protect } = require("../../../middlewares/auth.middleware");
const { authorizeRoles } = require("../../../middlewares/role.middleware");
const { analyticsLimiter } = require("../../../middlewares/rateLimit.middleware");

const { getCarrierAnalytics } = require("../controllers/analytics.controller");

// GET /api/carrier/analytics
router.get(
  "/",
  protect,
  authorizeRoles("carrier"),
  analyticsLimiter,
  asyncHandler(getCarrierAnalytics)
);

module.exports = router;