const express = require("express");
const router = express.Router();
const driverController = require("../controllers/driver.controller");
const { protect } = require("../../../middlewares/auth.middleware");
const { authorizeRoles } = require("../../../middlewares/role.middleware");
const asyncHandler = require("express-async-handler");
const upload = require("../../../middlewares/upload.middleware");
const {
  createCredentialSchema,
} = require("../validators/credential.validator");
const { updateProfileSchema } = require("../validators/driver.validator");
const validate = require("../../../middlewares/validate.middleware");

// ================= PRIVATE ROUTES =================

// 🔐 Get own profile
router.get(
  "/profile",
  protect,
  authorizeRoles("driver"),
  asyncHandler(driverController.getDriverProfile),
);

// ================= DRIVER UPDATE OWN PROFILE =================
router.put(
  "/profile/update",
  protect,
  authorizeRoles("driver"),
  validate(updateProfileSchema),
  upload.single("profilePhoto"),
  asyncHandler(driverController.updateDriverProfile),
);

// ================= CREDENTIAL ROUTE =================

// ================= CREATE CREDENTIAL  =================
router.post(
  "/credentials",
  protect,
  authorizeRoles("driver"),
  validate(createCredentialSchema),
  upload.single("document"),
  asyncHandler(driverController.createCredential),
);
// ================= GET ALL CREDENTIAL =================

router.get(
  "/credentials",
  protect,
  authorizeRoles("driver"),
  driverController.getCredentials,
);

// ================= GET SINGLE CREDENTIAL =================

router.get(
  "/credentials/:id",
  protect,
  authorizeRoles("driver"),
  driverController.getSingleCredential,
);

// ================= PUBLIC ROUTE =================

// 🌐 Public driver profile (no auth)
router.get("/public/:id", driverController.getPublicDriverProfile);

module.exports = router;
