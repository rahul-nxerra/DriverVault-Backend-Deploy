const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const { authorizeRoles } = require("../../../middlewares/role.middleware");
const { protect } = require("../../../middlewares/auth.middleware");
const { getCredential, updateCredentialStatus } = require("../controllers/credential");

router.get("/list", protect, authorizeRoles("admin"), asyncHandler(getCredential));
router.put("/:id/status", protect, authorizeRoles("admin"), asyncHandler(updateCredentialStatus));

module.exports = router;