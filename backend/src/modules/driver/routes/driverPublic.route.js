const express = require("express");
const router = express.Router();
const performanceController = require("../controllers/performance.controller");
const { protect } = require("../../../middlewares/auth.middleware");
const { authorizeRoles } = require("../../../middlewares/role.middleware");
const asyncHandler = require("express-async-handler");
const checkAccess = require("../../../middlewares/checkAccess");

// 🔐 Carrier/Admin access
router.get(
  "/drivers/:driverId/performance",
  protect,
  authorizeRoles("carrier", "admin"),
  checkAccess,
  asyncHandler(performanceController.getDriverPerformanceById),
);

module.exports = router;
