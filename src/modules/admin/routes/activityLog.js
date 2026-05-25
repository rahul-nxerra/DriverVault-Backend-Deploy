const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const { authorizeRoles } = require("../../../middlewares/role.middleware");
const { protect } = require("../../../middlewares/auth.middleware");
const { getAdminActivity } = require("../controllers/activityLog");

router.get("/list", protect, authorizeRoles("admin"), asyncHandler(getAdminActivity));

module.exports = router;