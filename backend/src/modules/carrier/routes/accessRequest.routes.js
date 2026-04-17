const express = require("express");
const router = express.Router();

const asyncHandler = require("express-async-handler");

const { protect } = require("../../../middlewares/auth.middleware");
const { authorizeRoles } = require("../../../middlewares/role.middleware");

const {
  requestAccess,
} = require("../controllers/accessRequest.controller");

// ================= CARRIER =================

// Request access to driver data
router.post(
  "/",
  protect,
  authorizeRoles("carrier"),
  asyncHandler(requestAccess)
);

module.exports = router;