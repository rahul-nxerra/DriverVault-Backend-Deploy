const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const { authorizeRoles } = require("../../../middlewares/role.middleware");
const { getUser, getUserById, createUserByAdmin, updateUserByAdmin } = require("../controllers/user");
const {register } = require("../../auth/auth.controller")
const { protect } = require("../../../middlewares/auth.middleware");

router.get("/all-user", protect, authorizeRoles("admin"), asyncHandler(getUser));
router.get("/:id", protect, authorizeRoles("admin"), asyncHandler(getUserById));
router.post("/create", protect, authorizeRoles("admin"), asyncHandler(register));
router.put("/:id/status", protect, authorizeRoles("admin"), asyncHandler(updateUserByAdmin));

module.exports = router;
