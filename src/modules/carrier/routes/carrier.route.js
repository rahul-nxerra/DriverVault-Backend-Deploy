const express = require("express");
const router = express.Router();
const { protect } = require("../../../middlewares/auth.middleware");
const { authorizeRoles } = require("../../../middlewares/role.middleware");
const { analyticsLimiter } = require("../../../middlewares/rateLimit.middleware");
const asyncHandler = require("express-async-handler");
const accessRequestRoutes = require("./accessRequest.routes");
const {
  getVerifiedDrivers,
  getMyDrivers,
} = require("../controllers/accessRequest.controller");

const analyticsRoutes = require("./analytics.routes");
const { getDashboard, getCarrierActivity } = require("../controllers/carrier.controller");
// ================= SUB ROUTES =================

// Access request system
router.use("/access-requests", accessRequestRoutes);
router.use("/analytics", analyticsRoutes);

// Verified driver discovery for carriers
router.get(
  "/drivers",
  protect,
  authorizeRoles("carrier"),
  analyticsLimiter,
  asyncHandler(getVerifiedDrivers),
);

// Drivers dashboard with active approved access 
router.get(
  "/dashboard",
  protect,
  authorizeRoles("carrier"),
  analyticsLimiter,
  asyncHandler(getDashboard)
);
// Drivers with active approved access for this carrier
router.get(
  "/my-drivers",
  protect,
  authorizeRoles("carrier"),
  asyncHandler(getMyDrivers),
);

router.get(
  "/activity",
  protect,
  authorizeRoles("carrier"),
  asyncHandler(getCarrierActivity),
);
// ================= OPTIONAL FUTURE =================

// Example: carrier profile

module.exports = router;
