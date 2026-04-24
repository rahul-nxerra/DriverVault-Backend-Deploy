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

// SUB ROUTES
const performanceRoutes = require("./performance.routes");
const credentialRoutes = require("./credential.routes");
const accessRequestRoutes = require("./accessRequest.routes");
const driverPublicRoutes = require("./driverPublic.route");
const employmentRoutes = require("./employment.routes");
const disputeRoutes = require("./dispute.routes");
const consentRoutes = require("./consent.routes");

// ================= SUB ROUTES MOUNTING=================

router.use("/performance", performanceRoutes);
router.use("/credentials", credentialRoutes);
router.use("/", accessRequestRoutes);
router.use("/employment", employmentRoutes);
router.use("/disputes", disputeRoutes);
router.use("/consent", consentRoutes);

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
  "/update",
  protect,
  authorizeRoles("driver"),
  upload.single("profilePhoto"),
  validate(updateProfileSchema),
  asyncHandler(driverController.updateDriverProfile),
);

// ================= PUBLIC ROUTE =================

// 🌐 Public driver profile (no auth)
router.get("/public/:id", driverController.getPublicDriverProfile);

module.exports = router;
