const express = require("express");
const router = express.Router();
const driverController = require("./driver.controller");
const { protect } = require("../../middlewares/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");
const asyncHandler = require("express-async-handler");
const upload = require("../../middlewares/upload.middleware");

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
  upload.single("profilePhoto"),
  asyncHandler(driverController.updateDriverProfile),
);

// ================= CREDENTIAL ROUTE =================

// ================= CREATE CREDENTIAL  =================
router.post(
  "/credentials",
  protect,
  authorizeRoles("driver"),
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
