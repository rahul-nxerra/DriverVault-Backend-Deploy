const express = require("express");
const router = express.Router();

const asyncHandler = require("express-async-handler");

const { protect } = require("../../../middlewares/auth.middleware");
const { authorizeRoles } = require("../../../middlewares/role.middleware");

const {
  handleAccessRequest,
} = require("../controllers/accessRequest.controller");

// ================= DRIVER =================

// Approve / Reject request
router.patch(
  "/:id",
  protect,
  authorizeRoles("driver"),
  asyncHandler(handleAccessRequest),
);

module.exports = router;
