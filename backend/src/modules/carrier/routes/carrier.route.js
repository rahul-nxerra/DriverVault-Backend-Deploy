const express = require("express");
const router = express.Router();

const { protect } = require("../../../middlewares/auth.middleware");
const { authorizeRoles } = require("../../../middlewares/role.middleware");

const asyncHandler = require("express-async-handler");

const accessRequestRoutes = require("./accessRequest.routes");

// ================= SUB ROUTES =================

// Access request system
router.use("/access-request", accessRequestRoutes);

// ================= OPTIONAL FUTURE =================

// Example: carrier profile

module.exports = router;
