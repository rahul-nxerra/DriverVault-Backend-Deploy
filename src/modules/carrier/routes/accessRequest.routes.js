const express = require("express");
const router = express.Router();

const validate = require("../../../middlewares/validate.middleware");
const {
  requestAccessSchema,
} = require("../../common/validators/accessRequest.validator");
const asyncHandler = require("express-async-handler");
const { protect } = require("../../../middlewares/auth.middleware");
const { authorizeRoles } = require("../../../middlewares/role.middleware");
const { searchLimiter } = require("../../../middlewares/rateLimit.middleware");
const accessController = require("../../driver/controllers/accessRequest.controller");

const {
  requestAccess,
  getCarrierAccessRequests,
  searchDriversForAccessRequest,
} = require("../controllers/accessRequest.controller");

// ================= CARRIER =================

// Search verified drivers while creating a new access request
router.get(
  "/drivers/search",
  protect,
  authorizeRoles("carrier"),
  searchLimiter,
  asyncHandler(searchDriversForAccessRequest)
);

// Track requests sent by this carrier
router.get(
  "/",
  protect,
  authorizeRoles("carrier"),
  asyncHandler(getCarrierAccessRequests)
);

// Request access to driver data
router.post(
  "/",
  protect,
  authorizeRoles("carrier"),
  validate(requestAccessSchema),
  asyncHandler(requestAccess)
);

router.post(
  "/",
  protect,
  authorizeRoles("carrier"),
  validate(requestAccessSchema),
  asyncHandler(requestAccess)
);

router.patch(
  "/revoke/:id",
  protect,
  authorizeRoles("carrier"),
  asyncHandler(accessController.handleAccessRequest)
)
module.exports = router;
