const express = require("express");
const router = express.Router();
const credentialController = require("../controllers/credential.controller");

const { protect } = require("../../../middlewares/auth.middleware");
const { authorizeRoles } = require("../../../middlewares/role.middleware");
const asyncHandler = require("express-async-handler");

const upload = require("../../../middlewares/upload.middleware");

const {
  createCredentialSchema,
} = require("../validators/credential.validator");
const validate = require("../../../middlewares/validate.middleware");

const checkDriverAccess = require("../../../middlewares/checkDriverAccess");

// ================= CARRIER / ADMIN ROUTE =================
// MUST BE BEFORE /:id
router.get(
  "/view/:driverId",
  protect,
  authorizeRoles("carrier", "admin"),
  checkDriverAccess("cdl"), // ✅ Plan B (cdl not credential)
  asyncHandler(credentialController.getDriverCredentialsById)
);

// ================= CREATE CREDENTIAL =================
router.post(
  "/",
  protect,
  authorizeRoles("driver"),
  validate(createCredentialSchema),
  upload.single("document"),
  asyncHandler(credentialController.createCredential)
);

// ================= GET ALL CREDENTIAL =================
router.get(
  "/",
  protect,
  authorizeRoles("driver"),
  asyncHandler(credentialController.getCredentials)
);

// ================= GET SINGLE CREDENTIAL =================
router.get(
  "/:id",
  protect,
  authorizeRoles("driver"),
  asyncHandler(credentialController.getSingleCredential)
);

module.exports = router;