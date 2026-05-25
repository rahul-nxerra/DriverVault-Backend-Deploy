const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const { authorizeRoles } = require("../../../middlewares/role.middleware");
const { protect } = require("../../../middlewares/auth.middleware");
const { getdispute, updatedispute } = require("../controllers/dispute");

router.get("/list", protect, authorizeRoles("admin"), asyncHandler(getdispute));
router.put("/:id/status", protect, authorizeRoles("admin"), asyncHandler(updatedispute));

module.exports = router;